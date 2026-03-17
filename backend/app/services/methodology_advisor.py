import logging
from typing import Optional

from app.models.study_input import StudyInput
from app.models.methodology import (
    MethodologyCategory,
    MethodologyRecommendation,
    METHODOLOGY_REGISTRY,
)

logger = logging.getLogger(__name__)

# Scoring matrix: for each (factor_value, methodology) pair, a fit score 0.0–1.0
# Weights: research_question_type=0.30, outcome_rarity=0.20, data_collection=0.20,
#           comparator_available=0.15, time_horizon=0.15

_QUESTION_TYPE_SCORES: dict[str, dict[MethodologyCategory, float]] = {
    "safety_signal": {
        MethodologyCategory.ACNU: 1.0,
        MethodologyCategory.PREVALENT_USER: 0.6,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.5,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.8,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.5,
        MethodologyCategory.SCCS: 0.7,
        MethodologyCategory.CASE_CROSSOVER: 0.6,
        MethodologyCategory.CROSS_SECTIONAL: 0.1,
        MethodologyCategory.DRUG_UTILIZATION: 0.0,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.5,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.2,
        MethodologyCategory.SURVEY: 0.0,
    },
    "drug_utilization": {
        MethodologyCategory.ACNU: 0.0,
        MethodologyCategory.PREVALENT_USER: 0.1,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.3,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.0,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.0,
        MethodologyCategory.SCCS: 0.0,
        MethodologyCategory.CASE_CROSSOVER: 0.0,
        MethodologyCategory.CROSS_SECTIONAL: 0.3,
        MethodologyCategory.DRUG_UTILIZATION: 1.0,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.2,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.0,
        MethodologyCategory.SURVEY: 0.2,
    },
    "effectiveness": {
        MethodologyCategory.ACNU: 1.0,
        MethodologyCategory.PREVALENT_USER: 0.7,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.2,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.4,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.3,
        MethodologyCategory.SCCS: 0.2,
        MethodologyCategory.CASE_CROSSOVER: 0.1,
        MethodologyCategory.CROSS_SECTIONAL: 0.1,
        MethodologyCategory.DRUG_UTILIZATION: 0.0,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.6,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.1,
        MethodologyCategory.SURVEY: 0.0,
    },
    "risk_minimization": {
        MethodologyCategory.ACNU: 0.1,
        MethodologyCategory.PREVALENT_USER: 0.1,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.2,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.0,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.0,
        MethodologyCategory.SCCS: 0.0,
        MethodologyCategory.CASE_CROSSOVER: 0.0,
        MethodologyCategory.CROSS_SECTIONAL: 0.3,
        MethodologyCategory.DRUG_UTILIZATION: 0.4,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.2,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.0,
        MethodologyCategory.SURVEY: 1.0,
    },
    "pregnancy_safety": {
        MethodologyCategory.ACNU: 0.2,
        MethodologyCategory.PREVALENT_USER: 0.1,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.3,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.3,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.2,
        MethodologyCategory.SCCS: 0.1,
        MethodologyCategory.CASE_CROSSOVER: 0.0,
        MethodologyCategory.CROSS_SECTIONAL: 0.1,
        MethodologyCategory.DRUG_UTILIZATION: 0.0,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.5,
        MethodologyCategory.PREGNANCY_REGISTRY: 1.0,
        MethodologyCategory.SURVEY: 0.0,
    },
    "other": {
        m: 0.3 for m in MethodologyCategory
    },
}

_OUTCOME_RARITY_SCORES: dict[str, dict[MethodologyCategory, float]] = {
    "common": {
        MethodologyCategory.ACNU: 1.0,
        MethodologyCategory.PREVALENT_USER: 0.8,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.8,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.3,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.3,
        MethodologyCategory.SCCS: 0.7,
        MethodologyCategory.CASE_CROSSOVER: 0.5,
        MethodologyCategory.CROSS_SECTIONAL: 0.6,
        MethodologyCategory.DRUG_UTILIZATION: 0.5,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.7,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.5,
        MethodologyCategory.SURVEY: 0.5,
    },
    "uncommon": {
        MethodologyCategory.ACNU: 0.8,
        MethodologyCategory.PREVALENT_USER: 0.7,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.7,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.6,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.5,
        MethodologyCategory.SCCS: 0.7,
        MethodologyCategory.CASE_CROSSOVER: 0.6,
        MethodologyCategory.CROSS_SECTIONAL: 0.4,
        MethodologyCategory.DRUG_UTILIZATION: 0.5,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.6,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.5,
        MethodologyCategory.SURVEY: 0.4,
    },
    "rare": {
        MethodologyCategory.ACNU: 0.4,
        MethodologyCategory.PREVALENT_USER: 0.4,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.5,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.9,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.8,
        MethodologyCategory.SCCS: 0.9,
        MethodologyCategory.CASE_CROSSOVER: 0.7,
        MethodologyCategory.CROSS_SECTIONAL: 0.2,
        MethodologyCategory.DRUG_UTILIZATION: 0.3,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.5,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.4,
        MethodologyCategory.SURVEY: 0.3,
    },
    "very_rare": {
        MethodologyCategory.ACNU: 0.2,
        MethodologyCategory.PREVALENT_USER: 0.2,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.4,
        MethodologyCategory.NESTED_CASE_CONTROL: 1.0,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.9,
        MethodologyCategory.SCCS: 0.7,
        MethodologyCategory.CASE_CROSSOVER: 0.6,
        MethodologyCategory.CROSS_SECTIONAL: 0.1,
        MethodologyCategory.DRUG_UTILIZATION: 0.2,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.4,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.3,
        MethodologyCategory.SURVEY: 0.2,
    },
}

