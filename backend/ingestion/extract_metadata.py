#!/usr/bin/env python3
"""
Extract structured metadata from protocol PDFs using LLM assistance.

For each PDF, attempts to extract:
  - disease_area
  - drug_name
  - drug_class
  - study_type
  - data_source
  - country
  - year
  - regulatory_body (EMA / FDA / HMA / other)
  - eu_pas (EU PAS registration number, if present)

Writes output to a JSON file for downstream use in ingestion.

Usage:
    python extract_metadata.py --pdf_dir /path/to/pdfs --output metadata.json [--catalog catalog.xlsx] [--use_llm]
"""

import argparse
import json
import logging
import re
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger(__name__)


# ── Text extraction ────────────────────────────────────────────────────────────

def extract_first_n_pages(pdf_path: Path, n: int = 5) -> str:
    """Extract text from the first N pages of a PDF (sufficient for metadata)."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(str(pdf_path))
        pages = []
        for i, page in enumerate(doc):
            if i >= n:
                break
            pages.append(page.get_text("text"))
        doc.close()
        return "\n".join(pages)
    except Exception as e:
        logger.warning(f"PyMuPDF failed for {pdf_path.name}: {e}")

    try:
        import pdfplumber
        with pdfplumber.open(str(pdf_path)) as pdf:
            pages = []
            for i, page in enumerate(pdf.pages):
                if i >= n:
                    break
                text = page.extract_text()
                if text:
                    pages.append(text)
        return "\n".join(pages)
    except Exception as e:
        logger.warning(f"pdfplumber fallback also failed for {pdf_path.name}: {e}")
        return ""


# ── Heuristic extraction (no LLM required) ───────────────────────────────────

def _extract_year_heuristic(text: str) -> str | None:
    """Find most common 4-digit year in 2000–2030 range."""
    years = re.findall(r"\b(20[0-2]\d)\b", text)
    if not years:
        return None
    from collections import Counter
    return Counter(years).most_common(1)[0][0]


def _extract_eu_pas(text: str, filename: str) -> str | None:
    """Find EU PAS number from text or filename."""
    pattern = r"(EUPAS\s*\d+|EU\s*PAS\s*\d+)"
    match = re.search(pattern, text, re.IGNORECASE) or re.search(pattern, filename, re.IGNORECASE)
    if match:
        return re.sub(r"\s+", "", match.group(0)).upper()
    return None


def _extract_regulatory_body(text: str) -> str:
    text_lower = text.lower()
    if "ema" in text_lower or "european medicines agency" in text_lower:
        return "EMA"
    if "fda" in text_lower or "food and drug administration" in text_lower:
        return "FDA"
    if "hma" in text_lower or "heads of medicines agencies" in text_lower:
        return "HMA"
    return "Unknown"


def heuristic_metadata(pdf_path: Path, text: str) -> dict:
    return {
        "filename": pdf_path.name,
        "title": pdf_path.stem.replace("_", " ").replace("-", " "),
        "eu_pas": _extract_eu_pas(text, pdf_path.name),
        "year": _extract_year_heuristic(text),
        "regulatory_body": _extract_regulatory_body(text),
        "drug_name": None,
        "drug_class": None,
        "disease_area": None,
        "study_type": None,
        "data_source": None,
        "country": None,
    }


# ── LLM-assisted extraction ───────────────────────────────────────────────────

EXTRACTION_PROMPT = """You are extracting structured metadata from a regulatory study protocol PDF.

Read the text below (first few pages of the protocol) and extract the following fields.
Return ONLY a valid JSON object with exactly these keys (use null for any field you cannot determine):

{
  "drug_name": "primary drug name",
  "drug_class": "drug class (e.g., JAK inhibitor, DOAC, GLP-1 agonist)",
  "disease_area": "primary disease/indication (e.g., rheumatoid arthritis, atrial fibrillation)",
  "study_type": "one of: cohort, case_control, cross_sectional, other",
  "data_source": "database name(s) used (e.g., Optum EHR, CPRD, PHARMO)",
  "country": "country or region (e.g., US, UK, Germany, EU multi-country)",
  "year": "study year or publication year (4-digit)",
  "regulatory_body": "one of: EMA, FDA, HMA, other"
}

