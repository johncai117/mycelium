import type { StudyInput, Protocol } from '@/types'

// ── Example Study Input ───────────────────────────────────────────────────────

export const EXAMPLE_STUDY_INPUT: StudyInput = {
  drug_name: 'Semaglutide',
  drug_inn: 'semaglutide',
  indication: 'Type 2 diabetes mellitus with cardiovascular risk reduction',
  study_type: 'cohort',
  data_source: 'CPRD Aurum (UK primary care)',
  comparators: ['Sitagliptin', 'Empagliflozin'],
  study_period_start: '2018-01-01',
  study_period_end: '2023-12-31',
  geography: 'United Kingdom',
  regulatory_context: 'PASS',
  sponsor: 'Novo Nordisk A/S',
  primary_outcome:
    'Major adverse cardiovascular events (MACE): non-fatal MI, non-fatal stroke, CV death',
  population_description:
    'Adults aged ≥18 with T2DM, ≥12 months CPRD registration, no prior GLP-1 use (new-user design)',
  index_date_logic:
    'First semaglutide or comparator prescription in study window with 365-day washout',
  washout_days: 365,
  new_user_design: true,
  clinical_context:
    'Post-authorisation safety study required by EMA following SUSTAIN-6 trial. Focus on real-world CV outcomes in broader T2DM population including elderly and those with renal impairment.',
}

// ── Pre-baked Protocol Fixtures ───────────────────────────────────────────────

const ROFECOXIB_INPUTS: StudyInput = {
  drug_name: 'Rofecoxib',
  drug_inn: 'rofecoxib',
  indication: 'Osteoarthritis pain management',
  study_type: 'case_control',
  data_source: 'Optum EHR (US electronic health records)',
  comparators: ['Celecoxib', 'Naproxen'],
  study_period_start: '1999-05-01',
  study_period_end: '2004-09-30',
  geography: 'United States',
  regulatory_context: 'voluntary',
  sponsor: 'Merck & Co., Inc.',
  primary_outcome: 'Acute myocardial infarction (fatal and non-fatal)',
  population_description:
    'Adults aged ≥40 with osteoarthritis diagnosis, ≥6 months Optum enrollment, no prior MI or coronary revascularisation',
  index_date_logic:
    'Date of first AMI (cases) or matched date (controls); exposure window 1–30 days prior to index',
  washout_days: 180,
  new_user_design: false,
  clinical_context:
    'Post-marketing pharmacovigilance study evaluating cardiovascular safety signals identified in the APPROVe trial. Regulatory context: voluntary withdrawal and retrospective safety review.',
}

