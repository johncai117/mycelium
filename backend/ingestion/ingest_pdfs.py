#!/usr/bin/env python3
"""
Ingest protocol PDFs into ChromaDB.

Usage:
    python ingest_pdfs.py --pdf_dir /path/to/pdfs --chroma_dir ./chroma_db
"""

import argparse
import hashlib
import logging
import re
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger(__name__)

SECTION_PATTERNS = [
    r"^\s*\d+\.\s+(background|introduction|rationale)",
    r"^\s*\d+\.\s+(objective|aim|purpose)",
    r"^\s*\d+\.\s+(study design|design)",
    r"^\s*\d+\.\s+(study setting|data source|database)",
    r"^\s*\d+\.\s+(study population|cohort|eligibility|inclusion|exclusion)",
    r"^\s*\d+\.\s+(variable|exposure|outcome|covariate)",
    r"^\s*\d+\.\s+(study size|sample size|power)",
    r"^\s*\d+\.\s+(data analysis|statistical|analysis plan)",
    r"^\s*\d+\.\s+(limitation|bias)",
    r"^\s*\d+\.\s+(ethic|irb|consent)",
]

SECTION_LABELS = [
    "background", "objectives", "study_design", "study_setting",
    "cohort_definition", "variables", "study_size", "data_analysis",
    "limitations", "ethics",
]


def extract_text_pymupdf(pdf_path: Path) -> str:
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(str(pdf_path))
        pages = []
        for page in doc:
            pages.append(page.get_text("text"))
        doc.close()
        return "\n".join(pages)
    except Exception as e:
        logger.warning(f"PyMuPDF failed for {pdf_path.name}: {e}")
        return ""


def extract_text_pdfplumber(pdf_path: Path) -> str:
    try:
        import pdfplumber
        with pdfplumber.open(str(pdf_path)) as pdf:
            pages = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
        return "\n".join(pages)
    except Exception as e:
        logger.warning(f"pdfplumber failed for {pdf_path.name}: {e}")
        return ""


def extract_text(pdf_path: Path) -> str:
    text = extract_text_pymupdf(pdf_path)
    if not text.strip():
        logger.info(f"Falling back to pdfplumber for {pdf_path.name}")
        text = extract_text_pdfplumber(pdf_path)
    return text


def detect_section(line: str) -> str | None:
    line_lower = line.lower().strip()
    for i, pattern in enumerate(SECTION_PATTERNS):
        if re.match(pattern, line_lower, re.IGNORECASE):
            return SECTION_LABELS[i]
    return None


def chunk_by_sections(text: str, min_chunk_tokens: int = 200, max_chunk_tokens: int = 800) -> list[dict]:
    lines = text.split("\n")
    chunks = []
    current_section = "general"
    current_lines = []

    def flush(section: str, lines: list[str]):
        content = " ".join(l.strip() for l in lines if l.strip())
        if len(content.split()) >= min_chunk_tokens:
            # Split into sub-chunks if too large
            words = content.split()
            for i in range(0, len(words), max_chunk_tokens):
                sub = " ".join(words[i : i + max_chunk_tokens])
                if len(sub.split()) >= min_chunk_tokens // 2:
                    chunks.append({"text": sub, "section": section})

    for line in lines:
        detected = detect_section(line)
        if detected:
            if current_lines:
                flush(current_section, current_lines)
            current_section = detected
            current_lines = [line]
        else:
            current_lines.append(line)

    if current_lines:
        flush(current_section, current_lines)

    return chunks


def embed_chunks(texts: list[str]) -> list[list[float]]:
    from openai import OpenAI
    client = OpenAI()
    batch_size = 100
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = client.embeddings.create(model="text-embedding-3-small", input=batch)
        all_embeddings.extend([item.embedding for item in response.data])
        logger.info(f"Embedded batch {i // batch_size + 1} ({len(batch)} chunks)")
    return all_embeddings


def extract_metadata_from_filename(pdf_path: Path) -> dict:
    stem = pdf_path.stem
    # Try to extract EU PAS number pattern (e.g., EUPAS12345)
    eu_pas_match = re.search(r"EUPAS\d+", stem, re.IGNORECASE)
    eu_pas = eu_pas_match.group(0).upper() if eu_pas_match else ""
    return {
        "title": stem.replace("_", " ").replace("-", " "),
        "eu_pas": eu_pas,
        "filename": pdf_path.name,
    }


def ingest(pdf_dir: str, chroma_dir: str):
    import chromadb

    pdf_paths = list(Path(pdf_dir).glob("**/*.pdf"))
    if not pdf_paths:
        logger.error(f"No PDF files found in {pdf_dir}")
        sys.exit(1)

    logger.info(f"Found {len(pdf_paths)} PDF files")

    client = chromadb.PersistentClient(path=chroma_dir)
    collection = client.get_or_create_collection(
        name="protocols",
        metadata={"hnsw:space": "cosine"},
    )

    all_documents = []
    all_metadatas = []
    all_ids = []

    for pdf_path in pdf_paths:
        logger.info(f"Processing: {pdf_path.name}")
        text = extract_text(pdf_path)
        if not text.strip():
            logger.warning(f"No text extracted from {pdf_path.name}, skipping")
            continue

        chunks = chunk_by_sections(text)
        file_meta = extract_metadata_from_filename(pdf_path)
        logger.info(f"  → {len(chunks)} chunks from {pdf_path.name}")

        for i, chunk in enumerate(chunks):
            chunk_id = hashlib.md5(f"{pdf_path.name}_{i}_{chunk['text'][:50]}".encode()).hexdigest()
            metadata = {
                **file_meta,
                "section": chunk["section"],
                "chunk_index": i,
            }
            all_documents.append(chunk["text"])
            all_metadatas.append(metadata)
            all_ids.append(chunk_id)

    if not all_documents:
        logger.error("No chunks to embed")
        sys.exit(1)

    logger.info(f"Embedding {len(all_documents)} total chunks...")
    embeddings = embed_chunks(all_documents)

    logger.info("Storing in ChromaDB...")
    batch_size = 500
    for i in range(0, len(all_documents), batch_size):
        collection.upsert(
            documents=all_documents[i : i + batch_size],
            metadatas=all_metadatas[i : i + batch_size],
            ids=all_ids[i : i + batch_size],
            embeddings=embeddings[i : i + batch_size],
        )
        logger.info(f"  Stored batch {i // batch_size + 1}")

    logger.info(f"Done. Collection '{collection.name}' now has {collection.count()} chunks.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest protocol PDFs into ChromaDB")
    parser.add_argument("--pdf_dir", required=True, help="Directory containing PDF files")
    parser.add_argument("--chroma_dir", default="./chroma_db", help="ChromaDB persistence directory")
    args = parser.parse_args()
    ingest(args.pdf_dir, args.chroma_dir)
