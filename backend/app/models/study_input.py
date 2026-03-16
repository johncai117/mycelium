from typing import Literal, Optional
from pydantic import BaseModel


class StudyInput(BaseModel):
    # Required
    drug_name: str
    indication: str
    study_type: Literal["cohort", "case_control", "cross_sectional", "other"]

    # Optional identifiers
    drug_inn: Optional[str] = None

    # Strongly recommended (trigger clarifying questions if missing)
    data_source: Optional[str] = None
    comparators: Optional[list[str]] = None
    study_period_start: Optional[str] = None
    study_period_end: Optional[str] = None
    geography: Optional[str] = None

    # Optional / inferable
    regulatory_context: Optional[Literal["PASS", "voluntary", "investigator_initiated"]] = None
    sponsor: Optional[str] = None
    primary_outcome: Optional[str] = None
    population_description: Optional[str] = None
    index_date_logic: Optional[str] = None
    washout_days: Optional[int] = 180
    new_user_design: Optional[bool] = True
    clinical_context: Optional[str] = None
