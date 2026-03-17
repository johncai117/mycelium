import { useState } from 'react'
import { Zap } from 'lucide-react'
import type { Protocol, ProtocolSection, RetrievedChunk, EvalResult, CodeSets } from '@/types'
import { SectionNav } from './SectionNav'
import { ProtocolSectionView } from './ProtocolSectionView'
import { ReferencePanel } from './ReferencePanel'
import { EvalPanel } from './EvalPanel'

const SECTION_ORDER = [
  'background', 'objectives', 'study_design', 'study_setting',
  'cohort_definition', 'variables', 'study_size', 'data_analysis',
  'limitations', 'ethics',
]

const EMPTY_SECTION: ProtocolSection = {
  content: '',
  references_used: [],
  confidence: 'low',
  ai_generated: false,
  status: 'ai_generated',
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-600 bg-green-50 border-green-200',
  B: 'text-blue-600 bg-blue-50 border-blue-200',
  C: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  D: 'text-red-600 bg-red-50 border-red-200',
}

interface Props {
  protocol: Protocol
  retrievedChunks: RetrievedChunk[]
  onProtocolChange: (updated: Protocol) => void
}

export function ProtocolDraftViewer({ protocol, retrievedChunks, onProtocolChange }: Props) {
  const [activeSection, setActiveSection] = useState(SECTION_ORDER[0])
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null)
  const [rightTab, setRightTab] = useState<'references' | 'feedback'>('references')

  const updateSection = (key: string, updated: ProtocolSection) => {
    onProtocolChange({
      ...protocol,
      sections: { ...protocol.sections, [key]: updated },
    })
  }

  const updateCodeSets = (codeSets: CodeSets) => {
    onProtocolChange({ ...protocol, code_sets: codeSets })
  }

  const handleNavSelect = (key: string) => {
    setActiveSection(key)
    const el = document.getElementById(`section-${key}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleEvalComplete = (result: EvalResult) => {
    setEvalResult(result)
    setRightTab('feedback')
  }

  return (
    <div className="flex gap-6">
      {/* Left mini-nav */}
      <aside className="hidden lg:block w-44 flex-shrink-0">
        <SectionNav
          sections={protocol.sections}
          activeSection={activeSection}
          onSelect={handleNavSelect}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 space-y-4">
        {SECTION_ORDER.map((key) => {
          const section = protocol.sections[key] ?? EMPTY_SECTION
          return (
            <ProtocolSectionView
              key={key}
              sectionKey={key}
              section={section}
              flags={protocol.flags}
              studyInputs={protocol.study_inputs}
              retrievedChunks={retrievedChunks}
              onUpdate={updateSection}
            />
          )
        })}

        <EvalPanel
          protocol={protocol}
          evalResult={evalResult}
          onEvalComplete={handleEvalComplete}
        />
      </main>

      {/* Right sidebar */}
      <aside className="hidden xl:block w-64 flex-shrink-0">
        <div className="sticky top-20 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setRightTab('references')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                rightTab === 'references'
                  ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/40'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              References
            </button>
            <button
              onClick={() => setRightTab('feedback')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                rightTab === 'feedback'
                  ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/40'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Feedback
              {evalResult && (
                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold leading-none ${GRADE_COLORS[evalResult.overall_grade] ?? GRADE_COLORS.D}`}>
                  {evalResult.overall_grade}
                </span>
              )}
            </button>
          </div>

          {rightTab === 'references' ? (
            <div className="p-4">
              <ReferencePanel
                chunks={retrievedChunks}
                codeSets={protocol.code_sets}
                onCodeSetsChange={updateCodeSets}
              />
            </div>
          ) : (
            <div className="p-4">
              {evalResult ? (
                <div className="space-y-4">
                  {/* Score + Grade */}
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl border px-4 py-2 text-center min-w-[56px] ${GRADE_COLORS[evalResult.overall_grade] ?? GRADE_COLORS.D}`}>
                      <div className="text-2xl font-bold leading-none">{evalResult.overall_grade}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold text-slate-800 leading-none">{evalResult.encepp_score}</div>
                      <div className="text-xs text-slate-400">/ 100 ENCEPP</div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            evalResult.encepp_score >= 90 ? 'bg-green-500' :
                            evalResult.encepp_score >= 80 ? 'bg-blue-500' :
                            evalResult.encepp_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${evalResult.encepp_score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Judge narrative */}
                  {evalResult.judge_narrative && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1.5">Assessment</p>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {evalResult.judge_narrative}
                      </p>
                    </div>
                  )}

                  {/* Improvement suggestions */}
                  {evalResult.improvement_suggestions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <p className="text-xs font-semibold text-slate-600">Suggestions</p>
                      </div>
                      <ol className="space-y-2">
                        {evalResult.improvement_suggestions.map((s, i) => (
                          <li key={i} className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-semibold text-amber-600">{i + 1}. </span>
                            {s.section && <span className="font-medium">{s.section}: </span>}
                            {s.suggestion}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  Run ENCEPP evaluation to see feedback here
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
