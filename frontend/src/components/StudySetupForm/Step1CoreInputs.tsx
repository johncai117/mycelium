import { useState, useRef } from 'react'
import { Upload, CheckCircle, X, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import type { StudyFormValues } from './useStudyForm'
import type { RegulatoryDocExtracted } from '@/types'
import { uploadRegulatoryDoc, uploadProtocolTemplate } from '@/api'

// ── Constants ─────────────────────────────────────────────────────────────────

const STUDY_TYPES = [
  {
    value: 'cohort',
    label: 'Cohort',
    description: 'Follow exposed and unexposed groups forward in time to compare outcome rates.',
  },
  {
    value: 'case_control',
    label: 'Case-Control',
    description: 'Compare exposure history between cases (with outcome) and matched controls.',
  },
  {
    value: 'cross_sectional',
    label: 'Cross-Sectional',
    description: 'Assess exposure and outcome at a single point in time. No follow-up.',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Self-controlled case series, target trial emulation, or other design.',
  },
]

const REGULATORY_REQUIREMENT_OPTIONS = [
  'PASS — EMA Category 1 (imposed)',
  'PASS — EMA Category 3 (voluntary)',
  'FDA PMR — FDAAA Safety Study/Trial (505(o))',
  'FDA PMR — PREA Pediatric Study',
  'FDA PMR — Cardiovascular Outcomes Trial (CVOT)',
  'FDA PMC — 506B Reportable (voluntary commitment)',
  'Non-Interventional Study (NIS) — non-regulatory',
  'Registry-based case series',
  'Database linkage / claims-based cohort study',
  'REMS-required study',
  'Other',
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  form: UseFormReturn<StudyFormValues>
  onRegulatoryDocConfirmed: (data: RegulatoryDocExtracted) => void
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DropZone({
  accept,
  label,
  hint,
  onFile,
  isLoading,
  uploadedName,
}: {
  accept: string
  label: string
  hint: string
  onFile: (file: File) => void
  isLoading: boolean
  uploadedName: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      onClick={() => !isLoading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : uploadedName
          ? 'border-green-400 bg-green-50'
          : 'border-slate-300 bg-slate-50 hover:border-slate-400'
      } ${isLoading ? 'pointer-events-none opacity-70' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
      {isLoading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      ) : uploadedName ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <Upload className="h-5 w-5 text-slate-400" />
      )}
      <div>
        <p className="text-sm font-medium text-slate-700">
          {isLoading ? 'Processing…' : uploadedName ?? label}
        </p>
        {!isLoading && !uploadedName && (
          <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
        )}
      </div>
    </div>
  )
}

function ExtractionCard({
  data,
  onConfirm,
  onDiscard,
}: {
  data: RegulatoryDocExtracted
  onConfirm: () => void
  onDiscard: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">Extracted Regulatory Information</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-blue-500 hover:text-blue-700"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onDiscard} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 text-xs text-slate-700">
          {data.applicant_name && (
            <Row label="Sponsor" value={data.applicant_name} />
          )}
          {data.application_number && (
            <Row label="Application No." value={data.application_number} />
          )}
          {data.requirement_type && (
            <Row label="Requirement type" value={data.requirement_type} />
          )}
          {data.safety_signal && (
            <Row label="Safety signal" value={data.safety_signal} />
          )}
          {data.study_description && (
            <Row label="Study requirement" value={data.study_description} />
          )}
          {data.scientific_justification && (
            <Row label="Justification" value={data.scientific_justification} />
          )}
          {data.milestones && data.milestones.length > 0 && (
            <div>
              <span className="font-medium text-slate-600">Milestones: </span>
              {data.milestones.map((m, i) => (
                <span key={i} className="after:content-['·'] after:mx-1 last:after:content-none">
                  {m.name}{m.date ? ` (${m.date})` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Confirm & pre-populate fields
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          Discard
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-medium text-slate-600">{label}: </span>
      <span>{value}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function Step1CoreInputs({ form, onRegulatoryDocConfirmed }: Props) {
  const { register, watch, setValue, formState: { errors } } = form
  const studyType = watch('study_type')
  const regulatoryReqTypes = watch('regulatory_requirement_types') ?? []

  // "Other" free-text for regulatory requirements
  const [otherText, setOtherText] = useState('')

  // Regulatory document upload state
  const [regDocLoading, setRegDocLoading] = useState(false)
  const [regDocError, setRegDocError] = useState<string | null>(null)
  const [regDocFilename, setRegDocFilename] = useState<string | null>(null)
  const [regDocExtracted, setRegDocExtracted] = useState<RegulatoryDocExtracted | null>(null)
  const [regDocConfirmed, setRegDocConfirmed] = useState(false)

  // Protocol template upload state
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [templateFilename, setTemplateFilename] = useState<string | null>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggleRequirementType = (option: string) => {
    const current = regulatoryReqTypes
    if (option === 'Other') {
      if (current.some((v) => v === 'Other' || v.startsWith('Other:'))) {
        setValue(
          'regulatory_requirement_types',
          current.filter((v) => v !== 'Other' && !v.startsWith('Other:')),
        )
        setOtherText('')
      } else {
        setValue('regulatory_requirement_types', [...current, 'Other'])
      }
    } else {
      setValue(
        'regulatory_requirement_types',
        current.includes(option)
          ? current.filter((v) => v !== option)
          : [...current, option],
      )
    }
  }

  const isChecked = (option: string) => {
    if (option === 'Other') {
      return regulatoryReqTypes.some((v) => v === 'Other' || v.startsWith('Other:'))
    }
    return regulatoryReqTypes.includes(option)
  }

  const handleOtherTextChange = (text: string) => {
    setOtherText(text)
    const withoutOther = regulatoryReqTypes.filter(
      (v) => v !== 'Other' && !v.startsWith('Other:'),
    )
    setValue(
      'regulatory_requirement_types',
      text.trim() ? [...withoutOther, `Other: ${text.trim()}`] : [...withoutOther, 'Other'],
    )
  }

  const handleRegDocFile = async (file: File) => {
    setRegDocLoading(true)
    setRegDocError(null)
    setRegDocExtracted(null)
    setRegDocConfirmed(false)
    setRegDocFilename(file.name)
    try {
      const result = await uploadRegulatoryDoc(file)
      setRegDocExtracted(result)
    } catch {
      setRegDocError('Could not process the document. Please check it is a readable PDF.')
      setRegDocFilename(null)
    } finally {
      setRegDocLoading(false)
    }
  }

  const handleConfirmExtraction = () => {
    if (!regDocExtracted) return
    // Pre-populate form fields from extracted data
    if (regDocExtracted.applicant_name) setValue('sponsor', regDocExtracted.applicant_name)
    if (regDocExtracted.safety_signal) setValue('primary_outcome', regDocExtracted.safety_signal)
    // Pass confirmed data up to parent (for merging into StudyInput)
    onRegulatoryDocConfirmed(regDocExtracted)
    setRegDocConfirmed(true)
  }

  const handleDiscardExtraction = () => {
    setRegDocExtracted(null)
    setRegDocFilename(null)
    setRegDocConfirmed(false)
  }

  const handleTemplateFile = async (file: File) => {
    setTemplateLoading(true)
    setTemplateError(null)
    setTemplateFilename(null)
    try {
      const result = await uploadProtocolTemplate(file)
      setValue('protocol_template_id', result.template_id)
      setTemplateFilename(result.filename)
    } catch {
      setTemplateError('Could not upload template. Please ensure it is a valid .docx file.')
    } finally {
      setTemplateLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Drug name + INN */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Drug Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('drug_name')}
            placeholder="e.g., Tofacitinib"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.drug_name && (
            <p className="text-xs text-red-500">{errors.drug_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            INN / Generic Name
            <span className="ml-1 text-xs text-slate-400">(optional)</span>
          </label>
          <input
            {...register('drug_inn')}
            placeholder="e.g., tofacitinib citrate"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Indication */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Indication / Disease <span className="text-red-500">*</span>
        </label>
        <input
          {...register('indication')}
          placeholder="e.g., Rheumatoid Arthritis"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.indication && (
          <p className="text-xs text-red-500">{errors.indication.message}</p>
        )}
        <p className="text-xs text-slate-400">
          Enter the primary condition or disease being studied
        </p>
      </div>

      {/* Study design */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Study Design <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {STUDY_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setValue('study_type', type.value as StudyFormValues['study_type'])}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                studyType === type.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-sm text-slate-800">{type.label}</div>
              <div className="mt-1 text-xs text-slate-500 leading-snug">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Regulatory Requirement of Study ─────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Regulatory Requirement of Study
          <span className="ml-1 text-xs text-slate-400">(select all that apply)</span>
        </label>
        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
          {REGULATORY_REQUIREMENT_OPTIONS.map((option) => (
            <div key={option}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked(option)}
                  onChange={() => toggleRequirementType(option)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 leading-snug">{option}</span>
              </label>
              {option === 'Other' && isChecked('Other') && (
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => handleOtherTextChange(e.target.value)}
                  placeholder="Describe the regulatory requirement…"
                  className="mt-1.5 ml-6 w-[calc(100%-1.5rem)] rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Regulatory Requirement Document Upload ──────────────────────────── */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Upload Regulatory Requirement Document
          <span className="ml-1 text-xs text-slate-400">(optional)</span>
        </label>
        <p className="text-xs text-slate-500">
          PMR/PMC letter, PASS obligation, or RMP extract — PDF only. Fields will be extracted automatically.
        </p>

        {!regDocConfirmed && (
          <DropZone
            accept=".pdf,application/pdf"
            label="Drag & drop PDF or click to browse"
            hint="PMR letter · PASS obligation · RMP extract"
            onFile={handleRegDocFile}
            isLoading={regDocLoading}
            uploadedName={regDocFilename}
          />
        )}

        {regDocError && (
          <p className="text-xs text-red-500">{regDocError}</p>
        )}

        {regDocExtracted && !regDocConfirmed && (
          <ExtractionCard
            data={regDocExtracted}
            onConfirm={handleConfirmExtraction}
            onDiscard={handleDiscardExtraction}
          />
        )}

        {regDocConfirmed && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-xs text-green-700">
              Regulatory document confirmed — fields pre-populated.
            </span>
            <button
              type="button"
              onClick={handleDiscardExtraction}
              className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* ── Protocol Format Template Upload ─────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Upload Protocol Format Template
          <span className="ml-1 text-xs text-slate-400">(optional)</span>
        </label>
        <p className="text-xs text-slate-500">
          Word .docx preferred. Don't have a template? The system will apply a standard ENCEPP-compatible layout.
        </p>

        <DropZone
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          label="Drag & drop .docx or click to browse"
          hint="Word template · .docx only"
          onFile={handleTemplateFile}
          isLoading={templateLoading}
          uploadedName={templateFilename}
        />

        {templateError && (
          <p className="text-xs text-red-500">{templateError}</p>
        )}
      </div>
    </div>
  )
}
