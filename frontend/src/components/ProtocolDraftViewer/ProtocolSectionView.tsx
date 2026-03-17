import { useState } from 'react'
import { Edit2, Check, X, AlertTriangle, RefreshCw } from 'lucide-react'
import type { ProtocolSection, ProtocolFlag, StudyInput, RetrievedChunk } from '@/types'
import { regenerateSection } from '@/api'

const SECTION_TITLES: Record<string, string> = {
  background: '1. Background and Rationale',
  objectives: '2. Study Objectives',
  study_design: '3. Study Design',
  study_setting: '4. Study Setting and Data Source',
  cohort_definition: '5. Cohort Definition',
  variables: '6. Variables',
  study_size: '7. Study Size',
  data_analysis: '8. Data Analysis',
  limitations: '9. Limitations',
  ethics: '10. Ethical Considerations',
}

function ConfidenceBadge({ level }: { level: string }) {
  const colors = {
    high: 'text-green-700',
    medium: 'text-yellow-700',
    low: 'text-orange-700',
  }
  const dots = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-orange-500',
  }
  const l = level as keyof typeof colors
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${colors[l] ?? colors.medium}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[l] ?? dots.medium}`} />
      {level} confidence
    </span>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const map = {
    approved: 'text-green-700',
    edited: 'text-blue-700',
    ai_generated: 'text-slate-500',
  }
  const label = { approved: 'Approved', edited: 'Edited', ai_generated: 'AI-generated' }
  const s = (status ?? 'ai_generated') as keyof typeof map
  return (
    <span className={`text-xs ${map[s]}`}>
      {label[s]}
    </span>
  )
}

interface DiffViewProps {
  oldText: string
  newText: string
}
function DiffView({ oldText, newText }: DiffViewProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
      <div className="rounded border border-red-200 bg-red-50 p-3">
        <p className="font-medium text-red-700 mb-1">Previous</p>
        <p className="text-slate-700 whitespace-pre-wrap">{oldText}</p>
      </div>
      <div className="rounded border border-green-200 bg-green-50 p-3">
        <p className="font-medium text-green-700 mb-1">Revised</p>
        <p className="text-slate-700 whitespace-pre-wrap">{newText}</p>
      </div>
    </div>
  )
}

interface Props {
  sectionKey: string
  section: ProtocolSection
  flags: ProtocolFlag[]
  studyInputs: StudyInput
  retrievedChunks: RetrievedChunk[]
  onUpdate: (key: string, updated: ProtocolSection) => void
}

export function ProtocolSectionView({
  sectionKey,
  section,
  flags,
  studyInputs,
  retrievedChunks,
  onUpdate,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(section.content)
  const [comment, setComment] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [diffOld, setDiffOld] = useState<string | null>(null)
  const [diffNew, setDiffNew] = useState<string | null>(null)
  const [changeSummary, setChangeSummary] = useState<string | null>(null)

  const sectionFlags = flags.filter(
    (f) => f.section === sectionKey && f.severity === 'requires_judgment',
  )

  const handleEdit = () => {
    setEditContent(section.content)
    setComment('')
    setDiffOld(null)
    setDiffNew(null)
    setChangeSummary(null)
    setEditing(true)
  }

  const handleSave = () => {
    onUpdate(sectionKey, { ...section, content: editContent, status: 'edited', ai_generated: false })
    setEditing(false)
  }

  const handleCancel = () => {
    setEditing(false)
    setDiffOld(null)
    setDiffNew(null)
  }

  const handleRegenerate = async () => {
    if (!comment.trim()) return
    setIsRegenerating(true)
    setRegenError(null)
    setDiffOld(null)
    setDiffNew(null)
    try {
      const result = await regenerateSection({
        section_id: sectionKey,
        current_content: editContent,
        researcher_comment: comment,
        study_inputs: studyInputs,
        retrieved_chunks: retrievedChunks,
      })
      setDiffOld(editContent)
      setDiffNew(result.content)
      setChangeSummary(result.change_summary)
      setEditContent(result.content)
      onUpdate(sectionKey, { ...section, content: result.content, status: 'edited', ai_generated: true })
    } catch {
      setRegenError('Regeneration failed. Check your API key and try again.')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleApprove = () => {
    onUpdate(sectionKey, { ...section, status: 'approved' })
  }

  return (
    <div id={`section-${sectionKey}`} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header row: title + action group */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="text-base font-semibold text-slate-800">
          {SECTION_TITLES[sectionKey] ?? sectionKey}
        </h2>

        {/* Actions — pill-shaped button group */}
        {!editing && (
          <div className="flex items-center flex-shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-1 gap-1">
            {section.status !== 'approved' && (
              <button
                onClick={handleApprove}
                className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 flex items-center gap-1"
              >
                <Check className="h-3 w-3" />Approve
              </button>
            )}
            <button
              onClick={handleEdit}
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:border-slate-300 hover:text-slate-800 flex items-center gap-1"
            >
              <Edit2 className="h-3 w-3" />Edit
            </button>
          </div>
        )}
      </div>

      {/* Signals row — metadata byline under the title */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
        <ConfidenceBadge level={section.confidence} />
        <span className="text-slate-300 text-xs">·</span>
        <StatusBadge status={section.status} />
        {sectionFlags.map((f) => (
          <span key={f.message} className="inline-flex items-center gap-1 text-xs text-orange-600">
            <span className="text-slate-300">·</span>
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            {f.message}
          </span>
        ))}
      </div>

      {/* Content */}
      {!editing ? (
        <div className="space-y-3">
          {section.content ? (
            section.content.split('\n\n').map((para, i) => (
              para.trim() && <p key={i} className="text-sm text-slate-700 leading-relaxed">{para}</p>
            ))
          ) : (
            <p className="text-sm text-slate-400 italic">Click Edit to add content...</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={10}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Comment for AI (what should change?)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="e.g., Add more detail about the washout period rationale and cite the EMA guidance..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {regenError && (
            <p className="text-xs text-red-500">{regenError}</p>
          )}

          {changeSummary && (
            <div className="rounded bg-blue-50 border border-blue-200 px-3 py-2">
              <p className="text-xs text-blue-700">{changeSummary}</p>
            </div>
          )}

          {diffOld && diffNew && (
            <DiffView oldText={diffOld} newText={diffNew} />
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              disabled={!comment.trim() || isRegenerating}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              Save Edits
            </button>
            <button
              onClick={handleCancel}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              <X className="inline h-3 w-3 mr-0.5" />Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
