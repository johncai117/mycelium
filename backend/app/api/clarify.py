import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.study_input import StudyInput
from app.services.llm import LLMService

logger = logging.getLogger(__name__)
router = APIRouter()
llm = LLMService()


class ClarifyQuestion(BaseModel):
    field: str
    question: str
    why_it_matters: str
    options: list[str] | None = None
    required: bool = True


class ClarifyRequest(BaseModel):
    study_inputs: StudyInput


class ClarifyResponse(BaseModel):
    is_sufficient: bool
    questions: list[ClarifyQuestion]


def _rule_based_questions(inputs: StudyInput) -> list[ClarifyQuestion]:
    """Deterministic trigger logic per PLAN.md B3."""
    questions = []

    if inputs.data_source is None:
        questions.append(ClarifyQuestion(
            field="data_source",
            question="Which database or data source will this study use?",
            why_it_matters="The data source determines available code types, enrollment criteria, and the study population definition.",
            options=["Optum EHR", "MarketScan", "IQVIA PharMetrics", "TriNetX", "Medicare", "Medicaid", "CPRD", "Other"],
            required=True,
        ))

    if inputs.comparators is None and inputs.study_type == "cohort":
        questions.append(ClarifyQuestion(
            field="comparators",
            question="What comparator drug(s) or group(s) will be used?",
            why_it_matters="Comparator selection is critical for the study design and directly affects the interpretation of effect estimates.",
            options=None,
            required=True,
        ))

    if inputs.primary_outcome is None:
        questions.append(ClarifyQuestion(
            field="primary_outcome",
            question="What is the primary outcome of interest?",
            why_it_matters="The primary outcome drives the entire analysis plan, sample size calculations, and code list development.",
            options=None,
            required=True,
        ))

    if inputs.study_period_start is None or inputs.study_period_end is None:
        questions.append(ClarifyQuestion(
            field="study_period_start",
            question="What is the intended study period (start and end dates)?",
            why_it_matters="The study period determines data availability and the cohort entry window.",
            options=None,
            required=True,
        ))

    if inputs.clinical_context is None or len(inputs.clinical_context or "") < 50:
        questions.append(ClarifyQuestion(
            field="clinical_context",
            question="Can you provide additional clinical context about the study? (e.g., known safety signals, prior studies, regulatory background)",
            why_it_matters="Additional context helps generate more accurate and specific protocol language.",
            options=None,
            required=False,
        ))

    return questions


@router.post("/clarify", response_model=ClarifyResponse)
async def clarify(request: ClarifyRequest):
    try:
        questions = _rule_based_questions(request.study_inputs)
        is_sufficient = not any(q.required for q in questions)
        return ClarifyResponse(is_sufficient=is_sufficient, questions=questions)
    except Exception as e:
        logger.error(f"Clarify error: {e}")
        raise HTTPException(status_code=500, detail={"error": "clarify_failed", "detail": str(e), "field": None})
