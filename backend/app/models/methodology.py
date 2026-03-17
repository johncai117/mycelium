from enum import Enum
from typing import Optional

from pydantic import BaseModel


class MethodologyCategory(str, Enum):
    ACNU = "acnu"
    PREVALENT_USER = "prevalent_user"
    DESCRIPTIVE_COHORT = "descriptive_cohort"
    NESTED_CASE_CONTROL = "nested_case_control"
    POPULATION_CASE_CONTROL = "population_case_control"
    SCCS = "sccs"
    CASE_CROSSOVER = "case_crossover"
    CROSS_SECTIONAL = "cross_sectional"
    DRUG_UTILIZATION = "drug_utilization"
    PROSPECTIVE_REGISTRY = "prospective_registry"
    PREGNANCY_REGISTRY = "pregnancy_registry"
    SURVEY = "survey"


class MethodologyProfile(BaseModel):
    id: MethodologyCategory
    display_name: str
    parent_type: str  # maps to legacy study_type
    description: str
    when_to_use: str
    when_not_to_use: str
    key_assumptions: str
    typical_analysis: str
    confounding_approach: str
    requires_comparator: bool
    requires_outcome_data: bool
    example_use_case: str


class MethodologyRecommendation(BaseModel):
    primary: MethodologyCategory
    primary_display_name: str
    primary_description: str
    confidence_score: float  # 0.0–1.0
    reasoning: str
    alternatives: list[dict]  # [{id, display_name, score}]


