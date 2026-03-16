from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

from .study_input import StudyInput


class ProtocolSection(BaseModel):
    content: str
    references_used: list[str] = Field(default_factory=list)
    confidence: Literal["high", "medium", "low"] = "medium"
    ai_generated: bool = True


class ProtocolFlag(BaseModel):
    section: str
    message: str
    severity: Literal["info", "warning", "requires_judgment"] = "info"


class CodeSets(BaseModel):
    icd10: list[dict] = Field(default_factory=list)
    ndc: list[dict] = Field(default_factory=list)
    cpt: list[dict] = Field(default_factory=list)


class Protocol(BaseModel):
    study_id: str
    study_inputs: StudyInput
    sections: dict[str, ProtocolSection] = Field(default_factory=dict)
    code_sets: CodeSets = Field(default_factory=CodeSets)
    flags: list[ProtocolFlag] = Field(default_factory=list)
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
