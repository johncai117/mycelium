"""
Backend API tests.

Run with: pytest backend/tests/ -v
(from repo root, with venv activated)
"""

import os
import json
import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DEMO_API_KEY", "test-key")

from app.main import app

client = TestClient(app)
AUTH = {"Authorization": "Bearer test-key"}

# ── Sample study input ────────────────────────────────────────────────────────

SAMPLE_INPUT = {
    "drug_name": "Tofacitinib",
    "drug_inn": "tofacitinib citrate",
    "indication": "Rheumatoid Arthritis",
    "study_type": "cohort",
    "data_source": "Optum EHR",
    "comparators": ["Adalimumab"],
    "study_period_start": "2015-01-01",
    "study_period_end": "2023-12-31",
    "geography": "US",
    "regulatory_context": "PASS",
    "sponsor": "Pfizer Inc.",
    "primary_outcome": "Major adverse cardiovascular events (MACE)",
    "population_description": "Adults ≥18 years with RA who have had inadequate response to conventional DMARDs",
    "index_date_logic": "First dispensing of tofacitinib with no prior use in 180-day washout period",
    "washout_days": 180,
    "new_user_design": True,
    "clinical_context": "This PASS is required under EMA condition following approval of tofacitinib for RA. "
                        "The study evaluates cardiovascular safety including VTE, MACE, and malignancy risks "
                        "relative to TNF inhibitors as mandated by the 2019 safety review.",
    "methodology": "acnu",
    "methodology_confidence": "recommended",
    "research_question_type": "safety_signal",
    "outcome_rarity": "uncommon",
    "data_collection": "claims_ehr",
    "time_horizon": "chronic",
}


# ── Health check ─────────────────────────────────────────────────────────────

def test_health():
    response = client.get("/health", headers=AUTH)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ── Clarify endpoint ──────────────────────────────────────────────────────────

