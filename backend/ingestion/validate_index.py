#!/usr/bin/env python3
"""
Validate ChromaDB retrieval quality against a set of test queries.

Measures:
  - Precision@3: fraction of queries where a relevant protocol is in top 3
  - Precision@10: fraction of queries where a relevant protocol is in top 10
  - Mean reciprocal rank (MRR) for relevant results

Usage:
    python validate_index.py --chroma_dir ./chroma_db [--queries test_queries.json]
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger(__name__)


# ── Default test queries ──────────────────────────────────────────────────────
# Format: {query_text, expected_keywords_in_result (partial match is OK)}

DEFAULT_TEST_QUERIES = [
    {
        "id": "q01",
        "query": "tofacitinib rheumatoid arthritis cohort PASS study cardiovascular",
        "expected_disease": "rheumatoid arthritis",
        "expected_drug": "tofacitinib",
    },
    {
        "id": "q02",
        "query": "apixaban atrial fibrillation new-user cohort Optum claims stroke",
        "expected_disease": "atrial fibrillation",
        "expected_drug": "apixaban",
    },
    {
        "id": "q03",
        "query": "semaglutide type 2 diabetes weight loss MACE cardiovascular outcomes",
        "expected_disease": "type 2 diabetes",
        "expected_drug": "semaglutide",
    },
    {
        "id": "q04",
        "query": "adalimumab psoriasis cohort MarketScan propensity score matching",
        "expected_disease": "psoriasis",
        "expected_drug": "adalimumab",
    },
    {
        "id": "q05",
        "query": "rivaroxaban venous thromboembolism VTE case control CPRD UK",
        "expected_disease": "venous thromboembolism",
        "expected_drug": "rivaroxaban",
    },
    {
        "id": "q06",
        "query": "inhaled corticosteroid COPD exacerbation hospitalization cohort Medicare",
        "expected_disease": "COPD",
        "expected_drug": None,
    },
    {
        "id": "q07",
        "query": "proton pump inhibitor fracture case control claims database new user",
        "expected_disease": "fracture",
        "expected_drug": None,
    },
    {
        "id": "q08",
        "query": "metformin type 2 diabetes renal outcomes cohort TriNetX EHR",
        "expected_disease": "type 2 diabetes",
        "expected_drug": "metformin",
    },
    {
        "id": "q09",
        "query": "anti-TNF biologic inflammatory bowel disease safety serious infections cohort",
        "expected_disease": "inflammatory bowel disease",
        "expected_drug": None,
    },
    {
        "id": "q10",
        "query": "SSRIs antidepressant pregnancy perinatal outcomes nested case control",
        "expected_disease": "depression",
        "expected_drug": None,
    },
]


# ── Embedding ─────────────────────────────────────────────────────────────────

def embed_query(text: str) -> list[float] | None:
    try:
        from openai import OpenAI
        client = OpenAI()
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        return None


# ── Relevance check ───────────────────────────────────────────────────────────

def is_relevant(result_doc: str, result_meta: dict, query: dict) -> bool:
    """
    Simple relevance check: does the retrieved chunk contain the expected
    disease or drug keywords?
    """
    text_lower = (result_doc + " " + json.dumps(result_meta)).lower()

    disease_hit = False
    drug_hit = False

    if query.get("expected_disease"):
        disease_keywords = query["expected_disease"].lower().split()
        disease_hit = any(kw in text_lower for kw in disease_keywords)

    if query.get("expected_drug"):
        drug_hit = query["expected_drug"].lower() in text_lower

    # Relevant if either the disease or drug is mentioned
    return disease_hit or drug_hit


# ── Main validation ───────────────────────────────────────────────────────────

def validate(chroma_dir: str, queries_path: str | None = None):
    try:
        import chromadb
    except ImportError:
        logger.error("chromadb not installed. Run: pip install chromadb")
        sys.exit(1)

    client = chromadb.PersistentClient(path=chroma_dir)
    try:
        collection = client.get_collection("protocols")
    except Exception:
        logger.error(f"Collection 'protocols' not found in {chroma_dir}. Run ingest_pdfs.py first.")
        sys.exit(1)

    count = collection.count()
    logger.info(f"Collection 'protocols' has {count} chunks")
    if count == 0:
        logger.error("Collection is empty — ingest PDFs first")
        sys.exit(1)

    # Load test queries
    if queries_path and Path(queries_path).exists():
        queries = json.loads(Path(queries_path).read_text())
        logger.info(f"Loaded {len(queries)} queries from {queries_path}")
    else:
        queries = DEFAULT_TEST_QUERIES
        logger.info(f"Using {len(queries)} built-in test queries")

    n_results = min(10, count)
    hits_at_3 = 0
    hits_at_10 = 0
    reciprocal_ranks = []

    for q in queries:
        logger.info(f"\nQuery [{q['id']}]: {q['query'][:80]}...")

        embedding = embed_query(q["query"])
        if embedding is None:
            logger.warning(f"  Skipped (embedding failed)")
            continue

        results = collection.query(
            query_embeddings=[embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"],
        )

        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]

        first_relevant_rank = None
        for rank, (doc, meta, dist) in enumerate(zip(docs, metas, distances), 1):
            score = round(1 - dist, 3)
            relevant = is_relevant(doc, meta, q)
            title = meta.get("title", "?")[:50]
            eu_pas = meta.get("eu_pas", "")
            logger.info(f"  [{rank}] score={score:.3f}  relevant={'YES' if relevant else 'no'}  {title} {eu_pas}")

            if relevant and first_relevant_rank is None:
                first_relevant_rank = rank
                if rank <= 3:
                    hits_at_3 += 1
                if rank <= 10:
                    hits_at_10 += 1

        if first_relevant_rank is not None:
            reciprocal_ranks.append(1.0 / first_relevant_rank)
        else:
            reciprocal_ranks.append(0.0)
            logger.warning(f"  No relevant result found in top {n_results}")

    n_queries = len(queries)
    p_at_3 = hits_at_3 / n_queries if n_queries else 0
    p_at_10 = hits_at_10 / n_queries if n_queries else 0
    mrr = sum(reciprocal_ranks) / len(reciprocal_ranks) if reciprocal_ranks else 0

    print("\n" + "=" * 60)
    print("RETRIEVAL EVALUATION RESULTS")
    print("=" * 60)
    print(f"  Queries evaluated:  {n_queries}")
    print(f"  Precision@3:        {p_at_3:.1%}  (target: >80%)")
    print(f"  Precision@10:       {p_at_10:.1%}  (target: >90%)")
    print(f"  Mean Reciprocal Rank: {mrr:.3f}")
    print("=" * 60)

    if p_at_3 >= 0.80:
        print("  Status: PASS — target precision@3 achieved")
    else:
        print(f"  Status: NEEDS IMPROVEMENT — precision@3 is {p_at_3:.1%}, target is 80%")
        print("  Suggestions:")
        print("    - Ingest more protocol PDFs covering the test query topics")
        print("    - Check that PDF text extraction is working correctly")
        print("    - Consider using a hybrid BM25 + dense retrieval approach")

    return {"p_at_3": p_at_3, "p_at_10": p_at_10, "mrr": mrr}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate ChromaDB retrieval quality")
    parser.add_argument("--chroma_dir", default="./chroma_db", help="ChromaDB persistence directory")
    parser.add_argument("--queries", default=None, help="JSON file with test queries (optional)")
    args = parser.parse_args()
    validate(args.chroma_dir, args.queries)
