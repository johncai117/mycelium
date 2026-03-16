# Epidemiology Domain Glossary for Developers

This glossary defines key terms used throughout the Mycelium codebase and protocol content. Understanding these concepts helps in writing prompts, evaluating output quality, and building UI that makes sense to epidemiologists.

---

## Study Design Terms

**PASS (Post-Authorization Safety Study)**
A study required or requested by a regulatory authority (EMA, FDA) after a drug is approved, to monitor for safety risks in real-world use. The primary regulatory context for Mycelium protocols. Governed by EMA Module V of the Good Pharmacovigilance Practices (GVP).

**RWE (Real-World Evidence)**
Evidence derived from analysis of real-world data (claims, EHR, registries) rather than randomized controlled trials. Contrasted with RCT evidence.

**Cohort Study**
Follow a group of exposed patients and a comparison group forward in time. Compare outcome rates. The most common PASS design. Produces hazard ratios or incidence rate ratios.

**Case-Control Study**
Select patients with the outcome (cases) and patients without (controls). Look backward to compare exposure history. Efficient for rare outcomes. Produces odds ratios.

**Cross-Sectional Study**
Assess exposure and outcome at a single point in time. No follow-up. Produces prevalence ratios.

**Target Trial Emulation**
A framework for designing observational studies that emulates the key features of a hypothetical randomized trial. Recommended by FDA for complex causal questions.

---

## Study Population Terms

**New-User Design (Incident User Design)**
Restricts study population to patients who are initiating therapy for the first time. Requires no prior use of the study drug during a washout period prior to cohort entry. Eliminates prevalent user bias. **The recommended design for most pharmacoepidemiology studies.**

**Prevalent User Bias**
Bias introduced by including patients who have been on a drug for some time. Survivors of early adverse events are over-represented. New-user design eliminates this.

**Washout Period**
Drug-free look-back period required to qualify as a new user. Standard is 180 days (6 months). E.g., "No dispensing of [drug] in the 180 days prior to the index date."

**Index Date**
The date of study enrollment for each subject — typically the date of first drug dispensing. Also called "cohort entry date" or "time zero." All baseline covariate assessment and follow-up is measured relative to the index date.

**Active Comparator New-User Design (ACNU)**
A new-user design where the comparator is another active drug (not untreated patients). Reduces confounding by indication. Example: compare tofacitinib to adalimumab, both initiated for RA.

**Confounding by Indication**
Bias when the reason for prescribing a drug is also a risk factor for the outcome. E.g., patients prescribed a drug for a severe form of a disease may have higher outcome rates not because of the drug but because of the disease severity.

---

## Data Sources

**Claims Data (Administrative Data)**
Insurance claims records: pharmacy fills (NDC codes), diagnoses (ICD codes), procedures (CPT/HCPCS codes), enrollment. Examples: Optum Clinformatics, IBM MarketScan, Medicare/Medicaid.

**EHR (Electronic Health Record) Data**
Electronic records from clinical care: diagnoses, labs, vital signs, clinical notes, prescriptions. Examples: Optum EHR, TriNetX, Epic Cosmos.

**CPRD (Clinical Practice Research Datalink)**
UK primary care EHR database. Widely used for European pharmacoepidemiology research.

**PHARMO**
Dutch linked healthcare database system used for EU pharmacoepidemiology studies.

**Optum EHR / Optum Clinformatics**
Two distinct Optum products: Clinformatics is claims-based; EHR is electronic health record data. Both cover large US populations.

**IBM MarketScan (now Merative)**
US commercial insurance claims database covering employer-sponsored health insurance. Widely used in US pharmacoepidemiology.

---

## Code Systems

**ICD-10 (ICD-10-CM in the US)**
International Classification of Diseases, 10th revision. Used to code diagnoses in claims and EHR data. Format: letter + 2 digits + up to 4 alphanumeric characters (e.g., M05.9).

**NDC (National Drug Code)**
11-digit code identifying drug products in the US. Used in pharmacy claims to identify dispensed medications.

**CPT (Current Procedural Terminology)**
5-digit codes used to bill for procedures, lab tests, and services.

**ATC (Anatomical Therapeutic Chemical)**
WHO classification system for drugs. Used in European data sources. Hierarchical: ATC level 5 identifies individual drug substances.

**RxNorm**
US standard drug nomenclature. Used in EHR systems to represent drug concepts.

---

## Analysis Terms

**Propensity Score**
The probability of receiving treatment (drug X vs. comparator) given observed baseline covariates. Used to balance confounding in observational studies.

**IPTW (Inverse Probability of Treatment Weighting)**
Re-weighting patients by the inverse of their propensity score to create a pseudo-population where treatment is independent of measured confounders.

**Propensity Score Matching (PSM)**
Match each treated patient to one or more control patients with similar propensity scores.

**Hazard Ratio (HR)**
The ratio of the hazard (instantaneous rate of events) between two groups. Produced by Cox proportional hazards regression. Analogous to relative risk.

**Incidence Rate**
Number of new events per person-time at risk (e.g., events per 1,000 person-years).

**Sensitivity Analysis**
Repeat the primary analysis with modified assumptions to test robustness. Examples: as-treated, per-protocol, restriction to certain calendar years, alternative outcome definitions.

---

## Regulatory Terms

**ENCePP (European Network of Centres for Pharmacoepidemiology and Pharmacovigilance)**
EU network coordinated by EMA. Maintains the EU PAS Register and the ENCePP Checklist for study protocols.

**EU PAS Register**
Registry of European PASS studies. Studies get a "EUPAS" number (e.g., EUPAS12345) when registered.

**EUPAS Number**
EU PAS registration identifier format. Example: `EUPAS12345`.

**ICH E6**
International Council for Harmonisation guideline on Good Clinical Practice. Some PASS studies follow ICH E6 principles.

**RMP (Risk Management Plan)**
Regulatory document describing risk minimization measures for a drug, including any required PASS studies.

**EMA Module V (GVP Module V)**
EMA Good Pharmacovigilance Practices guideline for risk management. Defines requirements for PASS studies.

---

## Output Quality Terms

**PICO**
Research question framework: Population, Intervention (exposure), Comparator, Outcome. All regulatory protocols must have an explicit PICO statement.

**Operationalizable**
A criterion or definition that can be implemented in data without ambiguity. E.g., "new user defined as no dispensing in 180 days" is operationalizable; "recent user" is not.

**Channeling Bias**
A form of confounding by indication where a new drug is preferentially prescribed to patients with more severe disease (or safer patients), biasing comparisons with older drugs.
