export type StudyType = 'cohort' | 'case_control' | 'cross_sectional' | 'other'
export type RegulatoryContext = 'PASS' | 'voluntary' | 'investigator_initiated'
export type MethodologyCategory =
  | 'acnu'
  | 'prevalent_user'
  | 'descriptive_cohort'
  | 'nested_case_control'
  | 'population_case_control'
  | 'sccs'
  | 'case_crossover'
  | 'cross_sectional'
  | 'drug_utilization'
  | 'prospective_registry'
  | 'pregnancy_registry'
  | 'survey'
export type ResearchQuestionType =
  | 'safety_signal'
  | 'drug_utilization'
  | 'effectiveness'
  | 'risk_minimization'
  | 'pregnancy_safety'
  | 'other'
export type OutcomeRarity = 'common' | 'uncommon' | 'rare' | 'very_rare'
export type DataCollection = 'claims_ehr' | 'registry' | 'survey' | 'prospective'
export type TimeHorizon = 'acute' | 'subacute' | 'chronic'
export type MethodologyConfidence = 'recommended' | 'user_selected' | 'overridden'
export type Confidence = 'high' | 'medium' | 'low'
export type StudyStatus = 'drafting' | 'review' | 'exported'
export type Grade = 'A' | 'B' | 'C' | 'D'
export type FlagSeverity = 'info' | 'warning' | 'requires_judgment'
export type SectionStatus = 'ai_generated' | 'edited' | 'approved'

// ── Regulatory document extraction ───────────────────────────────────────────

export interface RegulatoryMilestone {
  name: string
  date: string | null
}

export interface RegulatoryDocExtracted {
  study_description?: string
  requirement_type?: string
  milestones?: RegulatoryMilestone[]
  safety_signal?: string
  scientific_justification?: string
  application_number?: string
  applicant_name?: string
}

// ── Template upload ───────────────────────────────────────────────────────────

export interface TemplateUploadResponse {
  template_id: string
  filename: string
  size_bytes: number
}

// ── EMA/HMA Data Sources ─────────────────────────────────────────────────────

export interface EMADataSource {
  name: string
  acronym: string | null
  type: string | null
  countries: string | null
  regions: string | null
  care_setting: string | null
  darwin_eu_partner: string | null
  qualified: string | null
  data_from: string | null
  data_to: string | null
  median_obs_years: string | null
  population_size: string | null
  active_population_size: string | null
  age_groups: string | null
  website: string | null
  disease_info_detail: string | null
  rare_diseases: string | null
  pregnancy_neonates: string | null
  hospital_admissions: string | null
  cause_of_death: string | null
  cod_vocabulary: string | null
  prescriptions: string | null
  rx_vocabulary: string | null
  dispensing: string | null
  diagnostic_codes: string | null
  dx_vocabulary: string | null
  drug_vocabulary: string | null
  clinical_measurements: string | null
  genetic_data: string | null
  biomarker_data: string | null
  pro_data: string | null
  sociodemographic: string | null
  linkage_available: string | null
  linked_sources: string | null
  cdm_mapped: string | null
  cdm_version: string | null
  informed_consent_required: string | null
  data_refresh: string | null
  validation_possible: string | null
  funding_type: string | null
  population_coverage_pct: string | null
  family_linkage: string | null
}

// ── Study Input ───────────────────────────────────────────────────────────────

export interface StudyInput {
  drug_name: string
  indication: string
  study_type: StudyType
  drug_inn?: string
  data_source?: string
  comparators?: string[]
  study_period_start?: string
  study_period_end?: string
  geography?: string
  regulatory_context?: RegulatoryContext
  sponsor?: string
  primary_outcome?: string
  population_description?: string
  index_date_logic?: string
  washout_days?: number
  new_user_design?: boolean
  clinical_context?: string
  methodology?: MethodologyCategory
  methodology_confidence?: MethodologyConfidence
  research_question_type?: ResearchQuestionType
  outcome_rarity?: OutcomeRarity
  data_collection?: DataCollection
  time_horizon?: TimeHorizon
  // Regulatory intake
  regulatory_requirement_types?: string[]
  regulatory_doc_extracted?: RegulatoryDocExtracted | null
  protocol_template_id?: string
  // Data source selection
  selected_data_sources?: string[]
}

// ── Protocol ─────────────────────────────────────────────────────────────────

export interface ProtocolSection {
  content: string
  references_used: string[]
  confidence: Confidence
  ai_generated: boolean
  status?: SectionStatus
}

export interface CodeEntry {
  code: string
  description: string
  source?: string
}

export interface CodeSets {
  icd10: CodeEntry[]
  ndc: CodeEntry[]
  cpt: CodeEntry[]
}

export interface ProtocolFlag {
  section: string
  message: string
  severity: FlagSeverity
}

export interface Protocol {
  study_id: string
  study_inputs: StudyInput
  sections: Record<string, ProtocolSection>
  code_sets: CodeSets
  flags: ProtocolFlag[]
  version: number
  created_at: string
  updated_at: string
}

// ── Clarify ───────────────────────────────────────────────────────────────────

export interface ClarifyQuestion {
  field: string
  question: string
  why_it_matters: string
  options: string[] | null
  required: boolean
}

export interface ClarifyResponse {
  is_sufficient: boolean
  questions: ClarifyQuestion[]
}

// ── Retrieval ─────────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  chunk: string
  source_title: string
  source_eu_pas: string
  score: number
  section: string
}

// ── Eval ──────────────────────────────────────────────────────────────────────

export interface ENCEPPItem {
  item: string
  section: string
  score: number  // 0, 0.5, or 1
  finding: string
}

export interface ImprovementSuggestion {
  section: string
  suggestion: string
}

export interface EvalResult {
  encepp_score: number
  overall_grade: Grade
  encepp_items: ENCEPPItem[]
  judge_narrative: string
  improvement_suggestions: ImprovementSuggestion[]
}

// ── Study List ────────────────────────────────────────────────────────────────

export interface StudyListItem {
  id: string
  drug_name: string
  indication: string
  study_type: StudyType
  status: StudyStatus
  updated_at: string
  sponsor?: string
}

// ── Generate ──────────────────────────────────────────────────────────────────

export interface GenerateResponse {
  sections: Record<string, ProtocolSection>
  code_sets: CodeSets
  flags: ProtocolFlag[]
}

export interface RegenerateResponse {
  content: string
  change_summary: string
}

// ── Methodology ──────────────────────────────────────────────────────────────

export interface MethodologyAlternative {
  id: MethodologyCategory
  display_name: string
  score: number
}

export interface MethodologyRecommendation {
  primary: MethodologyCategory
  primary_display_name: string
  primary_description: string
  confidence_score: number
  reasoning: string
  alternatives: MethodologyAlternative[]
}
