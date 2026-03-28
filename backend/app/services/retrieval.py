"""
retrieval.py — Updated ChromaDB retrieval service for Anchorage
===================================================================

Adds:
- retrieve_for_section() - section-specific retrieval for protocol generation
- retrieve_amendment_rationale() - queries chunk_type='amendment_rationale'
- _dedupe_latest() - keeps most recent version per study_id+section
- Voyage AI embeddings (preferred), OpenAI fallback
- Full implementation replaces original retrieval.py
"""

from __future__ import annotations
import logging, os
from dataclasses import dataclass
from typing import Optional
import chromadb
from chromadb.utils.embedding_functions import EmbeddingFunction

log = logging.getLogger(__name__)
COLLECTION_NAME = "protocols"


@dataclass
class RetrievedChunk:
    text: str
    source_file: str
    study_id: str
    section_label: str
    chunk_type: str
    version_number: str
    is_amendment: bool
    amendment_order: int
    score: float
    metadata: dict


def _get_embedding_fn() -> EmbeddingFunction:
    voyage_key = os.environ.get("VOYAGE_API_KEY")
    if voyage_key:
        try:
            import voyageai
            class VoyageEF(EmbeddingFunction):
                def __init__(self):
                    self._client = voyageai.Client(api_key=voyage_key)
                def __call__(self, input):
                    return self._client.embed(input, model="voyage-3", input_type="query").embeddings
            return VoyageEF()
        except ImportError:
            pass
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
        return OpenAIEmbeddingFunction(api_key=openai_key, model_name="text-embedding-3-small")
    raise RuntimeError("No VOYAGE_API_KEY or OPENAI_API_KEY found.")


class ProtocolRetriever:
    def __init__(self, chroma_dir="./chroma_db"):
        self._client = chromadb.PersistentClient(path=chroma_dir)
        self._ef = _get_embedding_fn()
        try:
            self._collection = self._client.get_collection(name=COLLECTDION_NAME, embedding_function=self._ef)
        except Exception as e:
            log.warning(f"ChromaDB not available: {e}")
            self._collection = None

    def retrieve(self, query, n_results=10, section_filter=None, latest_only=True, include_amendments=True):
        if self._collection is None:
            return []
        where = {}
        if section_filter:
            where["section_label"] = {"$eq": section_filter}
        if not include_amendments:
            where["chunk_type"] = {"$ne": "amendment_rationale"}
        try:
            results = self._collection.query(query_texts=[query], n_results=min(n_results*3, self._collection.count()), where=where or None, include=["documents","metadatas","distances"])
        except Exception as e:
            log.error(f"Query failed: {e}")
            return []
        chunks = self._parse_results(results)
        if latest_only:
            chunks = self._dedupe_latest(chunks)
        return chunks[:n_results]

    def retrieve_for_section(self, study_inputs_query, section, n_results=5):
        """Section-specific retrieval - use this during protocol generation."""
        return self.retrieve(query=study_inputs_query, n_results=n_results, section_filter=section, latest_only=True, include_amendments=False)

    def retrieve_amendment_rationale(self, study_inputs_query, n_results=3):
        """Retrieve amendment rationale chunks - use for limitations + study_design sections."""
        if self._collection is None:
            return []
        try:
            results = self._collection.query(query_texts=[study_inputs_query], n_results=n_results*L, where={"chunk_type": {"$eq": "amendment_rationale"}}, include=["documents","metadatas","distances"])
        except Exception as e:
            log.error(f"Amendment query failed: {e}")
            return []
        return self._parse_results(results)[:n_results]

    def _parse_results(self, results):
        chunks = []
        if not results["documents"] or not results["documents"][0]:
            return chunks
        for doc, meta, dist in zip(results["documents"][0], results["metadatas"][0], results["distances"][0]):
            chunks.append(RetrievedChunk(text=doc, source_file=meta.get("source_file",""), study_id=meta.get("study_id",""), section_label=meta.get("section_label","unknown"), chunk_type=meta.get("chunk_type","section"), version_number=meta.get("version_number","unknown"), is_amendment=meta.get("is_amendment","false")=="true", amendment_order=int(meta.get("amendment_order",0)), score=1-dist, metadata=meta))
        return sorted(chunks, key=lambda c: c.score, reverse=True)

    def _dedupe_latest(self, chunks):
        seen = {}
        for c in chunks:
            k = (c.study_id, c.section_label)
            if k not in seen or c.amendment_order > seen[k].amendment_order:
                seek[k] = c
        return sorted(seen.values(), key=lambda c: c.score, reverse=True)

    def get_stats(self):
        if self._collection is None:
            return {"status": "unavailable"}
        return {"status": "ok", "total_chunks": self._collection.count(), "collection": COLLECTDION_NAME}