Protocol text:
"""


def llm_extract_metadata(text: str) -> dict | None:
    """Use Claude to extract structured metadata from protocol text."""
    try:
        import anthropic
        import json as _json

        client = anthropic.Anthropic()
        truncated = text[:3000].strip()

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{"role": "user", "content": EXTRACTION_PROMPT + truncated}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return _json.loads(raw.strip())
    except Exception as e:
        logger.warning(f"LLM extraction failed: {e}")
        return None


# ── Catalog integration ───────────────────────────────────────────────────────

def load_catalog(catalog_path: Path) -> dict[str, dict]:
    """
    Load HMA/EMA catalog xlsx and index by EU PAS number.
    Returns dict mapping eu_pas -> metadata dict.
    """
    try:
        import pandas as pd
        df = pd.read_excel(str(catalog_path))
        catalog = {}
        for _, row in df.iterrows():
            row_dict = row.to_dict()
            eu_pas = None
            for col in df.columns:
                val = str(row_dict.get(col, ""))
                match = re.search(r"EUPAS\d+", val, re.IGNORECASE)
                if match:
                    eu_pas = match.group(0).upper()
                    break
            if eu_pas:
                catalog[eu_pas] = row_dict
        logger.info(f"Loaded {len(catalog)} entries from catalog")
        return catalog
    except Exception as e:
        logger.warning(f"Could not load catalog: {e}")
        return {}


# ── Main ─────────────────────────────────────────────────────────────────────

def extract_all(pdf_dir: str, output_path: str, catalog_path: str | None = None, use_llm: bool = False):
    pdf_paths = list(Path(pdf_dir).glob("**/*.pdf"))
    if not pdf_paths:
        logger.error(f"No PDF files found in {pdf_dir}")
        sys.exit(1)

    logger.info(f"Found {len(pdf_paths)} PDFs")

    catalog = {}
    if catalog_path:
        catalog = load_catalog(Path(catalog_path))

    results = []
    for i, pdf_path in enumerate(pdf_paths, 1):
        logger.info(f"[{i}/{len(pdf_paths)}] Processing: {pdf_path.name}")
        text = extract_first_n_pages(pdf_path, n=5)
        meta = heuristic_metadata(pdf_path, text)

        # Supplement from catalog if available
        if meta["eu_pas"] and meta["eu_pas"] in catalog:
            catalog_row = catalog[meta["eu_pas"]]
            logger.info(f"  Catalog match: {meta['eu_pas']}")
            for field in ("drug_name", "disease_area", "data_source", "country"):
                if meta[field] is None:
                    for col, val in catalog_row.items():
                        if field.replace("_", " ") in str(col).lower() and val and str(val) != "nan":
                            meta[field] = str(val)
                            break

        # LLM fallback for remaining nulls
        if use_llm and text.strip():
            llm_result = llm_extract_metadata(text)
            if llm_result:
                for field, value in llm_result.items():
                    if value and meta.get(field) is None:
                        meta[field] = value

        results.append(meta)

    output = Path(output_path)
    output.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    logger.info(f"Wrote {len(results)} metadata records to {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract metadata from protocol PDFs")
    parser.add_argument("--pdf_dir", required=True, help="Directory containing PDF files")
    parser.add_argument("--output", default="metadata.json", help="Output JSON file path")
    parser.add_argument("--catalog", default=None, help="Path to HMA/EMA catalog xlsx file")
    parser.add_argument("--use_llm", action="store_true", help="Use LLM for richer extraction (requires ANTHROPIC_API_KEY)")
    args = parser.parse_args()
    extract_all(args.pdf_dir, args.output, args.catalog, args.use_llm)
