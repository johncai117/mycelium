import { useState } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Zap } from 'lucide-react'
import type { EvalResult, Protocol } from '@/types'
import { evalProtocol } from '@/api'

interface Props {
  protocol: Protocol
  evalResult: EvalResult | null
  onEvalComplete: (result: EvalResult) => void
}

function GradeBadge({ grade }: { grade: string }) {
  const colors = { A: 'text-green-600 bg-green-50', B: 'text-blue-600 bg-blue-50', C: 'text-yellow-600 bg-yellow-50', D: 'text-red-600 bg-red-50' }
  return (
    <span className={`rounded-lg px-3 py-1 text-2xl font-bold ${colors[grade as keyof typeof colors] ?? colors.D}`}>
      {grade}
    </span>
  )
}

function ScoreIcon({ score }: { score: number }) {
  if (score >= 1) return <span className="text-green-500">✓</span>
  if (score >= 0.5) return <span className="text-yellow-500">⚠</span>
  return <span className="text-red-400">✗</span>
}

export function EvalPanel({ protocol, evalResult, onEvalComplete }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNarrative, setShowNarrative] = useState(false)

  const runEval = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await evalProtocol(protocol)
      onEvalComplete(result)
      setIsOpen(true)
    } catch {
      setError('Evaluation failed. Check your API key.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-slate-800">ENCEPP Evaluation</span>
          {evalResult && (
            <span className="text-sm text-slate-600">
              {evalResult.encepp_score}/100 · Grade {evalResult.overall_grade}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); runEval() }}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Scoring...' : evalResult ? 'Re-score' : 'Eval Protocol'}
          </button>
          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {error && <p className="px-5 pb-3 text-xs text-red-500">{error}</p>}

      {isOpen && evalResult && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-5">
          {/* Score summary */}
          <div className="flex items-center gap-4">
            <GradeBadge grade={evalResult.overall_grade} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">
                  {evalResult.encepp_score}/100
                </span>
                <span className="text-xs text-slate-400">ENCEPP checklist</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    evalResult.encepp_score >= 90 ? 'bg-green-500' :
                    evalResult.encepp_score >= 80 ? 'bg-blue-500' :
                    evalResult.encepp_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${evalResult.encepp_score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Per-item table */}
          <div className="overflow-auto max-h-64">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-1 text-left font-medium text-slate-500 pr-2">Item</th>
                  <th className="pb-1 text-center font-medium text-slate-500 w-8">Score</th>
                  <th className="pb-1 text-left font-medium text-slate-500 pl-2">Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {evalResult.encepp_items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-1 text-slate-700 pr-2">{item.item}</td>
                    <td className="py-1 text-center"><ScoreIcon score={item.score} /></td>
                    <td className="py-1 text-slate-500 pl-2">{item.finding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* LLM Judge narrative */}
          {evalResult.judge_narrative && (
            <div>
              <button
                onClick={() => setShowNarrative(!showNarrative)}
                className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                {showNarrative ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                LLM Judge Assessment
              </button>
              {showNarrative && (
                <div className="mt-2 rounded bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {evalResult.judge_narrative}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Improvement suggestions */}
          {evalResult.improvement_suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-slate-700">
                  {evalResult.improvement_suggestions.length} improvement suggestions
                </span>
              </div>
              <ul className="space-y-1.5">
                {evalResult.improvement_suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                    <span className="text-xs text-slate-700 leading-relaxed">
                      {suggestion.section && <span className="font-medium">{suggestion.section}: </span>}
                      {suggestion.suggestion}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
