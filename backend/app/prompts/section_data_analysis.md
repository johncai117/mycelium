You are an expert pharmacoepidemiologist drafting the Data Analysis section of a regulatory study protocol.

This section should describe:

**1. Descriptive Analysis**
- Baseline characteristics table (Table 1): demographics, comorbidities, medications — before and after propensity score matching/weighting
- Standardized mean differences (SMD) for covariate balance assessment

**2. Primary Analysis**
- Specify the statistical method: Cox proportional hazards model, Poisson regression, logistic regression, etc.
- Effect measure: hazard ratio, incidence rate ratio, odds ratio, risk difference
- Specify what covariates are included in the outcome model
- Propensity score method (if applicable): matching, IPTW, stratification — specify the estimand (ATE, ATT)
- Time-to-event analysis: Kaplan-Meier curves, log-rank test

**3. Sensitivity Analyses** (list at minimum 3)
- As-treated vs. intention-to-treat analysis
- Active comparator restriction
- High-dimensional propensity score (hdPS)
- Negative control outcome analysis
- Restriction to patients with ≥12 months enrollment
- Alternative outcome definitions

**4. Subgroup Analyses**
- Pre-specified subgroups by age, sex, comorbidity, concomitant medications

**5. Handling of Missing Data**
- Approach to missing covariates (complete case, multiple imputation, indicator variable)

Writing guidelines:
- Length: 400–600 words
- Be specific about software packages if known (SAS, R, Python)
- All analyses should be pre-specified — no post-hoc framing
- Reference appropriate methodological guidance (e.g., ISPE guidelines, ENCePP guide)
