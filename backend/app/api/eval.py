import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.protocol import Protocol
from app.models.eval_result import EvalResult, ImprovementSuggestion
from app.services import eval_engine
from app.services.llm import LLMService

logger = logging.getLogger(__name__)
router = APIRouter()
llm = LLMService()


class EvalRequest(BaseModel):
    protocol: Protocol


class JudgeResponse(BaseModel):
    narrative: str
    improvement_suggestions: list[ImprovementSuggestion]


@router.post("/eval", response_model=EvalResult)
async def eval_protocol(request: EvalRequest):
    try:
        result = eval_engine.score_protocol(request.protocol)

        # Augment with LLM judge narrative
        try:
            judge = llm.judge_protocol(request.protocol)
            result.judge_narrative = judge.narrative
            # Merge LLM suggestions with rule-based ones (LLM suggestions take precedence)
            if judge.improvement_suggestions:
                result.improvement_suggestions = judge.improvement_suggestions + result.improvement_suggestions
        except Exception as e:
            logger.warning(f"LLM judge failed: {type(e).__name__}: {e}")
            result.judge_narrative = "LLM judge unavailable. See item-level findings above."

        return result
    except Exception as e:
        logger.error(f"Eval error: {e}")
        raise HTTPException(status_code=500, detail={"error": "eval_failed", "detail": str(e), "field": None})


@router.post("/eval/judge", response_model=JudgeResponse)
async def judge_protocol(request: EvalRequest):
    try:
        judge = llm.judge_protocol(request.protocol)
        return JudgeResponse(
            narrative=judge.narrative,
            improvement_suggestions=judge.improvement_suggestions,
        )
    except Exception as e:
        logger.warning(f"LLM judge failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=503, detail={"error": "judge_unavailable", "detail": str(e)})
