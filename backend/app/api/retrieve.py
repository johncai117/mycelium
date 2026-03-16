import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.study_input import StudyInput
from app.services.retrieval import RetrievalService

logger = logging.getLogger(__name__)
router = APIRouter()
retrieval = RetrievalService()


class RetrieveRequest(BaseModel):
    study_inputs: StudyInput


@router.post("/retrieve")
async def retrieve(request: RetrieveRequest):
    try:
        chunks = retrieval.query(request.study_inputs, n_results=10)
        return chunks
    except Exception as e:
        logger.error(f"Retrieve error: {e}")
        raise HTTPException(status_code=500, detail={"error": "retrieve_failed", "detail": str(e), "field": None})
