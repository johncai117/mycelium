"""Per-methodology, per-section prompt addenda.

Layered design: base prompt (existing section_*.md) + methodology overlay appended.
Only sections that meaningfully differ per methodology have overlays.
"""

METHODOLOGY_OVERLAYS: dict[str, dict[str, str]] = {
    "acnu": {
        "study_design": (
            "This study uses an Active Comparator New-User (ACNU) design. "
            "Justify the choice of active comparator: explain why it is clinically appropriate "
            "(same indication, similar channeling patterns). Describe the symmetric cohort entry "
            "criteria ensuring both arms have the same washout and eligibility requirements. "
            "State that prevalent users are excluded to avoid prevalent-user bias."
        ),
        "cohort_definition": (
            "Define the new-user criteria for both the index drug and the active comparator. "
            "Specify that cohort entry is the first prescription/dispensing date after the "
            "washout period. Ensure symmetric entry: both cohorts should have identical "
            "eligibility windows, washout durations, and baseline covariate assessment periods. "
            "State the grace period or gap allowance for defining continuous exposure."
        ),
        "data_analysis": (
            "Specify the propensity score method (IPTW, matching, overlap weights, or stratification) "
            "and justify the choice. List covariates in the PS model. Define balance diagnostics "
            "(SMD < 0.10 threshold). Describe both ITT and as-treated analysis approaches. "
            "Include E-value analysis for unmeasured confounding. Specify the estimand clearly "
            "(e.g., ATT, ATE, ATO)."
        ),
    },
    "prevalent_user": {
        "study_design": (
            "This study uses a prevalent user cohort design. Acknowledge the limitation of "
            "prevalent-user bias (depletion of susceptibles, conditioning on survival to cohort entry). "
            "Justify why a new-user design is infeasible. Describe mitigation strategies "
            "(e.g., landmark analysis, adjustment for treatment duration at entry)."
        ),
        "cohort_definition": (
            "Define cohort entry for prevalent users. Specify how treatment duration at entry "
            "is measured. Address immortal time bias explicitly. Describe how patients who "
            "discontinued before cohort entry are handled."
        ),
        "data_analysis": (
            "Include analyses addressing prevalent-user bias: landmark analysis, adjustment for "
            "time-on-treatment, and sensitivity analyses restricting to recent initiators. "
            "Discuss the potential impact of depletion of susceptibles on effect estimates."
        ),
    },
    "descriptive_cohort": {
        "study_design": (
            "This is a descriptive (single-arm) cohort study. State that no formal comparator "
            "group is included and explain why. If external comparisons are planned, describe "
            "the source of background rates and limitations of indirect comparisons."
        ),
        "cohort_definition": (
            "Define the single study cohort with clear inclusion/exclusion criteria. "
            "Specify the cohort entry date, follow-up start, and end-of-follow-up rules."
        ),
        "data_analysis": (
            "Focus on incidence rate estimation with person-time denominators. Include "
            "Kaplan-Meier estimates if appropriate. Provide confidence intervals for all "
            "estimates. If comparing to external rates, clearly state the limitations."
        ),
    },
    "nested_case_control": {
        "study_design": (
            "This study uses a nested case-control design within a defined cohort. "
            "Describe the source cohort from which cases and controls are drawn. "
            "Justify the case-control approach (e.g., rare outcome, computational efficiency, "
            "need for detailed exposure assessment)."
        ),
        "cohort_definition": (
            "Define the source cohort, case definition, and control selection strategy. "
            "Specify that incidence density (risk-set) sampling is used: for each case, "
            "controls are sampled from those still at risk at the case's event time. "
            "State the number of controls per case and matching factors (age, sex, calendar time). "
            "Note that with density sampling, the OR approximates the IRR."
        ),
        "data_analysis": (
            "Use conditional logistic regression (conditioned on matched sets). "
            "Estimate odds ratios with 95% CIs. Include adjustment for additional confounders "
            "beyond matching factors. Describe sensitivity analyses for case/control definitions."
        ),
    },
    "population_case_control": {
        "study_design": (
            "This is a population-based case-control study drawing cases and controls "
            "from a general population database. Describe the source population and "
            "how representativeness is ensured."
        ),
        "cohort_definition": (
            "Define the case ascertainment source (e.g., hospital discharge registry, disease registry). "
            "Define the control source and sampling strategy. Specify matching criteria. "
            "Address potential selection bias in case and control identification."
        ),
        "data_analysis": (
            "Use unconditional or conditional logistic regression depending on matching strategy. "
            "Address potential recall bias if exposure data is self-reported. "
            "Include sensitivity analyses for case and exposure definitions."
        ),
    },
    "sccs": {
        "study_design": (
            "This study uses a Self-Controlled Case Series (SCCS) design. Explain "
            "that each individual serves as their own control, comparing event rates "
            "during defined risk windows after exposure to rates during control (unexposed) windows. "
            "State the key advantage: implicit control for all time-invariant confounders."
        ),
        "cohort_definition": (
            "Instead of a traditional cohort, define the case population: all individuals "
            "who experienced both the exposure and the event during the observation period. "
            "Define the risk window(s) after exposure (e.g., days 1-14, 15-28) and the "
            "control window (all remaining observation time). Specify the pre-exposure "
            "risk window if applicable. Address the event-dependent exposure assumption."
        ),
        "data_analysis": (
            "Use conditional Poisson regression (the standard SCCS model). Estimate "
            "incidence rate ratios for each risk window relative to the control window. "
            "Include age adjustment (as a time-varying confounder). If the event may "
            "affect future exposure, use the modified SCCS model. Include sensitivity "
            "analyses varying risk window definitions."
        ),
    },
    "case_crossover": {
        "study_design": (
            "This study uses a case-crossover design. Each case serves as their own control. "
            "Describe the hazard window (period just before the event) and the control window(s) "
            "(earlier reference periods). Justify why a transient exposure effect is expected."
        ),
        "cohort_definition": (
            "Define the case population (all individuals experiencing the acute event). "
            "Specify the hazard window duration and timing relative to the event. "
            "Specify the control window(s) and their timing. Consider a bidirectional "
            "design if exposure time trends are a concern."
        ),
        "data_analysis": (
            "Use conditional logistic regression matched on individual. Estimate the "
            "odds ratio for exposure in the hazard window vs control window(s). "
            "Address potential bias from time trends in exposure (use bidirectional analysis). "
            "Include sensitivity analyses varying window lengths."
        ),
    },
    "cross_sectional": {
        "study_design": (
            "This is a cross-sectional study assessing exposure and outcome prevalence "
            "at a single point in time. Acknowledge that temporal sequence cannot be established."
        ),
        "cohort_definition": (
            "Define the target population and the point in time (or time window) for assessment. "
            "Specify the sampling strategy and eligibility criteria."
        ),
        "data_analysis": (
            "Estimate prevalence proportions with 95% CIs. Use prevalence ratios (preferred) "
            "or odds ratios. Apply survey weights if applicable. Do not make causal claims."
        ),
    },
    "drug_utilization": {
        "study_design": (
            "This is a Drug Utilization Study (DUS) characterizing prescribing patterns. "
            "No formal outcome assessment is included. Describe what utilization aspects "
            "are being studied (e.g., prescribing volume, off-label use, switching, adherence)."
        ),
        "cohort_definition": (
            "Define the population of drug users. Specify identification by prescription/dispensing codes. "
            "Describe the time window for utilization assessment. Define metrics: "
            "DDD/1000 inhabitants/day, treatment duration, time to first switch."
        ),
        "variables": (
            "Instead of clinical outcomes, define drug utilization metrics: "
            "prescribing volume (DDD/1000 inhabitants/day), treatment duration (median, IQR), "
            "switching rates, co-prescribing patterns, adherence measures (MPR, PDC), "
            "and off-label use indicators. Describe stratification variables."
        ),
        "data_analysis": (
            "Use descriptive statistics (proportions, medians, IQRs). Include time-series "
            "analyses for trends. Stratify by relevant subgroups (age, sex, prescriber specialty, "
            "region). No formal hypothesis testing unless pre-specified."
        ),
    },
    "prospective_registry": {
        "study_design": (
            "This is a prospective registry study with active patient enrollment and follow-up. "
            "Describe the enrollment procedures, participating sites, and follow-up schedule. "
            "If a comparator arm is included, describe how comparators are enrolled."
        ),
        "cohort_definition": (
            "Define enrollment criteria (inclusion/exclusion) and the enrollment process. "
            "Specify the planned sample size and enrollment period. Describe the follow-up "
            "schedule (visit frequency, data collection time points). Address anticipated "
            "attrition and retention strategies."
        ),
        "data_analysis": (
            "Report incidence rates with person-time denominators. If comparator arm: "
            "use Cox PH or Poisson regression with appropriate confounding adjustment. "
            "If single-arm: compare to external control data if available. "
            "Include attrition analysis and sensitivity analyses for missing data."
        ),
    },
    "pregnancy_registry": {
        "study_design": (
            "This is a pregnancy safety registry monitoring pregnancy outcomes in women "
            "exposed to the drug of interest. Describe enrollment of exposed and (if applicable) "
            "unexposed/disease-matched pregnancies. Reference applicable guidelines (FDA, EMA)."
        ),
        "cohort_definition": (
            "Define the exposed cohort (timing of exposure relative to pregnancy). "
            "If a comparison group is included, define disease-matched unexposed pregnancies. "
            "Specify enrollment criteria: gestational age at enrollment, pregnancy confirmation. "
            "Describe outcome ascertainment: live births, spontaneous abortions, stillbirths, "
            "elective terminations, congenital malformations."
        ),
        "data_analysis": (
            "Report prevalence of major congenital malformations with 95% CIs. "
            "Compare to background rates (EUROCAT, population registries). "
            "Perform gestational-age-specific and trimester-specific analyses. "
            "Adjust for maternal age, BMI, comorbidities, folic acid use, and co-medications."
        ),
    },
    "survey": {
        "study_design": (
            "This is a survey study assessing knowledge, attitudes, or behavior of "
            "healthcare professionals and/or patients. Describe the survey objectives "
            "and the target population for survey administration."
        ),
        "cohort_definition": (
            "Instead of a patient cohort, define the survey population: "
            "who will be surveyed (HCPs, patients, or both), sampling frame, "
            "recruitment strategy, and target sample size. "
            "Describe the survey instrument (questionnaire) and its development/validation."
        ),
        "data_analysis": (
            "Report response rates and assess non-response bias. Present proportions "
            "with 95% CIs for key knowledge/behavior items. Compare subgroups using "
            "chi-square or Fisher's exact test. If assessing aRMM effectiveness, "
            "compare against pre-defined success criteria."
        ),
    },
}

# Methodology-specific section label overrides
SECTION_LABEL_OVERRIDES: dict[str, dict[str, str]] = {
    "sccs": {
        "cohort_definition": "Case Selection and Risk Windows",
    },
    "case_crossover": {
        "cohort_definition": "Case Selection and Exposure Windows",
    },
    "drug_utilization": {
        "variables": "Drug Utilization Metrics",
    },
    "survey": {
        "cohort_definition": "Survey Population and Instrument",
    },
}

# Sections to skip for certain methodologies
SECTION_SKIP: dict[str, set[str]] = {
    "drug_utilization": {"study_size"},
    "survey": {"study_size"},
}
