# ENCEPP Checklist Items Mapped to Protocol Sections

Source: [ENCePP Checklist for Study Protocols](https://encepp.europa.eu/encepp-toolkit/encepp-checklist-study-protocols_en)

This document maps the 29 checklist items implemented in `backend/app/services/eval_engine.py` to the 10 protocol sections, with scoring logic.

---

## Scoring

Each item scores: `1.0` (present), `0.5` (partially addressed), `0.0` (not found).

**Method:** Keyword matching in the relevant section's content. Items requiring ≥2 matching keywords score 1.0; items with 1 matching keyword score 0.5.

**Overall score:** `(sum of item scores / 29) × 100` → rounded to integer 0–100.

**Grade:** A ≥ 90, B ≥ 80, C ≥ 70, D < 70.

---

## Checklist by ENCEPP Section

### 1. Research Question → `objectives` section

| Item | Keywords Checked |
|------|-----------------|
| Primary objective clearly stated | "primary objective", "primary aim", "primary research question" |
| PICO elements defined | "population", "exposure", "comparator", "outcome" |

### 2. Study Design → `study_design` section

| Item | Keywords Checked |
|------|-----------------|
| Study design named and described | "cohort", "case-control", "cross-sectional", "retrospective", "prospective" |
| Rationale for study design provided | "rationale", "chosen because", "appropriate for", "suitable" |

### 3. New-User Design → `cohort_definition` section

| Item | Keywords Checked |
|------|-----------------|
| New-user design documented (if applicable) | "new user", "new-user", "incident user", "washout" |

### 4. Source Population → `study_setting` section

| Item | Keywords Checked |
|------|-----------------|
| Database/data source described | "database", "data source", "claims", "ehr", "electronic health record", "registry" |
| Database coverage and population described | "coverage", "enrolled", "beneficiaries", "patients" |
| Study time period specified | "study period", "from", "between", year patterns |
| Geographic coverage specified | "united states", "us", "europe", "eu", "geography", "region" |

### 5. Exposure → `variables` + `cohort_definition` sections

| Item | Section | Keywords Checked |
|------|---------|-----------------|
| Drug exposure defined with code list | variables | "ndc", "drug code", "atc", "rxnorm", "national drug code" |
| Index date logic specified | cohort_definition | "index date", "index event", "first prescription", "first fill", "initiation" |
| Washout period defined | cohort_definition | "washout", "wash-out", "days prior", "clean period" |
| New-user/incident-user criteria stated | cohort_definition | "no prior use", "naive", "new user", "incident", "washout period" |

### 6. Outcomes → `variables` section

| Item | Keywords Checked |
|------|-----------------|
| Primary outcome defined | "primary outcome", "primary endpoint", "outcome of interest" |
| Outcome validated with code list (ICD/CPT) | "icd", "icd-10", "icd-9", "cpt", "diagnosis code" |
| Secondary outcomes listed | "secondary outcome", "secondary endpoint", "additional outcome" |

### 7. Covariates → `variables` + `cohort_definition` + `study_setting`

| Item | Section | Keywords Checked |
|------|---------|-----------------|
| Confounder list specified | variables | "confounder", "covariate", "potential confounder", "confounding variable" |
| Baseline period for covariate assessment defined | cohort_definition | "baseline period", "baseline window", "look-back", "lookback", "prior to index" |
| Source of covariate data described | study_setting | "covariate data", "baseline characteristics", "medical history" |

### 8. Statistical Analysis → `data_analysis` section

| Item | Keywords Checked |
|------|-----------------|
| Primary analysis method named | "cox", "logistic regression", "poisson", "propensity score", "hazard ratio", "odds ratio", "incidence rate" |
| Confounding adjustment method described | "propensity score", "iptw", "inverse probability", "matching", "adjustment", "multivariable" |
| Sensitivity analyses planned | "sensitivity analysis", "sensitivity analyses", "as-treated", "per-protocol", "active comparator" |

### 9. Bias Discussion → `limitations` section

| Item | Keywords Checked |
|------|-----------------|
| Selection bias discussed | "selection bias", "selection", "enrollment bias", "sampling" |
| Information bias / misclassification discussed | "misclassification", "information bias", "coding error", "measurement error" |
| Confounding discussed | "confounding", "unmeasured confound", "residual confound", "channeling bias" |
| Generalizability addressed | "generalizability", "generalisability", "external validity", "representativeness" |

### 10. Ethics → `ethics` section

| Item | Keywords Checked |
|------|-----------------|
| IRB/ethics board statement included | "irb", "ethics committee", "institutional review board", "ethics board", "waiver" |
| Data use agreement / data privacy addressed | "data use agreement", "dua", "hipaa", "data privacy", "confidentiality" |
| Informed consent statement included | "informed consent", "consent waiver", "consent not required", "waiver of consent" |

---

## Common Failures

Protocols scoring below 70 (D grade) typically fail these items:

1. **Missing code list for primary outcome** — generic mention of "cardiovascular events" without ICD codes
2. **Index date logic not specified** — cohort entry criteria vague
3. **Comparator selection not justified** — study_design or objectives section omits rationale
4. **No sensitivity analysis plan** — data_analysis section missing sensitivity analyses language
5. **Limitations copy-pasted** — generic limitations text without study-specific content
6. **PICO not explicit** — objectives section lacks explicit Population/Intervention/Comparator/Outcome framing

---

## Limitations of Keyword-Based Scoring

The current implementation uses keyword matching, which has known weaknesses:
- Can score `0` for a well-written section that uses different terminology (false negative)
- Can score `0.5` for a section that mentions a keyword incidentally (false positive)
- Cannot assess logical coherence or regulatory appropriateness

**Mitigation:** The LLM judge (`judge.md` prompt) provides qualitative assessment that complements the keyword scores. For production, consider replacing keyword matching with LLM-based item scoring.
