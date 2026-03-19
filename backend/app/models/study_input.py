from typing import Any, Literal, Optional
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

    # Methodology decision fields
    methodology: Optional[str] = None  # MethodologyCategory value
    methodology_confidence: Optional[Literal[
        "recommended", "user_selected", "overridden"
    ]] = None
    research_question_type: Optional[Literal[
        "safety_signal", "drug_utilization", "effectiveness",
        "risk_minimization", "pregnancy_safety", "other"
    ]] = None
    outcome_rarity: Optional[Literal["common", "uncommon", "rare", "very_rare"]] = None
    data_collection: Optional[Literal["claims_ehr", "registry", "survey", "prospective"]] = None
    time_horizon: Optional[Literal["acute", "subacute", "chronic"]] = None

    # Regulatory intake fields
    regulatory_requirement_types: list[str] = []
    regulatory_doc_extracted: Optional[dict[str, Any]] = None
    protocol_template_id: Optional[str] = None
    study_scope: list[str] = []
    selected_data_sources: list[str] = []