METHODOLOGY_REGISTRY: dict[MethodologyCategory, MethodologyProfile] = {
    MethodologyCategory.ACNU: MethodologyProfile(
        id=MethodologyCategory.ACNU,
        display_name="Active Comparator New-User (ACNU) Cohort",
        parent_type="cohort",
        description="Gold standard for comparative drug safety. Compares new users of the drug of interest with new users of an active comparator, minimizing prevalent-user bias and healthy-user bias.",
        when_to_use="Comparative safety or effectiveness questions with a clear active comparator drug available in the same indication.",
        when_not_to_use="When no clinically appropriate active comparator exists, or when the question is purely descriptive.",
        key_assumptions="New-user design is feasible (sufficient incident users). Active comparator shares similar indication and channeling patterns.",
        typical_analysis="Cox PH with propensity score weighting/matching. ITT and as-treated analyses.",
        confounding_approach="Propensity score methods (IPTW, matching, overlap weights) with measured covariates. E-value for unmeasured confounding.",
        requires_comparator=True,
        requires_outcome_data=True,
        example_use_case="Cardiovascular safety of SGLT-2 inhibitors vs DPP-4 inhibitors in T2DM.",
    ),
    MethodologyCategory.PREVALENT_USER: MethodologyProfile(
        id=MethodologyCategory.PREVALENT_USER,
        display_name="Prevalent User Cohort",
        parent_type="cohort",
        description="Includes patients already on therapy at cohort entry. Used when new-user design is infeasible due to small incident-user populations or when long-term chronic effects are the focus.",
        when_to_use="When the drug has been on the market for a long time with few new initiators, or when studying late-onset effects requiring long exposure duration.",
        when_not_to_use="When new-user design is feasible — prevalent-user bias can seriously confound early treatment effects.",
        key_assumptions="Prevalent-user bias is acceptable or can be mitigated. Immortal time bias is addressed.",
        typical_analysis="Cox PH or Poisson regression with time-on-treatment as timescale. Landmark analysis.",
        confounding_approach="Multivariable adjustment. Disease risk scores. Sensitivity analyses for depletion of susceptibles.",
        requires_comparator=True,
        requires_outcome_data=True,
        example_use_case="Long-term cancer risk with chronic methotrexate use in rheumatoid arthritis.",
    ),
    MethodologyCategory.DESCRIPTIVE_COHORT: MethodologyProfile(
        id=MethodologyCategory.DESCRIPTIVE_COHORT,
        display_name="Descriptive Cohort (Single-Arm)",
        parent_type="cohort",
        description="Single-arm study estimating incidence rates of outcomes in a defined drug-exposed population. No formal comparator group.",
        when_to_use="When the objective is to estimate background incidence rates, characterize a treated population, or there is no appropriate comparator.",
        when_not_to_use="When a comparative question is being asked — cannot estimate relative effects without a comparator.",
        key_assumptions="The study population is well-defined and representative. External comparison rates are available if needed for context.",
        typical_analysis="Incidence rates (IR) per person-time. Kaplan-Meier estimates. Descriptive statistics for baseline characteristics.",
        confounding_approach="Not applicable (no comparison). Standardization to external populations if indirect comparison intended.",
        requires_comparator=False,
        requires_outcome_data=True,
        example_use_case="Post-marketing incidence of liver injury in new users of a recently approved drug.",
    ),
    MethodologyCategory.NESTED_CASE_CONTROL: MethodologyProfile(
        id=MethodologyCategory.NESTED_CASE_CONTROL,
        display_name="Nested Case-Control",
        parent_type="case_control",
        description="Case-control study nested within a defined cohort. Cases are identified from the cohort; controls are sampled from the risk set at each case's event time using incidence density sampling.",
        when_to_use="Rare outcomes where a full cohort analysis is computationally expensive or when time-varying exposures need detailed assessment. Efficient for rare outcomes.",
        when_not_to_use="When the outcome is common (full cohort analysis is preferable) or when the source cohort is not well-defined.",
        key_assumptions="Controls are sampled from the risk set (incidence density sampling). The cohort is well-defined with known entry/exit.",
        typical_analysis="Conditional logistic regression. Odds ratios approximate incidence rate ratios with density sampling.",
        confounding_approach="Matching on risk-set time. Additional adjustment via conditional logistic regression for measured confounders.",
        requires_comparator=False,
        requires_outcome_data=True,
        example_use_case="Risk of acute liver failure with specific NSAIDs — rare outcome nested in a large claims cohort.",
    ),
    MethodologyCategory.POPULATION_CASE_CONTROL: MethodologyProfile(
        id=MethodologyCategory.POPULATION_CASE_CONTROL,
        display_name="Population-Based Case-Control",
        parent_type="case_control",
        description="Traditional case-control study drawing cases and controls from a general population database rather than a predefined cohort.",
        when_to_use="When studying rare outcomes in a general population and a predefined cohort is not available. Useful with disease registries.",
        when_not_to_use="When a cohort study is feasible, or when temporal sequence of exposure and outcome is unclear.",
        key_assumptions="Cases are representative of all cases in the population. Controls represent the exposure distribution in the source population.",
        typical_analysis="Unconditional or conditional logistic regression. OR with adjusted covariates.",
        confounding_approach="Matching on age, sex, calendar time. Multivariable logistic regression for additional confounders.",
        requires_comparator=False,
        requires_outcome_data=True,
        example_use_case="Association between fluoroquinolone use and aortic aneurysm using hospital discharge records.",
    ),
    MethodologyCategory.SCCS: MethodologyProfile(
        id=MethodologyCategory.SCCS,
        display_name="Self-Controlled Case Series (SCCS)",
        parent_type="other",
        description="Within-person design comparing event rates during exposed risk windows vs unexposed control windows in the same individual. Implicitly controls for all time-invariant confounders.",
        when_to_use="Acute, transient outcomes with well-defined risk windows. When time-invariant confounders (genetics, chronic conditions) are a major concern.",
        when_not_to_use="When the event affects subsequent exposure probability (unless modified SCCS is used). When the outcome is chronic or affects mortality.",
        key_assumptions="Event does not affect future exposure (or modified SCCS used). Recurrent events are independent. Observation period is independent of event times.",
        typical_analysis="Conditional Poisson regression. Incidence rate ratios comparing risk vs control windows.",
        confounding_approach="Self-controlled — all time-invariant confounders eliminated by design. Age adjustment for time-varying confounders.",
        requires_comparator=False,
        requires_outcome_data=True,
        example_use_case="Risk of intussusception in the 1-21 days after rotavirus vaccination.",
    ),
    MethodologyCategory.CASE_CROSSOVER: MethodologyProfile(
        id=MethodologyCategory.CASE_CROSSOVER,
        display_name="Case-Crossover",
        parent_type="other",
        description="Each case serves as their own control. Compares exposure in a hazard window just before the event to exposure in earlier control windows.",
        when_to_use="Acute events triggered by transient exposures. When the exposure is intermittent and the effect is immediate.",
        when_not_to_use="When the exposure is chronic/constant or when the outcome has a long induction period.",
        key_assumptions="Transient effect of a transient exposure. Exposure prevalence is stable over time (no time trends). No carryover effects.",
        typical_analysis="Conditional logistic regression (matched on individual). Odds ratio for exposure in hazard vs control window.",
        confounding_approach="Self-matched — eliminates all time-invariant confounders. Bidirectional design can address time trends.",
        requires_comparator=False,
        requires_outcome_data=True,
        example_use_case="Risk of MI within 24 hours of NSAID use.",
    ),
    MethodologyCategory.CROSS_SECTIONAL: MethodologyProfile(
        id=MethodologyCategory.CROSS_SECTIONAL,
        display_name="Cross-Sectional Prevalence Study",
        parent_type="cross_sectional",
        description="Point-in-time assessment of exposure and outcome prevalence. No follow-up.",
        when_to_use="Estimating prevalence of a condition or exposure at a point in time. Rapid assessment of disease burden.",
        when_not_to_use="When temporal sequence matters. Cannot establish causality or estimate incidence.",
        key_assumptions="The sample is representative of the target population at the time point. No recall bias for self-reported exposures.",
        typical_analysis="Prevalence ratios or odds ratios. Weighted estimates if survey design used.",
        confounding_approach="Stratification. Multivariable logistic regression. Survey weights for population representativeness.",
        requires_comparator=False,
        requires_outcome_data=True,
        example_use_case="Prevalence of hepatitis C among patients prescribed direct-acting antivirals.",
    ),
    MethodologyCategory.DRUG_UTILIZATION: MethodologyProfile(
        id=MethodologyCategory.DRUG_UTILIZATION,
        display_name="Drug Utilization Study (DUS)",
        parent_type="other",
        description="Describes patterns of drug prescribing, dispensing, and use. Focuses on exposure characterization without formal outcome assessment.",
        when_to_use="Understanding prescribing patterns, off-label use, adherence, switching, or treatment duration. Regulatory questions about how a drug is used in practice.",
        when_not_to_use="When the research question involves clinical outcomes or comparative safety/effectiveness.",
        key_assumptions="Prescription/dispensing data reflect actual drug use (limitation: primary non-adherence). Data source captures the target prescribing population.",
        typical_analysis="Descriptive statistics: counts, proportions, DDD/1000 inhabitants/day, duration of treatment, switching rates, time-series analysis.",
        confounding_approach="Not applicable (descriptive study). Stratification by subgroups for utilization patterns.",
        requires_comparator=False,
        requires_outcome_data=False,
        example_use_case="Prescribing patterns of direct oral anticoagulants in atrial fibrillation patients across EU countries.",
    ),
    MethodologyCategory.PROSPECTIVE_REGISTRY: MethodologyProfile(
        id=MethodologyCategory.PROSPECTIVE_REGISTRY,
        display_name="Prospective Registry / Enhanced Surveillance",
        parent_type="cohort",
        description="Prospective data collection through dedicated enrollment of patients, often with active follow-up. May include a comparator arm or be single-arm.",
        when_to_use="When routine data sources lack the required variables (e.g., biomarkers, PROs). Long-term safety monitoring with active follow-up. Rare diseases or special populations.",
        when_not_to_use="When the question can be answered more efficiently with existing databases. When enrollment feasibility is a concern.",
        key_assumptions="Enrollment is representative of the target population (selection bias mitigated). Follow-up is sufficient and attrition is manageable.",
        typical_analysis="Incidence rates. Kaplan-Meier. Cox PH if comparator arm exists. Descriptive if single-arm.",
        confounding_approach="If comparator arm: propensity scores, multivariable regression. Standardization to target population.",
        requires_comparator=False,
        requires_outcome_data=True,
        example_use_case="Long-term safety of a gene therapy in hemophilia A patients with 10-year active follow-up.",
    ),
    MethodologyCategory.PREGNANCY_REGISTRY: MethodologyProfile(
        id=MethodologyCategory.PREGNANCY_REGISTRY,
        display_name="Pregnancy Safety Registry",
        parent_type="cohort",
        description="Specialized registry for monitoring pregnancy outcomes in women exposed to a specific drug. Compares with unexposed pregnancies or background rates.",
        when_to_use="When pregnancy safety data is required by regulators (risk management plan). When teratogenicity or pregnancy complications need monitoring.",
        when_not_to_use="When the drug is contraindicated in pregnancy and exposure is negligible (though registries may still be mandated).",
        key_assumptions="Ascertainment of pregnancy outcomes is complete. Reporting bias (voluntary enrollment) is understood. Background malformation rates are available for comparison.",
        typical_analysis="Prevalence of congenital malformations. Risk ratios vs background rates (e.g., EUROCAT). Gestational-age-specific analyses.",
        confounding_approach="Comparison with disease-matched unexposed pregnancies. Adjustment for maternal age, comorbidities, co-medications, folic acid use.",
        requires_comparator=False,
        requires_outcome_data=True,
        example_use_case="Pregnancy outcomes in women exposed to biologics for inflammatory bowel disease.",
    ),
    MethodologyCategory.SURVEY: MethodologyProfile(
        id=MethodologyCategory.SURVEY,
        display_name="HCP/Patient Survey",
        parent_type="other",
        description="Cross-sectional survey of healthcare professionals or patients to assess knowledge, attitudes, behavior, or effectiveness of risk minimization measures.",
        when_to_use="Evaluating effectiveness of additional risk minimization measures (aRMMs). Assessing prescriber knowledge of contraindications or monitoring requirements.",
        when_not_to_use="When the research question requires longitudinal outcome data or causal inference.",
        key_assumptions="Survey respondents are representative of the target population. Response rate is sufficient to minimize non-response bias. Questions are validated and unbiased.",
        typical_analysis="Descriptive statistics. Proportions with 95% CIs. Comparison of subgroups (chi-square, t-test). Likert scale analysis.",
        confounding_approach="Not applicable (descriptive survey). Weighting for non-response if needed.",
        requires_comparator=False,
        requires_outcome_data=False,
        example_use_case="Survey of prescribers on knowledge of pregnancy prevention program for isotretinoin.",
    ),
}
