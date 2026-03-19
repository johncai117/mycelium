import axios from 'axios'
import type {
  StudyInput,
  Protocol,
  ClarifyResponse,
  RetrievedChunk,
  GenerateResponse,
  RegenerateResponse,
  EvalResult,
  StudyListItem,
  MethodologyRecommendation,
  RegulatoryDocExtracted,
  TemplateUploadResponse,
} from '@/types'

// ── Mock mode ─────────────────────────────────────────────────────────────────

export const MOCK_MODE =
  import.meta.env.VITE_MOCK_MODE === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io'))

function delay(ms = 800) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const MOCK_CLARIFY_RESPONSE: ClarifyResponse = {
  is_sufficient: false,
  questions: [
    {
      field: 'primary_outcome',
      question: 'What is the primary cardiovascular outcome of interest — MACE (major adverse cardiovascular events), HF hospitalisation, or a composite endpoint?',
      why_it_matters: 'The choice of primary endpoint determines the sample size, follow-up duration, and the ICD-10 code set required.',
      options: ['MACE (MI, stroke, CV death)', 'Heart failure hospitalisation', 'All-cause mortality', 'Composite MACE + HF'],
      required: true,
    },
    {
      field: 'comparators',
      question: 'Which active comparator(s) should be included — DPP-4 inhibitors, sulfonylureas, SGLT-2 inhibitors, or insulin?',
      why_it_matters: 'Using an active comparator rather than non-use helps control for healthy-user bias and channelling.',
      options: ['Sulfonylureas', 'DPP-4 inhibitors', 'SGLT-2 inhibitors', 'Insulin'],
      required: true,
    },
    {
      field: 'washout_days',
      question: 'How long a washout period should be applied before index date to enforce the new-user design (standard: 365 days)?',
      why_it_matters: 'A longer washout reduces prevalence bias but shrinks the eligible cohort.',
      options: ['180 days', '365 days', '730 days'],
      required: false,
    },
  ],
}