_DATA_COLLECTION_SCORES: dict[str, dict[MethodologyCategory, float]] = {
    "claims_ehr": {
        MethodologyCategory.ACNU: 1.0,
        MethodologyCategory.PREVALENT_USER: 0.9,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.9,
        MethodologyCategory.NESTED_CASE_CONTROL: 1.0,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.8,
        MethodologyCategory.SCCS: 1.0,
        MethodologyCategory.CASE_CROSSOVER: 0.9,
        MethodologyCategory.CROSS_SECTIONAL: 0.8,
        MethodologyCategory.DRUG_UTILIZATION: 1.0,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.2,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.3,
        MethodologyCategory.SURVEY: 0.1,
    },
    "registry": {
        MethodologyCategory.ACNU: 0.3,
        MethodologyCategory.PREVALENT_USER: 0.3,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.5,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.4,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.4,
        MethodologyCategory.SCCS: 0.3,
        MethodologyCategory.CASE_CROSSOVER: 0.2,
        MethodologyCategory.CROSS_SECTIONAL: 0.3,
        MethodologyCategory.DRUG_UTILIZATION: 0.3,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 1.0,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.9,
        MethodologyCategory.SURVEY: 0.2,
    },
    "survey": {
        MethodologyCategory.ACNU: 0.0,
        MethodologyCategory.PREVALENT_USER: 0.0,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.1,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.0,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.0,
        MethodologyCategory.SCCS: 0.0,
        MethodologyCategory.CASE_CROSSOVER: 0.0,
        MethodologyCategory.CROSS_SECTIONAL: 0.5,
        MethodologyCategory.DRUG_UTILIZATION: 0.2,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.1,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.0,
        MethodologyCategory.SURVEY: 1.0,
    },
    "prospective": {
        MethodologyCategory.ACNU: 0.3,
        MethodologyCategory.PREVALENT_USER: 0.3,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.4,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.2,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.2,
        MethodologyCategory.SCCS: 0.2,
        MethodologyCategory.CASE_CROSSOVER: 0.1,
        MethodologyCategory.CROSS_SECTIONAL: 0.2,
        MethodologyCategory.DRUG_UTILIZATION: 0.2,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 1.0,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.8,
        MethodologyCategory.SURVEY: 0.3,
    },
}

_TIME_HORIZON_SCORES: dict[str, dict[MethodologyCategory, float]] = {
    "acute": {
        MethodologyCategory.ACNU: 0.5,
        MethodologyCategory.PREVALENT_USER: 0.3,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.4,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.6,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.5,
        MethodologyCategory.SCCS: 1.0,
        MethodologyCategory.CASE_CROSSOVER: 1.0,
        MethodologyCategory.CROSS_SECTIONAL: 0.3,
        MethodologyCategory.DRUG_UTILIZATION: 0.5,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.3,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.3,
        MethodologyCategory.SURVEY: 0.5,
    },
    "subacute": {
        MethodologyCategory.ACNU: 0.8,
        MethodologyCategory.PREVALENT_USER: 0.6,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.6,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.7,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.5,
        MethodologyCategory.SCCS: 0.6,
        MethodologyCategory.CASE_CROSSOVER: 0.3,
        MethodologyCategory.CROSS_SECTIONAL: 0.4,
        MethodologyCategory.DRUG_UTILIZATION: 0.5,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.5,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.6,
        MethodologyCategory.SURVEY: 0.5,
    },
    "chronic": {
        MethodologyCategory.ACNU: 0.9,
        MethodologyCategory.PREVALENT_USER: 1.0,
        MethodologyCategory.DESCRIPTIVE_COHORT: 0.7,
        MethodologyCategory.NESTED_CASE_CONTROL: 0.5,
        MethodologyCategory.POPULATION_CASE_CONTROL: 0.4,
        MethodologyCategory.SCCS: 0.2,
        MethodologyCategory.CASE_CROSSOVER: 0.1,
        MethodologyCategory.CROSS_SECTIONAL: 0.4,
        MethodologyCategory.DRUG_UTILIZATION: 0.5,
        MethodologyCategory.PROSPECTIVE_REGISTRY: 0.9,
        MethodologyCategory.PREGNANCY_REGISTRY: 0.5,
        MethodologyCategory.SURVEY: 0.4,
    },
}

