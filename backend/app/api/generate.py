import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.study_input import StudyInput
from app.models.protocol import Protocol, ProtocolSection, CodeSets, ProtocolFlag
from app.services.llm import LLMService
from app.services.code_sets import CodeSetService

logger = logging.getLogger(__name__)
router = APIRouter()
llm = LLMService()
code_set_svc = CodeSetService()

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

SECTION_ORDER = [
    "background",
    "objectives",
    "study_design",
    "study_setting",
    "cohort_definition",
    "variables",
    "study_size",
    "data_analysis",
    "limitations",
    "ethics",
]

# Sections that always flag for epidemiologist judgment
JUDGMENT_REQUIRED_SECTIONS = {"cohort_definition", "variables", "data_analysis"}


def _load_prompt(name: str) -> str:
    path = PROMPTS_DIR / f"{name}.md"
    return path.read_text() if path.exists() else f"You are an expert epidemiologist writing the {name} section of a regulatory study protocol."


def _confidence_from_inputs(section_name: str, inputs: StudyInput) -> str:
    if section_name == "cohort_definition" and inputs.index_date_logic:
        return "high"
    if section_name == "study_setting" and inputs.data_source:
        return "high"
    if section_name == "variables" and inputs.primary_outcome:
        return "medium"
    if section_name in ("limitations", "ethics"):
        return "high"
    if inputs.clinical_context and len(inputs.clinical_context) > 100:
        return "medium"
    return "low"


class GenerateRequest(BaseModel):
    study_inputs: StudyInput
    retrieved_chunks: list[dict] = []


class RegenerateRequest(BaseModel):
    section_id: str
    current_content: str
    researcher_comment: str
    study_inputs: StudyInput
    retrieved_chunks: list[dict] = []


class GenerateResponse(BaseModel):
    sections: dict
    code_sets: dict
    flags: list


@router.post("/generate", response_model=GenerateResponse)
async def generate_protocol(request: GenerateRequest):
    try:
        sections = {}
        flags = []
        prior_sections = {}

        for section_name in SECTION_ORDER:
            prompt = _load_prompt(f"section_{section_name}")
            content = llm.generate_section(
                section_name=section_name,
                study_inputs=request.study_inputs,
                retrieved_chunks=request.retrieved_chunks,
                system_prompt=prompt,
                prior_sections=prior_sections if prior_sections else None,
            )
            confidence = _confidence_from_inputs(section_name, request.study_inputs)
            sections[section_name] = ProtocolSection(
                content=content,
                confidence=confidence,
                ai_generated=True,
            ).model_dump()

            prior_sections[section_name] = content[:500]  # summary context for next sections

            if section_name in JUDGMENT_REQUIRED_SECTIONS or confidence == "low":
                flags.append(ProtocolFlag(
                    section=section_name,
                    message="Requires epidemiologist review and validation before submission.",
                    severity="requires_judgment",
                ).model_dump())

        # Lookup code sets
        combined = code_set_svc.lookup(request.study_inputs.indication)
        drug_codes = code_set_svc.lookup(request.study_inputs.drug_name)
        code_sets = CodeSets(
            icd10=combined.get("icd10", []),
            ndc=drug_codes.get("ndc", []),
            cpt=[],
        ).model_dump()

        return GenerateResponse(sections=sections, code_sets=code_sets, flags=flags)

    except Exception as e:
        logger.error(f"Generate error: {e}")
        raise HTTPException(status_code=500, detail={"error": "generate_failed", "detail": str(e), "field": None})


@router.post("/generate/section")
async def regenerate_section(request: RegenerateRequest):
    try:
        new_content = llm.regenerate_section(
            section_id=request.section_id,
            current_content=request.current_content,
            researcher_comment=request.researcher_comment,
            study_inputs=request.study_inputs,
            retrieved_chunks=request.retrieved_chunks,
        )

        # Simple change summary
        old_len = len(request.current_content.split())
        new_len = len(new_content.split())
        diff = new_len - old_len
        change_summary = f"Section revised per researcher feedback. {'Added' if diff > 0 else 'Reduced by'} ~{abs(diff)} words."

        return {"content": new_content, "change_summary": change_summary}

    except Exception as e:
        logger.error(f"Regenerate section error: {e}")
        raise HTTPException(status_code=500, detail={"error": "regenerate_failed", "detail": str(e), "field": None})
