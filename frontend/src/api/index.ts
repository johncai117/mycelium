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
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Clarify ───────────────────────────────────────────────────────────────────

export async function clarifyInputs(study_inputs: StudyInput): Promise<ClarifyResponse> {
  const { data } = await api.post<ClarifyResponse>('/clarify', { study_inputs })
  return data
}

// ── Retrieve ──────────────────────────────────────────────────────────────────

export async function retrieveProtocols(study_inputs: StudyInput): Promise<RetrievedChunk[]> {
  const { data } = await api.post<RetrievedChunk[]>('/retrieve', { study_inputs })
  return data
}

// ── Generate ──────────────────────────────────────────────────────────────────

export async function generateProtocol(
  study_inputs: StudyInput,
  retrieved_chunks: RetrievedChunk[] = [],
): Promise<GenerateResponse> {
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
  const { data } = await api.post<RegenerateResponse>('/generate/section', {
    ...params,
    retrieved_chunks: params.retrieved_chunks ?? [],
  })
  return data
}

// ── Eval ──────────────────────────────────────────────────────────────────────

export async function evalProtocol(protocol: Protocol): Promise<EvalResult> {
  const { data } = await api.post<EvalResult>('/eval', { protocol })
  return data
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportDocx(protocol: Protocol): Promise<Blob> {
  const response = await api.post('/export/docx', { protocol }, { responseType: 'blob' })
  return response.data as Blob
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

export function updateStudyStatus(id: string, status: StudyListItem['status']): void {
  const studies = loadStudies()
  const idx = studies.findIndex((s) => s.id === id)
  if (idx >= 0) {
    studies[idx].status = status
    studies[idx].updated_at = new Date().toISOString()
    saveStudies(studies)
  }
}
