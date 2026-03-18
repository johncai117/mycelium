from typing import Literal, Optional
from pydantic import BaseModel


class ENCEPPItem(BaseModel):
    item: str
    section: str
    score: float  # 0, 0.5, or 1
    finding: str


class ImprovementSuggestion(BaseModel):
    section: str
    suggestion: str


class JudgeResult(BaseModel):
    narrative: str
    improvement_suggestions: list[ImprovementSuggestion]


class EvalResult(BaseModel):
    encepp_score: int
    overall_grade: Literal["A", "B", "C", "D"]
    encepp_items: list[ENCEPPItem]
    judge_narrative: Optional[str] = None
    improvement_suggestions: list[ImprovementSuggestion] = []