const MOCK_PROTOCOL: Protocol = {
  study_id: 'mock-study-001',
  study_inputs: {
    drug_name: 'Metformin',
    indication: 'Type 2 diabetes with cardiovascular risk reduction',
    study_type: 'cohort',
    drug_inn: 'metformin hydrochloride',
    data_source: 'CPRD Aurum (UK primary care)',
    comparators: ['Sulfonylureas'],
    study_period_start: '2015-01-01',
    study_period_end: '2022-12-31',
    geography: 'United Kingdom',
    regulatory_context: 'PASS',
    sponsor: 'Demo Sponsor',
    primary_outcome: 'MACE (MI, stroke, CV death)',
    washout_days: 365,
    new_user_design: true,
  },
  sections: {
    background: {
      content:
        'Type 2 diabetes mellitus (T2DM) is associated with a two- to threefold increased risk of cardiovascular morbidity and mortality compared with the general population. Metformin hydrochloride, a biguanide, has been the recommended first-line pharmacological therapy for T2DM since the 1990s and has demonstrated glucose-lowering efficacy as well as potential cardioprotective effects in the UKPDS trial. However, the cardiovascular benefit of metformin relative to sulfonylureas in routine clinical practice, particularly with respect to major adverse cardiovascular events (MACE), remains incompletely characterised in real-world populations.\n\nThis post-authorisation safety study (PASS) is conducted in accordance with the requirements set out in the European Union (EU) pharmacovigilance legislation (Regulation (EU) No 1235/2010) and the Good Pharmacoepidemiology Practice (GPP) guidelines issued by the International Society for Pharmacoepidemiology (ISPE). The study uses routinely collected electronic health records from the Clinical Practice Research Datalink (CPRD) Aurum database to evaluate the cardiovascular safety profile of metformin versus sulfonylureas in patients with T2DM.',
      references_used: ['UKPDS-33', 'EMA-GPP-2016', 'ISPE-GPP-2021'],
      confidence: 'high',
      ai_generated: true,
      status: 'ai_generated',
    },
    objectives: {
      content:
        'Primary objective: To estimate the incidence rate of MACE (defined as the composite of non-fatal myocardial infarction, non-fatal ischaemic stroke, and cardiovascular death) in new users of metformin compared with new users of sulfonylureas among adults with T2DM in the United Kingdom.\n\nSecondary objectives:\n1. To estimate the incidence rate of individual components of MACE (MI, stroke, CV death) separately.\n2. To estimate the incidence rate of heart failure hospitalisation.\n3. To assess all-cause mortality as a secondary safety endpoint.\n4. To conduct pre-specified subgroup analyses by age (< 65 vs ≥ 65 years), sex, baseline eGFR category (≥ 60 vs < 60 mL/min/1.73 m²), and presence of established cardiovascular disease at baseline.',
      references_used: [],
      confidence: 'high',
      ai_generated: true,
      status: 'ai_generated',
    },
    study_design: {
      content:
        'This is an active-comparator, new-user cohort study using routinely collected primary care data from CPRD Aurum linked to Hospital Episode Statistics (HES) and the Office for National Statistics (ONS) mortality register. The new-user design is employed to minimise prevalent-user bias: patients are required to have no prescription for any antidiabetic agent in the 365-day period preceding the index date (first prescription of metformin or sulfonylurea).\n\nThe study period spans 1 January 2015 to 31 December 2022. Patients are followed from the index date until the occurrence of the primary outcome, death, end of registration, last data collection date, or end of study period, whichever occurs first. An intent-to-treat (ITT) primary analysis will be conducted, supplemented by an as-treated sensitivity analysis applying a 90-day grace period beyond the last prescription refill.',
      references_used: ['Ray-2003-new-user', 'ISPE-GPP-2021'],
      confidence: 'high',
      ai_generated: true,
      status: 'ai_generated',
    },
    population: {
      content:
        'Inclusion criteria:\n• Adults aged ≥ 18 years registered with a CPRD Aurum practice for ≥ 12 months prior to index date\n• Diagnosis of type 2 diabetes mellitus (Read/SNOMED code list available in Appendix A) recorded at any time before or on the index date\n• First prescription for metformin (BNF section 6.1.2.2) or a sulfonylurea (glibenclamide, glipizide, gliclazide, glimepiride, tolbutamide) in the study window with no antidiabetic prescription in the prior 365 days\n• Linkage consent to HES and ONS data\n\nExclusion criteria:\n• Type 1 diabetes mellitus or secondary diabetes (steroid-induced, monogenic, post-pancreatectomy)\n• Polycystic ovary syndrome as the sole indication for metformin\n• Renal impairment with eGFR < 30 mL/min/1.73 m² at index date (contraindication to metformin)\n• Residence in a care home at index date\n• Pregnancy or up to 12 months postpartum at index date',
      references_used: ['CPRD-data-spec-v2', 'MHRA-SPC-metformin'],
      confidence: 'high',
      ai_generated: true,
      status: 'ai_generated',
    },
    exposures: {
      content:
        'Exposed cohort: New users of metformin identified by a first prescription of any metformin-containing product (monotherapy or combination tablet) with no prior antidiabetic exposure in the 365-day washout window.\n\nComparator cohort: New users of sulfonylureas (any agent: glibenclamide, gliclazide, glimepiride, glipizide, tolbutamide) with no prior antidiabetic exposure in the 365-day washout window.\n\nExposure is defined using BNF chapter 6.1 product codes mapped to CPRD Aurum product dictionaries. Propensity score overlap weighting (overlap weights) will be used to balance baseline covariates between the two cohorts. The propensity score model will include age, sex, BMI, smoking status, HbA1c at index, eGFR, presence of established CVD, heart failure, chronic kidney disease, statin use, ACE inhibitor/ARB use, aspirin use, year of index date, and practice-level deprivation quintile.',
      references_used: ['Li-Li-2018-overlap-weights', 'CPRD-product-dict'],
      confidence: 'medium',
      ai_generated: true,
      status: 'ai_generated',
    },
    outcomes: {
      content:
        'Primary outcome: MACE, defined as the first occurrence of any of the following:\n• Acute myocardial infarction: ICD-10 I21.x, I22.x (HES inpatient, primary diagnosis)\n• Ischaemic stroke: ICD-10 I63.x (HES inpatient, primary diagnosis)\n• Cardiovascular death: ICD-10 I00–I99 as underlying cause (ONS)\n\nSecondary outcomes:\n• Heart failure hospitalisation: ICD-10 I50.x (HES inpatient, primary diagnosis)\n• All-cause mortality: any cause of death (ONS mortality register)\n\nThe code lists have been reviewed by a clinical advisor (cardiologist) and validated against published literature. Sensitivity analyses will apply alternative definitions (e.g., including secondary HES diagnoses for MI).',
      references_used: ['CALIBER-codes-2013', 'Herrett-2015-HES-validation'],
      confidence: 'high',
      ai_generated: true,
      status: 'ai_generated',
    },
    covariates: {
      content:
        'Baseline covariates measured in the 12-month period prior to the index date (unless otherwise specified):\n\nDemographic: age, sex, ethnicity (5-category), Townsend deprivation score quintile, BMI (most recent), smoking status (current/ex/never), alcohol consumption.\n\nClinical: HbA1c (most recent value), eGFR (most recent CKD-EPI), systolic blood pressure, duration of diabetes (years since first T2DM code), established CVD (MI, stroke, or peripheral arterial disease ever), heart failure (ever), atrial fibrillation (ever), CKD (stage ≥ 3), liver disease.\n\nMedication: statin (any, in prior 6 months), ACE inhibitor or ARB, aspirin, beta-blocker, loop diuretic, prior insulin (ever), prior antidiabetic therapy (ever, for sensitivity analysis).\n\nHealthcare utilisation: number of GP consultations in prior 12 months, number of hospitalisations in prior 12 months.',
      references_used: ['CPRD-Aurum-data-dict', 'Benchimol-2015'],
      confidence: 'high',
      ai_generated: true,
      status: 'ai_generated',
    },
    statistical_analysis: {
      content:
        'Crude and weighted incidence rates (per 1,000 person-years) will be estimated for the primary and secondary outcomes in each exposure cohort. Hazard ratios and 95% confidence intervals will be estimated using Cox proportional hazards regression with the propensity score overlap weights applied as analytical weights, and calendar time as the underlying timescale.\n\nThe proportional hazards assumption will be assessed using Schoenfeld residuals and log-log survival plots. Robust variance estimators (sandwich estimator) will be used to account for the weighting.\n\nPre-specified subgroup analyses will be performed by (1) age group (< 65 / ≥ 65 years), (2) sex, (3) baseline eGFR category (≥ 60 / < 60 mL/min/1.73 m²), and (4) presence of established CVD at baseline, using interaction terms in the Cox model.\n\nSensitivity analyses: (1) as-treated analysis with 90-day grace period; (2) excluding patients with HbA1c > 86 mmol/mol at index (those likely requiring combination therapy); (3) restricting to practices in the top quartile of data quality score; (4) applying inverse probability of treatment weighting (IPTW) as an alternative propensity score method; (5) E-value analysis to quantify unmeasured confounding.\n\nAll analyses will be conducted in R (version ≥ 4.3) using the packages survival, WeightIt, and cobalt. A pre-specified statistical analysis plan (SAP) will be finalised before data access.',
      references_used: ['VanderWeele-2017-Evalue', 'Greifer-2023-WeightIt'],
      confidence: 'medium',
      ai_generated: true,
      status: 'ai_generated',
    },
    data_sources: {
      content:
        'Clinical Practice Research Datalink (CPRD) Aurum: a primary care database covering approximately 13 million currently registered patients from over 1,500 GP practices in England. CPRD Aurum captures coded diagnoses (SNOMED CT), prescriptions (mapped to BNF), laboratory results, and referrals.\n\nHospital Episode Statistics (HES) Admitted Patient Care (APC): linked inpatient records providing ICD-10-coded diagnoses and OPCS-4 procedure codes for hospital admissions in England.\n\nOffice for National Statistics (ONS) Death Registration: linked mortality data providing date and cause of death (ICD-10 underlying and contributing causes).\n\nData are linked at individual patient level using a pseudonymised patient identifier. The linkage scheme has been validated and described previously (Herrett et al., 2015). Data access is granted under CPRD Research Data Governance approval [application number: placeholder] and NHS England DARS approval.',
      references_used: ['Herrett-2015-CPRD', 'Wolf-2019-CPRD-Aurum'],
      confidence: 'high',
      ai_generated: true,
      status: 'ai_generated',
    },
    limitations: {
      content:
        'This study has several limitations that should be considered when interpreting findings:\n\n1. Unmeasured confounding: Although a new-user active-comparator design with propensity score weighting is used, residual confounding due to unmeasured variables (e.g., dietary habits, physical activity, over-the-counter NSAID use, patient preference for specific agents) cannot be excluded. The E-value sensitivity analysis will quantify the strength of association an unmeasured confounder would need to have to explain away the observed effect.\n\n2. Misclassification of exposure: Prescriptions in CPRD represent prescriptions issued, not necessarily dispensed or consumed. Adherence to therapy is not directly measurable, which may introduce non-differential exposure misclassification biasing results toward the null.\n\n3. Outcome misclassification: HES inpatient data capture hospitalisations but not outpatient or primary care diagnoses of MI or stroke. Fatal events occurring outside hospital may be captured only through ONS mortality data, potentially leading to underascertainment.\n\n4. Generalisability: CPRD practices are broadly representative of the UK population; however, findings may not be directly generalisable to healthcare systems with different prescribing patterns, formulary restrictions, or patient demographics.',
      references_used: ['VanderWeele-2017-Evalue', 'ISPE-GPP-2021'],
      confidence: 'high',
      ai_generated: true,
      status: 'ai_generated',
    },
  },
  code_sets: {
    icd10: [
      { code: 'I21', description: 'Acute myocardial infarction', source: 'CALIBER' },
      { code: 'I22', description: 'Subsequent myocardial infarction', source: 'CALIBER' },
      { code: 'I63', description: 'Cerebral infarction (ischaemic stroke)', source: 'CALIBER' },
      { code: 'I50', description: 'Heart failure', source: 'CALIBER' },
    ],
    ndc: [
      { code: '0093-1048', description: 'Metformin HCl 500 mg tablet', source: 'NDC directory' },
      { code: '0093-1049', description: 'Metformin HCl 850 mg tablet', source: 'NDC directory' },
    ],
    cpt: [
      { code: '99213', description: 'Office/outpatient visit, established patient, low complexity', source: 'AMA CPT' },
      { code: '93000', description: 'Electrocardiogram, routine with interpretation', source: 'AMA CPT' },
    ],
  },
  flags: [
    {
      section: 'exposures',
      message: 'Propensity score model specification should be finalised in the SAP before data access to avoid outcome-driven model selection.',
      severity: 'warning',
    },
    {
      section: 'statistical_analysis',
      message: 'Confirm that CPRD Aurum practice linkage to HES covers ≥ 90% of the eligible cohort before finalising sample size estimates.',
      severity: 'requires_judgment',
    },
  ],
  version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const MOCK_EVAL_RESULT: EvalResult = {
  encepp_score: 78,
  overall_grade: 'C',
  encepp_items: [
    {
      item: 'Research question and objectives clearly stated',
      section: 'objectives',
      score: 1,
      finding: 'Primary and secondary objectives are well-defined with specific endpoints.',
    },
    {
      item: 'Study design appropriate for objectives',
      section: 'study_design',
      score: 1,
      finding: 'New-user active-comparator cohort design is appropriate for this safety question.',
    },
    {
      item: 'Population eligibility criteria specified',
      section: 'population',
      score: 1,
      finding: 'Inclusion and exclusion criteria are detailed and clinically justified.',
    },
    {
      item: 'Exposure definition and time window specified',
      section: 'exposures',
      score: 0.5,
      finding: 'Exposure definitions are adequate but the grace period for as-treated analysis requires further specification.',
    },
    {
      item: 'Outcome definitions with validation references',
      section: 'outcomes',
      score: 1,
      finding: 'ICD-10 codes are provided and referenced to CALIBER validation studies.',
    },
    {
      item: 'Confounding addressed with appropriate method',
      section: 'statistical_analysis',
      score: 0.5,
      finding: 'Propensity score overlap weighting is appropriate; however, covariate balance diagnostics (SMD thresholds) are not specified.',
    },
    {
      item: 'Sample size / power calculation included',
      section: 'statistical_analysis',
      score: 0,
      finding: 'No formal power calculation or minimum detectable risk ratio is specified in the protocol.',
    },
    {
      item: 'Limitations discussed',
      section: 'limitations',
      score: 1,
      finding: 'Four key limitations including unmeasured confounding and outcome misclassification are addressed.',
    },
  ],
  judge_narrative:
    'This protocol demonstrates solid pharmacoepidemiological methodology appropriate for a PASS submission. The new-user active-comparator design and propensity score overlap weighting are well-chosen to address channelling bias between metformin and sulfonylureas. The use of CPRD Aurum linked to HES and ONS provides high-quality outcome ascertainment for hospitalised events and mortality.\n\nThe primary areas requiring improvement before regulatory submission are: (1) a formal statistical power calculation specifying the minimum detectable hazard ratio and expected event rates; (2) explicit covariate balance thresholds post-weighting (e.g., SMD < 0.10 for all variables); and (3) a pre-specified analysis plan for handling missing data, particularly for HbA1c and BMI which may be missing in up to 15–20% of records.\n\nThe outcome code lists are well-validated but would benefit from listing sensitivity code lists (e.g., including secondary HES diagnoses) to be used in pre-specified sensitivity analyses. Overall, the protocol is on track for a Grade B with targeted revisions.',
  improvement_suggestions: [
    {
      section: 'statistical_analysis',
      suggestion:
        'Add a formal power calculation specifying the assumed event rate in the comparator arm, the minimum clinically meaningful hazard ratio (e.g., HR 1.3), anticipated follow-up time, and resulting required sample size.',
    },
    {
      section: 'statistical_analysis',
      suggestion:
        'Specify covariate balance thresholds after propensity score weighting (e.g., all standardised mean differences < 0.10) and describe the action plan if balance is not achieved.',
    },
    {
      section: 'covariates',
      suggestion:
        'Add a missing data section describing the expected proportion of missing values for key covariates (HbA1c, BMI, eGFR) and the pre-specified imputation strategy (e.g., multiple imputation by chained equations).',
    },
  ],
}

// ── Real API client ────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_API_KEY || ''
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

if (!MOCK_MODE && API_KEY) {
  api.interceptors.request.use((config) => {
    config.headers['Authorization'] = `Bearer ${API_KEY}`
    return config
  })
}

// ── Clarify ───────────────────────────────────────────────────────────────────

export async function clarifyInputs(study_inputs: StudyInput): Promise<ClarifyResponse> {
  if (MOCK_MODE) {
    await delay()
    return MOCK_CLARIFY_RESPONSE
  }
  const { data } = await api.post<ClarifyResponse>('/clarify', { study_inputs })
  return data
}

// ── Methodology Recommendation ───────────────────────────────────────────────

const MOCK_METHODOLOGY_RECOMMENDATION: MethodologyRecommendation = {
  primary: 'acnu',
  primary_display_name: 'Active Comparator New-User (ACNU) Cohort',
  primary_description:
    'Gold standard for comparative drug safety. Compares new users of the drug of interest with new users of an active comparator, minimizing prevalent-user bias and healthy-user bias.',
  confidence_score: 0.87,
  reasoning:
    'Based on your study parameters, Active Comparator New-User (ACNU) Cohort is recommended for safety signal investigation, the chronic time horizon. Gold standard for comparative drug safety.',
  alternatives: [
    { id: 'nested_case_control', display_name: 'Nested Case-Control', score: 0.62 },
    { id: 'prevalent_user', display_name: 'Prevalent User Cohort', score: 0.58 },
  ],
}

export async function recommendMethodology(
  study_inputs: StudyInput,
): Promise<MethodologyRecommendation> {
  if (MOCK_MODE) {
    await delay()
    return MOCK_METHODOLOGY_RECOMMENDATION
  }
  const { data } = await api.post<MethodologyRecommendation>('/methodology/recommend', {
    study_inputs,
  })
  return data
}

// ── Retrieve ──────────────────────────────────────────────────────────────────

export async function retrieveProtocols(study_inputs: StudyInput): Promise<RetrievedChunk[]> {
  if (MOCK_MODE) {
    await delay(400)
    return []
  }
  const { data } = await api.post<RetrievedChunk[]>('/retrieve', { study_inputs })
  return data
}

// ── Generate ──────────────────────────────────────────────────────────────────

export async function generateProtocol(
  study_inputs: StudyInput,
  retrieved_chunks: RetrievedChunk[] = [],
): Promise<GenerateResponse> {
  if (MOCK_MODE) {
    await delay(1800)
    return {
      sections: MOCK_PROTOCOL.sections,
      code_sets: MOCK_PROTOCOL.code_sets,
      flags: MOCK_PROTOCOL.flags,
    }
  }
  const { data } = await api.post<GenerateResponse>('/generate', {
    study_inputs,
    retrieved_chunks,
  })
  return data
}

export async function regenerateSection(params: {
  section_id: string
  current_content: string
  researcher_comment: string
  study_inputs: StudyInput
  retrieved_chunks?: RetrievedChunk[]
}): Promise<RegenerateResponse> {
  if (MOCK_MODE) {
    await delay(1200)
    return {
      content: `[Mock regenerated] ${params.current_content}`,
      change_summary: 'Mock regeneration applied researcher comment: ' + params.researcher_comment,
    }
  }
  const { data } = await api.post<RegenerateResponse>('/generate/section', {
    ...params,
    retrieved_chunks: params.retrieved_chunks ?? [],
  })
  return data
}

// ── Eval ──────────────────────────────────────────────────────────────────────

export async function evalProtocol(protocol: Protocol): Promise<EvalResult> {
  if (MOCK_MODE) {
    await delay(1500)
    return MOCK_EVAL_RESULT
  }
  const { data } = await api.post<EvalResult>('/eval', { protocol })
  return data
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportDocx(protocol: Protocol): Promise<Blob> {
  if (MOCK_MODE) {
    alert('Export is available in live mode with a running backend.')
    return new Blob()
  }
  const response = await api.post('/export/docx', { protocol }, { responseType: 'blob' })
  return response.data as Blob
}

// ── Upload ────────────────────────────────────────────────────────────────────

const MOCK_REGULATORY_DOC_EXTRACTED: RegulatoryDocExtracted = {
  study_description:
    'Conduct a post-marketing cardiovascular outcomes trial to assess the risk of major adverse cardiovascular events (MACE) in patients with type 2 diabetes treated with dulaglutide versus placebo, with an upper bound of the 2-sided 95% CI for the MACE risk ratio < 1.3.',
  requirement_type: 'FDA PMR CVOT',
  milestones: [
    { name: 'Draft Protocol', date: '2013-12-31' },
    { name: 'Final Protocol', date: '2014-06-30' },
    { name: 'Study Completion', date: '2018-12-31' },
    { name: 'Final Report', date: '2019-12-31' },
  ],
  safety_signal: 'MACE (major adverse cardiovascular events)',
  scientific_justification:
    'Required under FDAAA 505(o) to characterize cardiovascular risk for the class of GLP-1 receptor agonists in patients with type 2 diabetes and established or at-risk cardiovascular disease.',
  application_number: 'BLA 125469',
  applicant_name: 'Eli Lilly and Company',
}

export async function uploadRegulatoryDoc(file: File): Promise<RegulatoryDocExtracted> {
  if (MOCK_MODE) {
    await delay(1500)
    return MOCK_REGULATORY_DOC_EXTRACTED
  }
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<RegulatoryDocExtracted>(
    '/upload/regulatory-doc',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function uploadProtocolTemplate(file: File): Promise<TemplateUploadResponse> {
  if (MOCK_MODE) {
    await delay(800)
    return { template_id: 'mock-template-id', filename: file.name, size_bytes: file.size }
  }
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<TemplateUploadResponse>(
    '/upload/protocol-template',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

// ── Studies (in-memory store for MVP — replace with Supabase later) ───────────

const STORAGE_KEY = 'mycelium_studies'

function loadStudies(): StudyListItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveStudies(studies: StudyListItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(studies))
}

const PROTOCOLS_KEY = 'mycelium_protocols'

function loadProtocols(): Record<string, Protocol> {
  try {
    return JSON.parse(localStorage.getItem(PROTOCOLS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveProtocols(protocols: Record<string, Protocol>) {
  localStorage.setItem(PROTOCOLS_KEY, JSON.stringify(protocols))
}

export function getStudies(): StudyListItem[] {
  return loadStudies()
}

export function createStudy(inputs: StudyInput): StudyListItem {
  const id = crypto.randomUUID()
  const item: StudyListItem = {
    id,
    drug_name: inputs.drug_name,
    indication: inputs.indication,
    study_type: inputs.study_type,
    status: 'drafting',
    updated_at: new Date().toISOString(),
    sponsor: inputs.sponsor,
  }
  const studies = loadStudies()
  studies.unshift(item)
  saveStudies(studies)
  return item
}

export function getStudy(id: string): Protocol | null {
  const protocols = loadProtocols()
  return protocols[id] ?? null
}

export function saveProtocol(protocol: Protocol): void {
  const protocols = loadProtocols()
  protocol.updated_at = new Date().toISOString()
  protocols[protocol.study_id] = protocol

  // Update study list status
  const studies = loadStudies()
  const idx = studies.findIndex((s) => s.id === protocol.study_id)
  if (idx >= 0) {
    studies[idx].updated_at = protocol.updated_at
  }
  saveStudies(studies)
  saveProtocols(protocols)
}
