"""Unit tests for the methodology advisor scoring matrix."""

import pytest

from app.models.study_input import StudyInput
from app.models.methodology import MethodologyCategory
from app.services.methodology_advisor import recommend_methodology, compute_scores


def _make_inputs(**kwargs) -> StudyInput:
    base = {
        "drug_name": "TestDrug",
        "indication": "TestIndication",
        "study_type": "cohort",
    }
    base.update(kwargs)
    return StudyInput(**base)


class TestMethodologyAdvisor:
    def test_safety_cohort_with_comparator_recommends_acnu(self):
        """Safety signal + comparator + claims data → ACNU."""
        inputs = _make_inputs(
            research_question_type="safety_signal",
            outcome_rarity="common",
            data_collection="claims_ehr",
            comparators=["ComparatorDrug"],
            time_horizon="chronic",
        )
        rec = recommend_methodology(inputs)
        assert rec.primary == MethodologyCategory.ACNU

    def test_rare_outcome_recommends_nested_cc(self):
        """Safety signal + very rare outcome + claims → nested case-control."""
        inputs = _make_inputs(
            research_question_type="safety_signal",
            outcome_rarity="very_rare",
            data_collection="claims_ehr",
            time_horizon="subacute",
        )
        rec = recommend_methodology(inputs)
        assert rec.primary == MethodologyCategory.NESTED_CASE_CONTROL

    def test_pregnancy_safety_recommends_pregnancy_registry(self):
        """Pregnancy safety + registry data → pregnancy registry."""
        inputs = _make_inputs(
            research_question_type="pregnancy_safety",
            data_collection="registry",
            time_horizon="chronic",
        )
        rec = recommend_methodology(inputs)
        assert rec.primary == MethodologyCategory.PREGNANCY_REGISTRY

    def test_drug_utilization_recommends_dus(self):
        """Drug utilization question + claims → DUS."""
        inputs = _make_inputs(
            research_question_type="drug_utilization",
            data_collection="claims_ehr",
        )
        rec = recommend_methodology(inputs)
        assert rec.primary == MethodologyCategory.DRUG_UTILIZATION

    def test_acute_safety_signal_recommends_sccs(self):
        """Safety signal + rare outcome + acute → SCCS."""
        inputs = _make_inputs(
            research_question_type="safety_signal",
            outcome_rarity="rare",
            data_collection="claims_ehr",
            time_horizon="acute",
        )
        rec = recommend_methodology(inputs)
        assert rec.primary == MethodologyCategory.SCCS

    def test_risk_minimization_survey_recommends_survey(self):
        """Risk minimization + survey data → survey."""
        inputs = _make_inputs(
            research_question_type="risk_minimization",
            data_collection="survey",
        )
        rec = recommend_methodology(inputs)
        assert rec.primary == MethodologyCategory.SURVEY

    def test_recommendation_has_two_alternatives(self):
        inputs = _make_inputs(
            research_question_type="safety_signal",
            outcome_rarity="common",
            data_collection="claims_ehr",
            comparators=["Drug"],
            time_horizon="chronic",
        )
        rec = recommend_methodology(inputs)
        assert len(rec.alternatives) == 2
        assert all("display_name" in alt for alt in rec.alternatives)

    def test_recommendation_confidence_score_in_range(self):
        inputs = _make_inputs(
            research_question_type="effectiveness",
            outcome_rarity="uncommon",
            data_collection="claims_ehr",
            comparators=["Drug"],
            time_horizon="subacute",
        )
        rec = recommend_methodology(inputs)
        assert 0.0 <= rec.confidence_score <= 1.0

    def test_minimal_inputs_still_works(self):
        """With no methodology fields filled, should still return a recommendation."""
        inputs = _make_inputs()
        rec = recommend_methodology(inputs)
        assert rec.primary is not None
        assert rec.primary_display_name
        assert rec.reasoning

    def test_all_scores_sum_correctly(self):
        """Verify compute_scores returns scores for all 12 methodologies."""
        inputs = _make_inputs(
            research_question_type="safety_signal",
            outcome_rarity="common",
            data_collection="claims_ehr",
            time_horizon="chronic",
        )
        scores = compute_scores(inputs)
        assert len(scores) == len(MethodologyCategory)
        assert all(0.0 <= s <= 1.0 for s in scores.values())
