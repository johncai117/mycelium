import re
import logging
from typing import Optional

from app.models.protocol import Protocol
from app.models.eval_result import ENCEPPItem, EvalResult, ImprovementSuggestion

logger = logging.getLogger(__name__)

# Methodology-specific checklist items appended to base ENCEPP_CHECKLIST
METHODOLOGY_CHECKLIST: dict[str, list[dict]] = {
    "acnu": [
        {"item": "Active comparator clinically justified", "section": "study_design", "keywords": ["active comparator", "comparator", "justified", "appropriate"]},
        {"item": "Symmetric cohort entry criteria documented", "section": "cohort_definition", "keywords": ["symmetric", "identical criteria", "same eligibility", "same washout"]},
        {"item": "Propensity score method specified", "section": "data_analysis", "keywords": ["propensity score", "iptw", "matching", "overlap weight"]},
        {"item": "Balance diagnostics planned", "section": "data_analysis", "keywords": ["balance", "smd", "standardized mean difference", "covariate balance"]},
    ],
    "prevalent_user": [
        {"item": "Prevalent-user bias acknowledged and mitigated", "section": "study_design", "keywords": ["prevalent user", "prevalent-user bias", "depletion of susceptibles"]},
        {"item": "Treatment duration at entry addressed", "section": "cohort_definition", "keywords": ["treatment duration", "time on treatment", "duration at entry"]},
        {"item": "Immortal time bias addressed", "section": "data_analysis", "keywords": ["immortal time", "immortal time bias", "landmark"]},
    ],
    "descriptive_cohort": [
        {"item": "Absence of comparator justified", "section": "study_design", "keywords": ["no comparator", "single-arm", "single arm", "descriptive"]},
        {"item": "External comparison rates cited if applicable", "section": "data_analysis", "keywords": ["background rate", "external", "reference rate", "expected rate"]},
    ],
    "nested_case_control": [
        {"item": "Source cohort clearly defined", "section": "cohort_definition", "keywords": ["source cohort", "base cohort", "underlying cohort"]},
        {"item": "Incidence density sampling specified", "section": "cohort_definition", "keywords": ["incidence density", "risk-set sampling", "risk set", "density sampling"]},
        {"item": "Number of controls per case stated", "section": "cohort_definition", "keywords": ["controls per case", "control ratio", "matched controls"]},
        {"item": "Conditional logistic regression specified", "section": "data_analysis", "keywords": ["conditional logistic", "conditional regression", "matched analysis"]},
    ],
    "population_case_control": [
        {"item": "Population representativeness addressed", "section": "study_design", "keywords": ["representative", "population-based", "source population"]},
        {"item": "Control selection strategy defined", "section": "cohort_definition", "keywords": ["control selection", "control sampling", "control group"]},
    ],
    "sccs": [
        {"item": "Risk windows defined with duration", "section": "cohort_definition", "keywords": ["risk window", "risk period", "exposed period", "days 1"]},
        {"item": "Control windows defined", "section": "cohort_definition", "keywords": ["control window", "control period", "unexposed", "baseline period"]},
        {"item": "Event-independent exposure assumption addressed", "section": "study_design", "keywords": ["event-dependent", "event independent", "modified sccs", "assumption"]},
        {"item": "Conditional Poisson regression specified", "section": "data_analysis", "keywords": ["conditional poisson", "poisson regression", "sccs model"]},
    ],
    "case_crossover": [
        {"item": "Hazard window defined", "section": "cohort_definition", "keywords": ["hazard window", "hazard period", "case window"]},
        {"item": "Control window(s) defined", "section": "cohort_definition", "keywords": ["control window", "referent window", "reference period"]},
        {"item": "Transient exposure assumption justified", "section": "study_design", "keywords": ["transient", "intermittent", "acute effect"]},
    ],
    "drug_utilization": [
        {"item": "Utilization metrics defined (DDD, duration, switching)", "section": "variables", "keywords": ["ddd", "defined daily dose", "treatment duration", "switching", "adherence"]},
        {"item": "Prescribing patterns characterized", "section": "variables", "keywords": ["prescribing pattern", "utilization pattern", "prescribing volume"]},
    ],
    "prospective_registry": [
        {"item": "Enrollment procedures described", "section": "cohort_definition", "keywords": ["enrollment", "enrolment", "recruitment", "registration"]},
        {"item": "Follow-up schedule specified", "section": "cohort_definition", "keywords": ["follow-up schedule", "visit schedule", "follow-up visit", "assessment time"]},
        {"item": "Attrition strategy described", "section": "data_analysis", "keywords": ["attrition", "loss to follow-up", "retention", "dropout"]},
    ],
    "pregnancy_registry": [
        {"item": "Pregnancy outcome definitions specified", "section": "cohort_definition", "keywords": ["live birth", "spontaneous abortion", "stillbirth", "congenital malformation"]},
        {"item": "Gestational timing of exposure defined", "section": "cohort_definition", "keywords": ["trimester", "gestational age", "first trimester", "gestational week"]},
        {"item": "Background malformation rates referenced", "section": "data_analysis", "keywords": ["background rate", "eurocat", "baseline prevalence", "expected rate"]},
    ],
    "survey": [
        {"item": "Survey instrument described or referenced", "section": "cohort_definition", "keywords": ["questionnaire", "survey instrument", "survey tool", "validated"]},
        {"item": "Response rate and non-response bias addressed", "section": "data_analysis", "keywords": ["response rate", "non-response", "nonresponse", "participation rate"]},
        {"item": "Target sample size for survey justified", "section": "cohort_definition", "keywords": ["sample size", "target sample", "number of respondents"]},
    ],
}

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
    checklist = list(ENCEPP_CHECKLIST)

    # Append methodology-specific items if methodology is set
    methodology = getattr(protocol.study_inputs, "methodology", None) if protocol.study_inputs else None
    if methodology and methodology in METHODOLOGY_CHECKLIST:
        checklist = checklist + METHODOLOGY_CHECKLIST[methodology]

    items = [_score_item(item, protocol) for item in checklist]
    total_points = sum(i.score for i in items)
    max_points = len(checklist)
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