def test_clarify_complete_inputs():
    """When all required fields are provided, should return is_sufficient=True."""
    response = client.post("/clarify", json={"study_inputs": SAMPLE_INPUT}, headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    assert "is_sufficient" in data
    assert "questions" in data
    # With all required fields provided, should have no required questions
    required_qs = [q for q in data["questions"] if q["required"]]
    assert len(required_qs) == 0, f"Unexpected required questions: {required_qs}"


def test_clarify_missing_data_source():
    """Missing data_source should trigger a required clarifying question."""
    inputs = {**SAMPLE_INPUT, "data_source": None}
    response = client.post("/clarify", json={"study_inputs": inputs}, headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    assert data["is_sufficient"] is False
    fields = [q["field"] for q in data["questions"]]
    assert "data_source" in fields


def test_clarify_missing_primary_outcome():
    """Missing primary_outcome should trigger a required clarifying question."""
    inputs = {**SAMPLE_INPUT, "primary_outcome": None}
    response = client.post("/clarify", json={"study_inputs": inputs}, headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    assert data["is_sufficient"] is False
    fields = [q["field"] for q in data["questions"]]
    assert "primary_outcome" in fields


def test_clarify_cohort_missing_comparators():
    """Cohort study missing comparators should trigger a required question."""
    inputs = {**SAMPLE_INPUT, "comparators": None}
    response = client.post("/clarify", json={"study_inputs": inputs}, headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    fields = [q["field"] for q in data["questions"]]
    assert "comparators" in fields


def test_clarify_short_clinical_context():
    """Short/missing clinical_context should trigger an optional question."""
    inputs = {**SAMPLE_INPUT, "clinical_context": "short"}
    response = client.post("/clarify", json={"study_inputs": inputs}, headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    optional_qs = [q for q in data["questions"] if not q["required"]]
    fields = [q["field"] for q in optional_qs]
    assert "clinical_context" in fields


# ── Retrieve endpoint ─────────────────────────────────────────────────────────

def test_retrieve_returns_list():
    """
    Retrieve should return a list (possibly empty if ChromaDB not populated).
    Should not error out if ChromaDB is unavailable.
    """
    response = client.post("/retrieve", json={"study_inputs": SAMPLE_INPUT}, headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


# ── Studies CRUD ─────────────────────────────────────────────────────────────

def test_create_and_get_study():
    """Create a study, then retrieve it by ID."""
    # Create
    create_resp = client.post("/studies", json={"study_inputs": SAMPLE_INPUT}, headers=AUTH)
    assert create_resp.status_code == 201
    study = create_resp.json()
    assert "id" in study
    assert study["drug_name"] == "Tofacitinib"
    assert study["indication"] == "Rheumatoid Arthritis"
    assert study["study_type"] == "cohort"
    study_id = study["id"]

    # Get
    get_resp = client.get(f"/studies/{study_id}", headers=AUTH)
    assert get_resp.status_code == 200
    protocol = get_resp.json()
    assert protocol["study_id"] == study_id
    assert protocol["study_inputs"]["drug_name"] == "Tofacitinib"


def test_list_studies():
    """Create a study and verify it appears in the list."""
    # Create a study first
    create_resp = client.post("/studies", json={"study_inputs": SAMPLE_INPUT}, headers=AUTH)
    assert create_resp.status_code == 201
    study_id = create_resp.json()["id"]

    # List
    list_resp = client.get("/studies", headers=AUTH)
    assert list_resp.status_code == 200
    studies = list_resp.json()
    assert isinstance(studies, list)
    ids = [s["id"] for s in studies]
    assert study_id in ids


def test_get_nonexistent_study():
    """Should return 404 for an unknown study_id."""
    response = client.get("/studies/00000000-0000-0000-0000-000000000000", headers=AUTH)
    assert response.status_code == 404


def test_update_study():
    """Update study inputs for an existing study."""
    # Create
    create_resp = client.post("/studies", json={"study_inputs": SAMPLE_INPUT}, headers=AUTH)
    study_id = create_resp.json()["id"]

    # Update
    updated = {**SAMPLE_INPUT, "sponsor": "Pfizer Updated"}
    update_resp = client.put(f"/studies/{study_id}", json={"study_inputs": updated}, headers=AUTH)
    assert update_resp.status_code == 200
    assert update_resp.json()["study_inputs"]["sponsor"] == "Pfizer Updated"


def test_study_versions():
    """Version history endpoint should return at least one version."""
    create_resp = client.post("/studies", json={"study_inputs": SAMPLE_INPUT}, headers=AUTH)
    study_id = create_resp.json()["id"]

    versions_resp = client.get(f"/studies/{study_id}/versions", headers=AUTH)
    assert versions_resp.status_code == 200
    versions = versions_resp.json()
    assert len(versions) >= 1
    assert "version" in versions[0]


# ── Eval endpoint (rule-based only, no LLM) ──────────────────────────────────

def test_eval_empty_protocol():
    """Scoring an empty protocol should return a low score (D grade)."""
    from datetime import datetime
    from app.models.protocol import Protocol, CodeSets
    from app.models.study_input import StudyInput

    protocol_dict = {
        "study_id": "test-001",
        "study_inputs": SAMPLE_INPUT,
        "sections": {},
        "code_sets": {"icd10": [], "ndc": [], "cpt": []},
        "flags": [],
        "version": 1,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    response = client.post("/eval", json={"protocol": protocol_dict}, headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    assert "encepp_score" in data
    assert data["encepp_score"] == 0
    assert data["overall_grade"] == "D"


def test_eval_with_content():
    """A protocol with some content should score above 0."""
    from datetime import datetime

    sections = {
        "background": {
            "content": "This study examines the cardiovascular safety of tofacitinib in patients with rheumatoid arthritis. The primary objective is to estimate the incidence of major adverse cardiovascular events (MACE). The data source is Optum EHR, covering a large US population of enrolled beneficiaries.",
            "references_used": [],
            "confidence": "high",
            "ai_generated": True,
        },
        "objectives": {
            "content": "The primary objective is to estimate the incidence rate of major adverse cardiovascular events (MACE) among new users of tofacitinib compared to new users of adalimumab in patients with rheumatoid arthritis. Population: adults ≥18 with RA. Exposure: tofacitinib. Comparator: adalimumab. Outcome: MACE.",
            "references_used": [],
            "confidence": "high",
            "ai_generated": True,
        },
        "study_design": {
            "content": "This is a retrospective new-user cohort study using active comparator design. The rationale for choosing a cohort design is appropriate for comparing incidence rates between treatment groups. The study period runs from 2015 to 2023.",
            "references_used": [],
            "confidence": "high",
            "ai_generated": True,
        },
        "study_setting": {
            "content": "The study uses the Optum EHR database, a large US electronic health record database covering approximately 100 million enrolled patients across the United States. The study period is January 2015 to December 2023. The geography is US.",
            "references_used": [],
            "confidence": "high",
            "ai_generated": True,
        },
        "cohort_definition": {
            "content": "The index date is defined as the first pharmacy dispensing of tofacitinib during the accrual period. New-user design requires a 180-day washout period with no prior use of the study drug. Patients must be incident users meeting the new user criteria. Inclusion: age ≥18, RA diagnosis, continuous enrollment ≥6 months.",
            "references_used": [],
            "confidence": "medium",
            "ai_generated": True,
        },
        "variables": {
            "content": "Primary outcome: MACE defined as the first occurrence of myocardial infarction (ICD-10: I21.x), stroke (ICD-10: I63.x), or cardiovascular death. Outcome validated using at least one inpatient primary diagnosis code. Drug exposure defined by NDC codes. Secondary outcome: hospitalized heart failure.",
            "references_used": [],
            "confidence": "medium",
            "ai_generated": True,
        },
        "data_analysis": {
            "content": "Cox proportional hazards regression will be used to estimate hazard ratios. Propensity score matching will be used for confounding adjustment. Sensitivity analyses include as-treated analysis and per-protocol analysis. Incidence rates will be reported.",
            "references_used": [],
            "confidence": "high",
            "ai_generated": True,
        },
        "limitations": {
            "content": "Limitations include potential for unmeasured confounding, selection bias due to channeling, and misclassification of outcomes. Generalizability to non-US populations may be limited. Residual confounding cannot be excluded.",
            "references_used": [],
            "confidence": "high",
            "ai_generated": True,
        },
        "ethics": {
            "content": "This study uses de-identified data covered under a data use agreement. Informed consent was waived by the IRB institutional review board. The study does not require ethics committee approval as no interventions are performed. HIPAA-compliant data handling.",
            "references_used": [],
            "confidence": "high",
            "ai_generated": True,
        },
    }

    protocol_dict = {
        "study_id": "test-002",
        "study_inputs": SAMPLE_INPUT,
        "sections": sections,
        "code_sets": {"icd10": [], "ndc": [], "cpt": []},
        "flags": [],
        "version": 1,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    response = client.post("/eval", json={"protocol": protocol_dict}, headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    assert data["encepp_score"] > 0
    assert data["overall_grade"] in ("A", "B", "C", "D")
    assert len(data["encepp_items"]) > 0


# ── Code sets service ─────────────────────────────────────────────────────────

def test_code_sets_lookup():
    """Code set lookup should return ICD-10 codes for known conditions."""
    from app.services.code_sets import CodeSetService
    svc = CodeSetService()

    result = svc.lookup("rheumatoid arthritis")
    assert len(result["icd10"]) > 0

    result2 = svc.lookup("tofacitinib")
    # NDC lookup — may or may not have results depending on seed data
    assert isinstance(result2["ndc"], list)


# ── Export endpoint ───────────────────────────────────────────────────────────

def test_export_docx():
    """Export endpoint should return a valid DOCX file."""
    from datetime import datetime

    protocol_dict = {
        "study_id": "test-export",
        "study_inputs": SAMPLE_INPUT,
        "sections": {
            "background": {
                "content": "This is the background section of the protocol.",
                "references_used": [],
                "confidence": "high",
                "ai_generated": True,
            }
        },
        "code_sets": {"icd10": [], "ndc": [], "cpt": []},
        "flags": [],
        "version": 1,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    response = client.post("/export/docx", json={"protocol": protocol_dict}, headers=AUTH)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    assert len(response.content) > 1000  # should be a non-trivial file
