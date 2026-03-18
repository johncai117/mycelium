// ── Study Input ──────────────────────────────────────────────────────────────

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