WEIGHTS = {
    "research_question_type": 0.30,
    "outcome_rarity": 0.20,
    "data_collection": 0.20,
    "comparator": 0.15,
    "time_horizon": 0.15,
}


def _comparator_score(has_comparator: bool, methodology: MethodologyCategory) -> float:
    profile = METHODOLOGY_REGISTRY[methodology]
    if has_comparator and profile.requires_comparator:
        return 1.0
    if has_comparator and not profile.requires_comparator:
        return 0.6
    if not has_comparator and not profile.requires_comparator:
        return 0.8
    # No comparator but methodology requires one
    return 0.1


def compute_scores(inputs: StudyInput) -> dict[MethodologyCategory, float]:
    has_comparator = bool(inputs.comparators and len(inputs.comparators) > 0)
    scores: dict[MethodologyCategory, float] = {}

    for m in MethodologyCategory:
        total = 0.0
        weight_sum = 0.0

        if inputs.research_question_type:
            score_map = _QUESTION_TYPE_SCORES.get(inputs.research_question_type, {})
            total += WEIGHTS["research_question_type"] * score_map.get(m, 0.3)
            weight_sum += WEIGHTS["research_question_type"]

        if inputs.outcome_rarity:
            score_map = _OUTCOME_RARITY_SCORES.get(inputs.outcome_rarity, {})
            total += WEIGHTS["outcome_rarity"] * score_map.get(m, 0.3)
            weight_sum += WEIGHTS["outcome_rarity"]

        if inputs.data_collection:
            score_map = _DATA_COLLECTION_SCORES.get(inputs.data_collection, {})
            total += WEIGHTS["data_collection"] * score_map.get(m, 0.3)
            weight_sum += WEIGHTS["data_collection"]

        # Comparator is always available from inputs
        total += WEIGHTS["comparator"] * _comparator_score(has_comparator, m)
        weight_sum += WEIGHTS["comparator"]

        if inputs.time_horizon:
            score_map = _TIME_HORIZON_SCORES.get(inputs.time_horizon, {})
            total += WEIGHTS["time_horizon"] * score_map.get(m, 0.3)
            weight_sum += WEIGHTS["time_horizon"]

        scores[m] = total / weight_sum if weight_sum > 0 else 0.3

    return scores


def _generate_reasoning(
    primary: MethodologyCategory,
    inputs: StudyInput,
    score: float,
) -> str:
    profile = METHODOLOGY_REGISTRY[primary]
    parts = [f"Based on your study parameters, {profile.display_name} is recommended"]

    reasons = []
    if inputs.research_question_type:
        type_labels = {
            "safety_signal": "safety signal investigation",
            "drug_utilization": "drug utilization assessment",
            "effectiveness": "comparative effectiveness research",
            "risk_minimization": "risk minimization evaluation",
            "pregnancy_safety": "pregnancy safety monitoring",
            "other": "the specified research question",
        }
        reasons.append(type_labels.get(inputs.research_question_type, "your research question"))

    if inputs.outcome_rarity and inputs.outcome_rarity in ("rare", "very_rare"):
        reasons.append(f"the {inputs.outcome_rarity.replace('_', ' ')} outcome frequency")

    if inputs.time_horizon:
        reasons.append(f"the {inputs.time_horizon} time horizon")

    if reasons:
        parts.append(f" for {', '.join(reasons)}")

    parts.append(f". {profile.description.split('.')[0]}.")
    return "".join(parts)


def recommend_methodology(
    inputs: StudyInput,
    llm_service: Optional[object] = None,
) -> MethodologyRecommendation:
    scores = compute_scores(inputs)
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    primary_cat, primary_score = ranked[0]
    alternatives = [
        {
            "id": cat.value,
            "display_name": METHODOLOGY_REGISTRY[cat].display_name,
            "score": round(score, 3),
        }
        for cat, score in ranked[1:3]
    ]

    profile = METHODOLOGY_REGISTRY[primary_cat]
    reasoning = _generate_reasoning(primary_cat, inputs, primary_score)

    return MethodologyRecommendation(
        primary=primary_cat,
        primary_display_name=profile.display_name,
        primary_description=profile.description,
        confidence_score=round(primary_score, 3),
        reasoning=reasoning,
        alternatives=alternatives,
    )