export const EXAMPLE_PROTOCOLS: Protocol[] = [
  {
    study_id: 'demo-study-001',
    study_inputs: EXAMPLE_STUDY_INPUT,
    sections: {
      background: {
        content:
          'Semaglutide, a glucagon-like peptide-1 (GLP-1) receptor agonist, received regulatory approval in the European Union for the management of type 2 diabetes mellitus (T2DM) in adults when diet and exercise alone do not provide adequate glycaemic control. The SUSTAIN-6 cardiovascular outcomes trial demonstrated a statistically significant reduction in major adverse cardiovascular events (MACE) compared with placebo in a high-risk T2DM population, providing the mechanistic rationale for this post-authorisation safety study (PASS).\n\nCPRD Aurum is a longitudinal, population-based database derived from UK primary care practices using the EMIS health system, covering approximately 13 million active patients and broadly representative of the UK population in terms of age, sex, and geographic distribution. Linkage to Hospital Episode Statistics (HES) and the Office for National Statistics (ONS) mortality register enables comprehensive capture of hospitalised events and deaths, making it particularly well-suited for cardiovascular outcomes research in T2DM.\n\nThis PASS is required under the EMA Risk Management Plan following the conditional marketing authorisation of semaglutide. The study addresses post-authorisation conditions to characterise real-world cardiovascular effectiveness and safety across a broader T2DM population than enrolled in SUSTAIN-6, including elderly patients and those with moderate renal impairment who were underrepresented in the pivotal trial.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      objectives: {
        content:
          "The primary objective of this study is to estimate the incidence rate of major adverse cardiovascular events (MACE) — defined as a composite of non-fatal myocardial infarction, non-fatal ischaemic stroke, and cardiovascular death — among new users of semaglutide compared with new users of sitagliptin or empagliflozin in UK primary care, controlling for baseline cardiovascular risk and comorbidity burden.\n\nSecondary objectives include: (1) estimating the incidence of individual MACE components separately; (2) evaluating the comparative effectiveness of semaglutide on HbA1c reduction, weight, and systolic blood pressure at 12 months; (3) characterising patterns of semaglutide utilisation in clinical practice, including dose titration, treatment persistence, and switching behaviour; and (4) estimating MACE risk in pre-specified subgroups defined by age (≥75 years), renal function (eGFR 30–60 mL/min/1.73 m²), and prior cardiovascular disease status.\n\nA tertiary objective is to assess confounding by channelling bias: given that semaglutide is preferentially prescribed to higher-risk patients in routine care, propensity score methods will be applied to ensure comparability of treatment groups, and sensitivity analyses using high-dimensional propensity scoring (hdPS) will be conducted to evaluate residual confounding.",
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      study_design: {
        content:
          'This study employs an active-comparator, new-user (ACNU) cohort design, which minimises prevalent-user bias and ensures comparability of baseline covariate measurement windows between treatment groups. New users are defined as patients with no prescription for any GLP-1 receptor agonist, DPP-4 inhibitor, or SGLT-2 inhibitor in the 365 days prior to the index date, ensuring that only truly treatment-naïve initiators are included.\n\nThe study period spans January 2018 to December 2023, encompassing the period following semaglutide\'s UK availability (October 2018 for injectable formulation). Patients are followed from the index date (first qualifying prescription) until the earliest of: first MACE event, death from any cause, deregistration from the CPRD practice, or study end date. The intention-to-treat (ITT) primary analysis is supplemented by an as-treated (AT) sensitivity analysis that censors follow-up 90 days after treatment discontinuation or switch.\n\nPropensity scores (PS) are estimated using logistic regression incorporating over 80 baseline covariates, including demographics, comorbidities, concomitant medications, prior health service utilisation, and HbA1c trajectory. Patients are matched 1:1 on the PS (caliper 0.01 on the PS logit scale) within a 180-day PS estimation window. Standardised mean differences (SMD < 0.10) are used to assess balance after matching.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      study_setting: {
        content:
          'The study is conducted using CPRD Aurum, a large UK primary care database covering approximately 13 million active patients across over 1,500 general practices using the EMIS health system. CPRD Aurum practices are broadly representative of the UK population in terms of age, sex, and geographic distribution, with data quality metrics meeting established CPRD research standards.\n\nPrimary care data from CPRD Aurum are linked to three secondary data sources: (1) Hospital Episode Statistics (HES) Admitted Patient Care for inpatient diagnoses and procedures; (2) the Office for National Statistics (ONS) mortality register for cause of death; and (3) the Index of Multiple Deprivation (IMD) for area-level socioeconomic status. Linkage consent is available for approximately 75% of English CPRD Aurum practices and is a prerequisite for inclusion in this study.\n\nThe study period covers January 2018 to December 2023. Semaglutide (Ozempic® 0.5 mg and 1.0 mg subcutaneous injection) became available in the UK market in January 2019 following MHRA approval; the study enrolment window therefore opens from January 2019 for semaglutide initiators. Comparator initiators (sitagliptin, empagliflozin) are eligible from January 2018 to ensure adequate comparator pool prior to semaglutide availability.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      cohort_definition: {
        content:
          'Eligible patients are adults aged 18 years or older with a diagnosis of type 2 diabetes mellitus recorded in CPRD Aurum prior to the index date, defined using a validated Read/SNOMED code list. Patients must have at least 12 months of continuous registration at an eligible CPRD Aurum practice prior to the index date to ensure adequate covariate ascertainment. Patients are required to have at least one HbA1c measurement in the 12 months prior to index as evidence of active diabetes management.\n\nExclusion criteria include: type 1 diabetes mellitus diagnosis; gestational diabetes; prior GLP-1 RA, DPP-4 inhibitor, or SGLT-2 inhibitor use within the 365-day washout window (new-user criterion); pregnancy in the 9 months before index; dialysis or kidney transplant; terminal illness coded within 6 months; and missing sex or year of birth. Patients with baseline estimated glomerular filtration rate (eGFR) < 30 mL/min/1.73 m² are excluded per prescribing contraindications.\n\nThe target population represents the real-world T2DM population initiating second- or third-line glucose-lowering therapy in UK primary care. Expected cohort size based on CPRD coverage and semaglutide uptake is approximately 18,000 semaglutide initiators and 55,000 active comparator initiators, providing >90% power to detect a hazard ratio of 0.80 for the primary MACE composite endpoint.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      variables: {
        content:
          'Semaglutide exposure is defined by the first prescription of subcutaneous semaglutide (Ozempic®) in the study window. The index date is the date of this first prescription. Comparator exposures are defined by the first qualifying prescription of sitagliptin or empagliflozin during the same window, applying the same 365-day washout criterion. Dose is captured at each prescription and classified as low (0.25–0.5 mg/week), medium (1.0 mg/week), or high (2.0 mg/week).\n\nThe primary outcome is the first occurrence of a three-point MACE composite: (1) non-fatal acute myocardial infarction (AMI), defined using validated ICD-10 codes I21.x and I22.x in HES inpatient admission data with overnight stay; (2) non-fatal ischaemic stroke (ICD-10 I63.x in HES); and (3) cardiovascular death (ONS mortality, ICD-10 I00–I99 as underlying cause). Secondary outcomes include hospitalisation for heart failure (I50.x), all-cause mortality, and the five-point MACE composite.\n\nBaseline covariates are measured in the 12 months prior to the index date and include: age, sex, BMI, HbA1c, eGFR, smoking status, Charlson Comorbidity Index, prior cardiovascular diagnoses, concomitant medications (statins, antihypertensives, aspirin), and prior healthcare utilisation. All covariate definitions use validated CPRD code lists from the CALIBER phenotyping library.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      study_size: {
        content:
          'Sample size calculations are based on the primary outcome of three-point MACE. Using published CPRD-based MACE incidence rates for T2DM patients initiating second-line therapy (approximately 18 per 1,000 person-years for GLP-1 RA initiators and 22 per 1,000 person-years for DPP-4 inhibitor initiators), a matched cohort of 18,000 semaglutide initiators and 18,000 sitagliptin comparators provides >90% statistical power to detect a hazard ratio of 0.80 at a two-sided alpha of 0.05, assuming 3 years of mean follow-up and 15% loss to follow-up.\n\nFor the SGLT-2 inhibitor comparator arm (empagliflozin), a similar calculation yields >85% power with the anticipated 12,000 empagliflozin initiators meeting the new-user eligibility criteria in the study window. These estimates are based on CPRD Aurum coverage of approximately 13 million active patients and observed semaglutide prescribing rates from NHS England prescribing data (approximately 6,000–8,000 new initiators per year from 2019 onwards).\n\nFeasibility was confirmed using CPRD\'s online search tool prior to protocol finalisation, returning an estimated 21,400 semaglutide initiators meeting inclusion criteria from January 2019 to December 2023, exceeding the minimum required sample. A study size sensitivity analysis will assess whether the pre-specified subgroup of patients aged ≥75 years (anticipated n ≈ 2,800) is adequately powered for that subgroup analysis.',
        references_used: [],
        confidence: 'medium',
        ai_generated: true,
        status: 'ai_generated',
      },
      data_analysis: {
        content:
          'Baseline characteristics of semaglutide and comparator initiators are compared using standardised mean differences (SMD) before and after propensity score matching, with SMD < 0.10 considered as evidence of adequate balance. Absolute incidence rates per 1,000 person-years with 95% confidence intervals are calculated within matched cohorts. The primary measure of effect is the hazard ratio (HR) estimated using Cox proportional hazards regression with robust (sandwich) variance estimation, incorporating the matched pair as a cluster.\n\nThe proportional hazards assumption is assessed using Schoenfeld residuals and time-interaction tests. In the event of violation, time-varying HR analysis using restricted mean survival time (RMST) difference at 5 years is conducted as an alternative. All analyses follow the intention-to-treat principle for the primary estimand, with on-treatment and per-protocol sensitivity estimands pre-specified.\n\nPre-specified subgroup analyses are conducted using interaction terms for: age (<65 / 65–74 / ≥75 years), sex, baseline eGFR category, prior CVD history, baseline HbA1c (>9% vs ≤9%), and obesity (BMI ≥35 kg/m²). The E-value is calculated to quantify the minimum strength of unmeasured confounding required to fully explain the observed association. All analyses are conducted in R version 4.3.2 using the MatchIt, survival, and tableone packages. A statistical analysis plan (SAP) is finalised and time-stamped prior to any outcome data access.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      limitations: {
        content:
          'Despite the strengths of this PASS design — large population-based cohort, validated outcome ascertainment via HES/ONS linkage, and active comparator selection — several limitations warrant acknowledgement. First, residual confounding by indication cannot be eliminated: semaglutide initiators may have higher unmeasured cardiovascular risk motivation compared with sitagliptin initiators, and unmeasured confounders such as dietary changes, exercise behaviour, or over-the-counter NSAID use are not captured in CPRD. The E-value analysis quantifies the sensitivity of findings to this limitation.\n\nSecond, the new-user design with 365-day washout may result in exclusion of patients who cycle between diabetes drug classes, potentially limiting generalisability to more experienced medication users. Third, treatment adherence and actual drug ingestion cannot be confirmed from prescription records; we assume dispensing and consumption but cannot exclude stockpiling or under-utilisation. Fourth, HES linkage is available for approximately 75% of CPRD Aurum practices in England, and analyses are restricted to practices with valid linkage consent, which may introduce selection bias.\n\nFinally, the study period (2018–2023) overlaps with the COVID-19 pandemic (2020–2021), during which primary care attendance and hospital admissions were substantially disrupted. Sensitivity analyses excluding the period March 2020 to March 2021 are pre-specified to assess pandemic impact on event ascertainment and treatment patterns.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      ethics: {
        content:
          'This study uses pre-existing, anonymised electronic health record data from CPRD Aurum and does not involve direct patient contact or recruitment. Ethical approval has been obtained from the CPRD Independent Scientific Advisory Committee (ISAC Protocol #26-001) and the Health Research Authority (HRA). Individual patient consent is not required under the terms of the CPRD data access agreement, which operates under Section 251 of the NHS Act 2006 and the Health Service (Control of Patient Information) Regulations 2002, approved by the Confidentiality Advisory Group (CAG).\n\nData are accessed and analysed within the CPRD secure research environment in accordance with GDPR, the UK Data Protection Act 2018, and CPRD data governance requirements. No patient-level data are extracted or transferred outside of the secure environment; only aggregate results and summary statistics are exported following review by CPRD data governance staff. All researchers with data access have completed CPRD data governance training.\n\nThe study is registered on the EU PAS Register (EUPAS number to be assigned prior to data access) in compliance with GVP Module VIII requirements for Post-Authorisation Safety Studies. The protocol is publicly available on the EU PAS Register and the ENCePP e-Register of Studies. Results will be reported in accordance with the STROBE and RECORD-PE reporting guidelines and will be submitted to the EMA within 12 months of study completion, as per the PASS obligation milestones.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
    },
    code_sets: { icd10: [], ndc: [], cpt: [] },
    flags: [],
    version: 1,
    created_at: new Date('2026-03-10T10:00:00Z').toISOString(),
    updated_at: new Date('2026-03-15T14:30:00Z').toISOString(),
  },
  {
    study_id: 'demo-study-002',
    study_inputs: ROFECOXIB_INPUTS,
    sections: {
      background: {
        content:
          'Rofecoxib (Vioxx®) is a selective cyclooxygenase-2 (COX-2) inhibitor that was approved by the US Food and Drug Administration (FDA) in May 1999 for the treatment of osteoarthritis, acute pain, and primary dysmenorrhoea. By 2004, rofecoxib was among the most widely prescribed drugs in the United States, with estimated annual sales exceeding $2.5 billion, reflecting its positioning as a gastrointestinal-sparing alternative to non-selective NSAIDs. The pharmacological rationale for cardiovascular concern rests on imbalance between prostacyclin (vasodilatory, anti-aggregatory) and thromboxane A2 (vasoconstrictive, pro-aggregatory) pathways: selective COX-2 inhibition reduces prostacyclin without affecting platelet thromboxane, potentially creating a pro-thrombotic milieu.\n\nThe APPROVe trial (Adenomatous Polyp Prevention on Vioxx), a randomised placebo-controlled trial designed for a colorectal cancer prevention indication, was the primary data source that triggered the voluntary market withdrawal of rofecoxib in September 2004. APPROVe demonstrated a relative risk of confirmed thrombotic cardiovascular events of 1.92 (95% CI 1.19–3.11) for rofecoxib 25 mg/day versus placebo after 18 months of treatment. This case-control study was initiated as a regulatory post-marketing commitment to characterise the cardiovascular risk in the broader osteoarthritis-indicated population using real-world US electronic health records.\n\nOptum EHR is a large US longitudinal electronic health records database encompassing over 70 million patients across ambulatory, inpatient, and specialist care settings. The database includes structured diagnosis codes (ICD-9-CM, later ICD-10-CM), procedure codes (CPT-4), laboratory values, and medication orders with free-text prescribing notes. Its temporal coverage and patient volume make it suitable for rare outcome epidemiology studies such as acute myocardial infarction in drug-exposed OA populations.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      objectives: {
        content:
          'The primary objective is to estimate the odds ratio (OR) for acute myocardial infarction (AMI) associated with current use of rofecoxib compared with current use of celecoxib or naproxen among osteoarthritis patients in the Optum EHR database, applying a case-control design nested within the osteoarthritis-diagnosed cohort.\n\nSecondary objectives include: (1) assessing dose-response relationships for rofecoxib exposure (25 mg/day vs 50 mg/day) and AMI risk; (2) evaluating the effect of treatment duration on risk (< 30 days, 31–90 days, > 90 days of continuous therapy); (3) comparing rofecoxib risk with non-selective NSAIDs (naproxen, diclofenac) and another COX-2 inhibitor (celecoxib) simultaneously; and (4) quantifying absolute risk differences per 10,000 patient-years to support public health impact assessment.\n\nA secondary safety objective examines the risk of ischaemic stroke and the composite of AMI or stroke (major cardiovascular events) with rofecoxib versus comparators. Subgroup analyses pre-specified to detect effect modification include: prior cardiovascular disease, aspirin co-medication, diabetes mellitus, hypertension, and age ≥65 years. Results are intended to support the FDA\'s benefit-risk reassessment and inform labelling decisions for remaining COX-2 inhibitors on the US market.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      study_design: {
        content:
          'This study employs a nested case-control design within a source cohort of osteoarthritis patients in the Optum EHR database from May 1999 to September 2004. Cases are patients with a first AMI during follow-up; up to 10 controls per case are matched on index date (risk-set sampling), age (±2 years), sex, geographic region, and Optum enrolment duration. Nested case-control designs are computationally efficient for rare outcomes and produce OR estimates that approximate the incidence rate ratio from the underlying cohort.\n\nExposure windows are defined as: current use (prescription in the 1–30 days before index date), recent use (31–90 days before), past use (91–365 days before), and remote use (> 365 days before). Current use is the primary exposure category of interest, consistent with the pharmacological hypothesis of acute thromboxane/prostacyclin imbalance. The primary comparison is rofecoxib versus celecoxib (active comparator of the same drug class) to control for healthy user and channelling biases that would arise from comparison with non-NSAID users.\n\nConditional logistic regression is used for primary analysis, adjusting for potential confounders not captured by matching: Charlson Comorbidity Index, prior statin and aspirin use, hypertension diagnosis, diabetes mellitus, baseline lipid levels, number of outpatient visits in prior 12 months, and smoking status.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      study_setting: {
        content:
          'The study is conducted using Optum EHR, a large US longitudinal electronic health records database covering over 70 million patients across ambulatory, inpatient, and specialist care settings nationwide. The database encompasses structured diagnosis codes (ICD-9-CM), procedure codes (CPT-4), laboratory results, and medication order records, making it suitable for pharmacoepidemiological research in community-based populations.\n\nThe study period spans May 1, 1999 (date of FDA approval of rofecoxib) to September 30, 2004 (date of voluntary market withdrawal). The geographic coverage includes all US Census regions, with patients distributed across urban, suburban, and rural practice settings. Socioeconomic status is approximated via zip-code-level median household income linked from US Census Bureau data.\n\nAll Optum EHR practices contributing data meet minimum quality thresholds for data completeness and record linkage. Practices with >20% missing medication order data in any calendar year are excluded. Death ascertainment uses a combination of in-EHR recorded deaths and linkage to the Social Security Death Index (SSDI) to capture out-of-hospital mortality.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      cohort_definition: {
        content:
          'The source cohort consists of adults aged 40 years or older with at least one ICD-9-CM code for osteoarthritis (715.x) recorded in the Optum EHR between May 1, 1999, and September 30, 2004. Patients must have at least 6 months of continuous Optum enrolment before the index date to allow covariate ascertainment. The study is restricted to patients with at least one NSAID or COX-2 inhibitor prescription recorded in the database, ensuring that all participants are active medication users.\n\nExclusion criteria include: rheumatoid arthritis (ICD-9 714.x) or other inflammatory arthropathy diagnosis; cancer diagnosis within 2 years prior; renal failure on dialysis; nursing home residence; and prior AMI or coronary artery bypass graft (CABG) for the primary AMI analysis. The final case cohort is expected to number approximately 4,200 AMI cases with 42,000 matched controls based on database size and OA prevalence.\n\nCase and control patients are characterised by age, sex, Charlson comorbidity score, prior cardiovascular diagnoses, concomitant medications (aspirin, statins, antihypertensives, oral antidiabetic drugs), healthcare utilisation, and smoking status derived from structured EHR fields and free-text note processing.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      variables: {
        content:
          "Rofecoxib exposure is ascertained from medication order records in Optum EHR. Current use is defined as a prescription with days' supply extending into or overlapping the 1–30 days before the index date, allowing a 7-day gap for late refills. Dose is classified as standard (25 mg/day) or high (50 mg/day). Celecoxib (100–200 mg twice daily) and naproxen (375–500 mg twice daily) are defined analogously as comparator exposures.\n\nCases are defined by a first recorded ICD-9-CM code for acute myocardial infarction (410.x1) in the Optum EHR during the study period, requiring an associated inpatient hospitalisation record of ≥2 days duration. All cases are independently reviewed by two blinded medical record abstractors using a WHO-definition adjudication form. Secondary outcomes include ischaemic stroke (ICD-9 433.x1, 434.x1, 436.x), the composite of AMI or stroke, and all-cause mortality.\n\nBaseline covariates include: Charlson Comorbidity Index score, prior aspirin and statin use, antihypertensive drug class, diabetes mellitus, smoking status, number of physician visits in prior 6 months, and urban/rural residence — all measured in the 6 months before the index date. Over-the-counter NSAID use is a recognised unmeasured confounder and is addressed in the limitations.",
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      study_size: {
        content:
          'Sample size calculations are based on the primary outcome of AMI in an osteoarthritis source cohort. Published epidemiological data indicate an AMI incidence of approximately 8–10 per 1,000 person-years in OA patients aged ≥40 years using NSAIDs. With an expected case count of approximately 4,200 AMI cases and 10:1 matching (42,000 controls), the study has >95% power to detect an odds ratio of 1.5 for current rofecoxib versus current celecoxib use at a two-sided alpha of 0.05, assuming 20% of cases are current rofecoxib users and 25% of cases are current celecoxib users.\n\nFor the dose-response analysis (25 mg vs 50 mg/day), the expected proportion of rofecoxib users on the 50 mg dose is approximately 30% based on IMS Health prescribing data from the 1999–2004 period, yielding approximately 1,260 high-dose rofecoxib-exposed cases — sufficient for a stratified analysis with >80% power to detect an OR of 1.8 for high versus standard dose.\n\nFeasibility was confirmed through Optum EHR record counts showing approximately 2.1 million OA-diagnosed patients aged ≥40 in the study period, of whom approximately 420,000 received at least one rofecoxib prescription, providing a more than adequate source population for the nested case-control sampling.',
        references_used: [],
        confidence: 'medium',
        ai_generated: true,
        status: 'ai_generated',
      },
      data_analysis: {
        content:
          'Conditional logistic regression, conditioned on the matched sets, is used to estimate odds ratios (OR) and 95% confidence intervals for AMI associated with current rofecoxib use versus current celecoxib use (primary comparator), current naproxen use, and non-use. Covariates adjusted in the multivariable model include: Charlson Comorbidity Index score (continuous), prior aspirin use, statin use, antihypertensive drug class, diabetes mellitus, smoking status, number of physician visits in prior 6 months, and urban/rural residence.\n\nA dose-response analysis uses ordinal categorisation of rofecoxib dose (25 mg/day vs 50 mg/day) and cumulative exposure tertiles, testing for trend using the Cochran-Armitage test. Duration-response is assessed by categorising current use episodes as short (1–30 days), intermediate (31–90 days), and long-term (>90 days) of continuous therapy. Absolute risk differences (ARD) per 10,000 person-years are back-calculated from OR estimates using the background AMI incidence rate.\n\nSensitivity analyses include: restriction to patients with ≥2 OA diagnoses separated by ≥90 days; substitution of matching for propensity score stratification (quintiles); high-dimensional propensity score (hdPS) adjustment incorporating 200 empirically selected covariates; and restriction to cases with adjudicated AMI confirmation. All analyses are performed in SAS version 9.4 and R version 4.1.2.',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      limitations: {
        content:
          "Several important limitations of this case-control study must be considered in interpreting results. First, over-the-counter NSAID use is not systematically captured in the Optum EHR, as patients may self-medicate with ibuprofen or naproxen sodium without prescription. Misclassification of comparator exposure to OTC NSAID use in nominally unexposed controls could bias ORs toward the null, though active comparator analyses are less affected.\n\nSecond, the voluntary market withdrawal in September 2004 creates informative censoring: patients at highest cardiovascular risk may have preferentially discontinued rofecoxib before the study end date following widespread media coverage of the APPROVe results. This creates time-varying confounding by exposure awareness and may underestimate AMI risk in the later study period. Restriction to the period before July 2004 is assessed in a sensitivity analysis.\n\nThird, while Optum EHR captures structured order data, medication adherence and actual ingestion cannot be confirmed. Fourth, residual confounding by cardiovascular risk indication is a concern: clinicians may have preferentially prescribed celecoxib over rofecoxib to patients with established cardiovascular disease after early safety signals emerged in 2001–2003, potentially inflating the rofecoxib-to-celecoxib OR. The channelling bias sensitivity analysis using time-stratified analyses addresses this concern.",
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
      ethics: {
        content:
          'This study uses pre-existing, de-identified electronic health record data from Optum EHR under a data use agreement that complies with the Health Insurance Portability and Accountability Act (HIPAA) Privacy Rule. The study was reviewed by the Institutional Review Board (IRB) of [Sponsor Institution] and granted an exemption from full review as it meets the criteria for research involving only de-identified data under 45 CFR 46.104(d)(4).\n\nNo patient contact, recruitment, or informed consent procedures are required. Data are accessed and analysed within a secure analysis environment with role-based access controls. All analysts with data access have completed HIPAA training and signed Optum data use agreements. No patient-level data are transmitted outside the secure analysis environment; only aggregate summary statistics are exported following data governance review.\n\nThe study protocol was registered with the FDA as a post-marketing commitment (PMC) under the terms of the rofecoxib New Drug Application. Results will be submitted to the FDA in accordance with the PMC reporting timeline and will be made publicly available through peer-reviewed publication in accordance with the International Committee of Medical Journal Editors (ICMJE) data sharing statement. All analyses adhere to the Good Pharmacoepidemiology Practices (GPP) guidelines of the International Society for Pharmacoepidemiology (ISPE).',
        references_used: [],
        confidence: 'high',
        ai_generated: true,
        status: 'ai_generated',
      },
    },
    code_sets: { icd10: [], ndc: [], cpt: [] },
    flags: [],
    version: 1,
    created_at: new Date('2026-03-10T10:00:00Z').toISOString(),
    updated_at: new Date('2026-03-15T14:30:00Z').toISOString(),
  },
]
