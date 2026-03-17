import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.study_input import StudyInput
from app.models.methodology import MethodologyRecommendation
from app.services.llm import LLMService
from app.services.methodology_advisor import recommend_methodology

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

    # Methodology decision questions
    if inputs.methodology is None:
        if inputs.research_question_type is None:
            questions.append(ClarifyQuestion(
                field="research_question_type",
                question="What type of research question is this study addressing?",
                why_it_matters="The research question type determines the most appropriate causal methodology and study design.",
                options=[
                    "Safety signal investigation",
                    "Drug utilization / prescribing patterns",
                    "Comparative effectiveness",
                    "Risk minimization effectiveness",
                    "Pregnancy safety",
                    "Other",
                ],
                required=True,
            ))

        if inputs.outcome_rarity is None and inputs.research_question_type in (
            "safety_signal", "effectiveness", None
        ):
            questions.append(ClarifyQuestion(
                field="outcome_rarity",
                question="How common is the outcome of interest in the study population?",
                why_it_matters="Outcome rarity determines whether efficient designs like nested case-control or self-controlled methods are preferred over full cohort analysis.",
                options=[
                    "Common (>1/100 person-years)",
                    "Uncommon (1/1,000 to 1/100)",
                    "Rare (<1/1,000)",
                    "Very rare (<1/10,000)",
                ],
                required=True,
            ))

        if inputs.time_horizon is None and inputs.research_question_type in (
            "safety_signal", "effectiveness", None
        ):
            questions.append(ClarifyQuestion(
                field="time_horizon",
                question="What is the expected time between drug exposure and outcome occurrence?",
                why_it_matters="Acute effects favor self-controlled designs; chronic effects favor cohort designs with long follow-up.",
                options=[
                    "Acute (days to weeks)",
                    "Subacute (weeks to months)",
                    "Chronic (months to years)",
                ],
                required=True,
            ))

    return questions


class MethodologyRecommendRequest(BaseModel):
    study_inputs: StudyInput


@router.post("/clarify", response_model=ClarifyResponse)
async def clarify(request: ClarifyRequest):
    try:
        questions = _rule_based_questions(request.study_inputs)
        is_sufficient = not any(q.required for q in questions)
        return ClarifyResponse(is_sufficient=is_sufficient, questions=questions)
    except Exception as e:
        logger.error(f"Clarify error: {e}")
        raise HTTPException(status_code=500, detail={"error": "clarify_failed", "detail": str(e), "field": None})


@router.post("/methodology/recommend", response_model=MethodologyRecommendation)
async def methodology_recommend(request: MethodologyRecommendRequest):
    try:
        return recommend_methodology(request.study_inputs)
    except Exception as e:
        logger.error(f"Methodology recommend error: {e}")
        raise HTTPException(status_code=500, detail={"error": "methodology_recommend_failed", "detail": str(e), "field": None})
