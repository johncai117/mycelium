import io
import uuid
import logging
from typing import Optional

import pdfplumber
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.llm import LLMService

logger = logging.getLogger(__name__)
router = APIRouter()

# ── In-memory template store (keyed by template_id) ───────────────────────────
_template_store: dict[str, bytes] = {}


# ── Models ────────────────────────────────────────────────────────────────────

class Milestone(BaseModel):
    name: str
    date: Optional[str] = None


class RegulatoryDocExtracted(BaseModel):
    study_description: Optional[str] = None
    requirement_type: Optional[str] = None
    milestones: list[Milestone] = []
    safety_signal: Optional[str] = None
    scientific_justification: Optional[str] = None
    application_number: Optional[str] = None
    applicant_name: Optional[str] = None


class TemplateUploadResponse(BaseModel):
    template_id: str
    filename: str
    size_bytes: int


# ── Regulatory document upload ────────────────────────────────────────────────

@router.post("/upload/regulatory-doc", response_model=RegulatoryDocExtracted)
async def upload_regulatory_doc(file: UploadFile = File(...)):
    """Extract structured fields from an uploaded PMR/PASS regulatory document (PDF)."""
    try:
        filename = file.filename or ""
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail={"error": "invalid_file", "detail": "Only PDF files are accepted.", "field": None},
            )

        content = await file.read()

        # Extract text with pdfplumber
        text_parts: list[str] = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
        full_text = "\n".join(text_parts).strip()

        if not full_text:
            raise HTTPException(
                status_code=422,
                detail={"error": "no_text", "detail": "Could not extract text from PDF.", "field": None},
            )

        # Truncate to ~8 000 chars to stay within model context
        truncated = full_text[:8000]

        llm = LLMService()
        raw = llm.extract_regulatory_doc(truncated)

        # Coerce milestones list — LLM may return dicts
        milestones = [
            Milestone(name=m.get("name", ""), date=m.get("date"))
            for m in raw.get("milestones", [])
            if isinstance(m, dict)
        ]

        return RegulatoryDocExtracted(
            study_description=raw.get("study_description"),
            requirement_type=raw.get("requirement_type"),
            milestones=milestones,
            safety_signal=raw.get("safety_signal"),
            scientific_justification=raw.get("scientific_justification"),
            application_number=raw.get("application_number"),
            applicant_name=raw.get("applicant_name"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Regulatory doc upload error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": "upload_failed", "detail": str(e), "field": None},
        )


# ── Protocol format template upload ──────────────────────────────────────────

@router.post("/upload/protocol-template", response_model=TemplateUploadResponse)
async def upload_protocol_template(file: UploadFile = File(...)):
    """Store an uploaded .docx protocol format template for use during export."""
    try:
        filename = file.filename or ""
        if not filename.lower().endswith(".docx"):
            raise HTTPException(
                status_code=400,
                detail={"error": "invalid_file", "detail": "Only .docx files are accepted.", "field": None},
            )

        content = await file.read()
        template_id = str(uuid.uuid4())
        _template_store[template_id] = content

        logger.info(f"Protocol template stored: id={template_id} file={filename} bytes={len(content)}")

        return TemplateUploadResponse(
            template_id=template_id,
            filename=filename,
            size_bytes=len(content),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Protocol template upload error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": "upload_failed", "detail": str(e), "field": None},
        )


def get_template(template_id: str) -> Optional[bytes]:
    """Retrieve a stored protocol template by ID."""
    return _template_store.get(template_id)
