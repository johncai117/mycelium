import logging
import os
from typing import Optional

from app.models.study_input import StudyInput

logger = logging.getLogger(__name__)


class RetrievedChunk:
    def __init__(self, chunk: str, source_title: str, source_eu_pas: str, score: float, section: str):
        self.chunk = chunk
        self.source_title = source_title
        self.source_eu_pas = source_eu_pas
        self.score = score
        self.section = section

    def to_dict(self) -> dict:
        return {
            "chunk": self.chunk,
            "source_title": self.source_title,
            "source_eu_pas": self.source_eu_pas,
            "score": self.score,
            "section": self.section,
        }


class RetrievalService:
    def __init__(self):
        self._client = None
        self._collection = None

    def _get_collection(self):
        if self._collection is not None:
            return self._collection
        try:
            import chromadb
            chroma_path = os.getenv("CHROMA_DB_PATH", "./backend/chroma_db")
            self._client = chromadb.PersistentClient(path=chroma_path)
            self._collection = self._client.get_or_create_collection(
                name="protocols",
                metadata={"hnsw:space": "cosine"},
            )
            return self._collection
        except Exception as e:
            logger.warning(f"ChromaDB unavailable: {e}")
            return None

    def _embed_query(self, text: str) -> Optional[list[float]]:
        try:
            from openai import OpenAI
            client = OpenAI()
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            logger.warning(f"Embedding failed: {e}")
            return None

    def query(self, study_inputs: StudyInput, n_results: int = 10) -> list[dict]:
        collection = self._get_collection()
        if collection is None:
            return []

        query_text = (
            f"{study_inputs.drug_name} {study_inputs.indication} "
            f"{study_inputs.study_type} {study_inputs.data_source or ''} "
            f"{study_inputs.primary_outcome or ''} {study_inputs.population_description or ''}"
        ).strip()

        embedding = self._embed_query(query_text)
        if embedding is None:
            return []

        try:
            where = {}
            if study_inputs.study_type and study_inputs.study_type != "other":
                where["study_type"] = study_inputs.study_type

            results = collection.query(
                query_embeddings=[embedding],
                n_results=min(n_results, collection.count() or 1),
                where=where if where else None,
                include=["documents", "metadatas", "distances"],
            )

            chunks = []
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 1.0
                score = round(1 - distance, 4)
                chunks.append(
                    RetrievedChunk(
                        chunk=doc,
                        source_title=meta.get("title", "Unknown Protocol"),
                        source_eu_pas=meta.get("eu_pas", ""),
                        score=score,
                        section=meta.get("section", ""),
                    ).to_dict()
                )
            return chunks
        except Exception as e:
            logger.error(f"ChromaDB query failed: {e}")
            return []

    def add_chunks(self, chunks_with_metadata: list[dict]) -> None:
        collection = self._get_collection()
        if collection is None:
            return
        documents = [c["text"] for c in chunks_with_metadata]
        metadatas = [c["metadata"] for c in chunks_with_metadata]
        ids = [c["id"] for c in chunks_with_metadata]
        embeddings = [c["embedding"] for c in chunks_with_metadata]
        collection.upsert(documents=documents, metadatas=metadatas, ids=ids, embeddings=embeddings)

    def get_collection_stats(self) -> dict:
        collection = self._get_collection()
        if collection is None:
            return {"status": "unavailable", "count": 0}
        return {"status": "ok", "count": collection.count()}
