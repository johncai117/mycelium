import re
import logging
from typing import Optional

from app.models.protocol import Protocol
from app.models.eval_result import ENCEPPItem, EvalResult, ImprovementSuggestion

logger = logging.getLogger(__name__)

# ENCEPP checklist items mapped to protocol sections
ENCEPP_CHECKLIST = [
    # Research Question
    {"item": "Primary objective clearly stated", "section": "objectives", "keywords": ["primary objective", "primary aim", "primary research question"]},
    {"item": "PICO elements defined (Population, Intervention, Comparator, Outcome)", "section": "objectives", "keywords": ["population", "exposure", "comparator", "outcome"]},

    # Study Design
    {"item": "Study design named and described", "section": "study_design", "keywords": ["cohort", "case-control", "cross-sectional", "retrospective", "prospective"]},
    {"item": "Rationale for study design provided", "section": "study_design", "keywords": ["rationale", "chosen because", "appropriate for", "suitable"]},
    {"item": "New-user design documented (if applicable)", "section": "cohort_definition", "keywords": ["new user", "new-user", "incident user", "washout"]},

    # Source Population
    {"item": "Database/data source described", "section": "study_setting", "keywords": ["database", "data source", "claims", "ehr", "electronic health record", "registry"]},
    {"item": "Database coverage and population described", "section": "study_setting", "keywords": ["coverage", "enrolled", "beneficiaries", "patients"]},
    {"item": "Study time period specified", "section": "study_setting", "keywords": ["study period", "from", "between", "january", "2"]},
    {"item": "Geographic coverage specified", "section": "study_setting", "keywords": ["united states", "us ", "europe", "eu ", "geography", "region"]},

    # Exposure
    {"item": "Drug exposure defined with code list", "section": "variables", "keywords": ["ndc", "drug code", "atc", "rxnorm", "national drug code"]},
    {"item": "Index date logic specified", "section": "cohort_definition", "keywords": ["index date", "index event", "first prescription", "first fill", "initiation"]},
    {"item": "Washout period defined", "section": "cohort_definition", "keywords": ["washout", "wash-out", "days prior", "clean period"]},
    {"item": "New-user/incident-user criteria stated", "section": "cohort_definition", "keywords": ["no prior use", "naive", "new user", "incident", "washout period"]},

    # Outcomes
    {"item": "Primary outcome defined", "section": "variables", "keywords": ["primary outcome", "primary endpoint", "outcome of interest"]},
    {"item": "Outcome validated with code list (ICD/CPT)", "section": "variables", "keywords": ["icd", "icd-10", "icd-9", "cpt", "diagnosis code"]},
    {"item": "Secondary outcomes listed", "section": "variables", "keywords": ["secondary outcome", "secondary endpoint", "additional outcome"]},

    # Covariates
    {"item": "Confounder list specified", "section": "variables", "keywords": ["confounder", "covariate", "covariate", "potential confounder", "confounding variable"]},
    {"item": "Baseline period for covariate assessment defined", "section": "cohort_definition", "keywords": ["baseline period", "baseline window", "look-back", "lookback", "prior to index"]},
    {"item": "Source of covariate data described", "section": "study_setting", "keywords": ["covariate data", "baseline characteristics", "medical history"]},

    # Statistical Analysis
    {"item": "Primary analysis method named", "section": "data_analysis", "keywords": ["cox", "logistic regression", "poisson", "propensity score", "hazard ratio", "odds ratio", "incidence rate"]},
    {"item": "Confounding adjustment method described", "section": "data_analysis", "keywords": ["propensity score", "iptw", "inverse probability", "matching", "adjustment", "multivariable"]},
    {"item": "Sensitivity analyses planned", "section": "data_analysis", "keywords": ["sensitivity analysis", "sensitivity analyses", "as-treated", "per-protocol", "active comparator"]},

    # Bias Discussion
    {"item": "Selection bias discussed", "section": "limitations", "keywords": ["selection bias", "selection", "enrollment bias", "sampling"]},
    {"item": "Information bias / misclassification discussed", "section": "limitations", "keywords": ["misclassification", "information bias", "coding error", "measurement error"]},
    {"item": "Confounding discussed", "section": "limitations", "keywords": ["confounding", "unmeasured confound", "residual confound", "channeling bias"]},
    {"item": "Generalizability addressed", "section": "limitations", "keywords": ["generalizability", "generalisability", "external validity", "representativeness"]},

    # Ethics
    {"item": "IRB/ethics board statement included", "section": "ethics", "keywords": ["irb", "ethics committee", "institutional review board", "ethics board", "waiver"]},
    {"item": "Data use agreement / data privacy addressed", "section": "ethics", "keywords": ["data use agreement", "dua", "hipaa", "data privacy", "confidentiality"]},
    {"item": "Informed consent statement included", "section": "ethics", "keywords": ["informed consent", "consent waiver", "consent not required", "waiver of consent"]},
]


def _score_item(item: dict, protocol: Protocol) -> ENCEPPItem:
    section_name = item["section"]
    section = protocol.sections.get(section_name)

    if section is None:
        return ENCEPPItem(
            item=item["item"],
            section=section_name,
            score=0.0,
            finding="Section not generated.",
        )

    content_lower = section.content.lower()
    matched_keywords = [kw for kw in item["keywords"] if kw.lower() in content_lower]

    if len(matched_keywords) >= 2:
        score = 1.0
        finding = f"Present (matched: {', '.join(matched_keywords[:2])})."
    elif len(matched_keywords) == 1:
        score = 0.5
        finding = f"Partially addressed (matched: {matched_keywords[0]})."
    else:
        score = 0.0
        finding = "Not found. Consider adding explicit language."

    return ENCEPPItem(
        item=item["item"],
        section=section_name,
        score=score,
        finding=finding,
    )


def _compute_grade(score: int) -> str:
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "D"


def score_protocol(protocol: Protocol) -> EvalResult:
    items = [_score_item(item, protocol) for item in ENCEPP_CHECKLIST]
    total_points = sum(i.score for i in items)
    max_points = len(ENCEPP_CHECKLIST)
    encepp_score = round((total_points / max_points) * 100) if max_points > 0 else 0
    grade = _compute_grade(encepp_score)

    # Generate basic improvement suggestions from failing items
    suggestions = []
    for item in items:
        if item.score < 1.0:
            suggestions.append(
                ImprovementSuggestion(
                    section=item.section,
                    suggestion=f"Improve '{item.item}': {item.finding}",
                )
            )

    return EvalResult(
        encepp_score=encepp_score,
        overall_grade=grade,
        encepp_items=items,
        judge_narrative="",  # Populated separately by LLM judge
        improvement_suggestions=suggestions,
    )
