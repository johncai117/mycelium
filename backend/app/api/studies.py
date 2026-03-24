"""
Studies CRUD API.

In-memory store for MVP — replace with Supabase/Postgres in production.

Endpoints:
    GET  /studies              → list all studies
    POST /studies              → create new study
    GET  /studies/{study_id}   → get study (protocol)
    PUT  /studies/{study_id}   → update study inputs
    GET  /studies/{study_id}/versions → version history (stub)
"""

import logging
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.middleware.auth import get_current_user

from app.models.study_input import StudyInput
from app.models.protocol import Protocol, ProtocolSection, CodeSets

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory store: study_id → Protocol
_STORE: dict[str, Protocol] = {}


# ── Request / Response models ─────────────────────────────────────────────────

class StudyListItem(BaseModel):
    id: str
    drug_name: str
    indication: str
    study_type: str
    status: str
    updated_at: str
    sponsor: str | None = None


class CreateStudyRequest(BaseModel):
    study_inputs: StudyInput


class UpdateStudyRequest(BaseModel):
    study_inputs: StudyInput


class SaveProtocolRequest(BaseModel):
    protocol: Protocol


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/studies", response_model=list[StudyListItem])
async def list_studies(current_user: dict = Depends(get_current_user)):
    """Return all studies sorted by updated_at descending."""
    items = []
    for study_id, protocol in _STORE.items():
        items.append(StudyListItem(
            id=study_id,
            drug_name=protocol.study_inputs.drug_name,
            indication=protocol.study_inputs.indication,
            study_type=protocol.study_inputs.study_type,
            status=_infer_status(protocol),
            updated_at=protocol.updated_at.isoformat(),
            sponsor=protocol.study_inputs.sponsor,
        ))
    items.sort(key=lambda x: x.updated_at, reverse=True)
    return items


@router.post("/studies", response_model=StudyListItem, status_code=201)
async def create_study(request: CreateStudyRequest, current_user: dict = Depends(get_current_user)):
    """Create a new empty study record."""
    study_id = str(uuid.uuid4())
    now = datetime.utcnow()
    protocol = Protocol(
        study_id=study_id,
        study_inputs=request.study_inputs,
        sections={},
        code_sets=CodeSets(),
        flags=[],
        version=1,
        created_at=now,
        updated_at=now,
    )
    _STORE[study_id] = protocol
    return StudyListItem(
        id=study_id,
        drug_name=request.study_inputs.drug_name,
        indication=request.study_inputs.indication,
        study_type=request.study_inputs.study_type,
        status="drafting",
        updated_at=now.isoformat(),
        sponsor=request.study_inputs.sponsor,
    )


@router.get("/studies/{study_id}", response_model=Protocol)
async def get_study(study_id: str, current_user: dict = Depends(get_current_user)):
    """Get a study protocol by ID."""
    protocol = _STORE.get(study_id)
    if not protocol:
        raise HTTPException(status_code=404, detail={"error": "not_found", "detail": f"Study {study_id} not found", "field": None})
    return protocol


@router.put("/studies/{study_id}", response_model=Protocol)
async def update_study(study_id: str, request: UpdateStudyRequest, current_user: dict = Depends(get_current_user)):
    """Update study inputs for an existing study."""
    protocol = _STORE.get(study_id)
    if not protocol:
        raise HTTPException(status_code=404, detail={"error": "not_found", "detail": f"Study {study_id} not found", "field": None})
    protocol.study_inputs = request.study_inputs
    protocol.updated_at = datetime.utcnow()
    _STORE[study_id] = protocol
    return protocol


@router.post("/studies/{study_id}/protocol")
async def save_protocol(study_id: str, request: SaveProtocolRequest, current_user: dict = Depends(get_current_user)):
    """Save a full protocol (after generation) to the store."""
    request.protocol.study_id = study_id
    request.protocol.updated_at = datetime.utcnow()
    _STORE[study_id] = request.protocol
    return {"status": "saved", "study_id": study_id}


@router.get("/studies/{study_id}/versions")
async def get_versions(study_id: str, current_user: dict = Depends(get_current_user)):
    """Return version history for a study (stub — returns current version only)."""
    protocol = _STORE.get(study_id)
    if not protocol:
        raise HTTPException(status_code=404, detail={"error": "not_found", "detail": f"Study {study_id} not found", "field": None})
    return [
        {
            "version": protocol.version,
            "updated_at": protocol.updated_at.isoformat(),
            "sections_count": len(protocol.sections),
        }
    ]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _infer_status(protocol: Protocol) -> str:
    if not protocol.sections:
        return "drafting"
    approved = sum(1 for s in protocol.sections.values() if s.status == "approved")
    total = len(protocol.sections)
    if approved == total:
        return "review"
    return "drafting"
