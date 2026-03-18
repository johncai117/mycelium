import { useState } from 'react'
import { ChevronDown, FlaskConical, Loader2 } from 'lucide-react'
import type {
  MethodologyRecommendation as MethodologyRec,
  MethodologyCategory,
} from '@/types'

const ALL_METHODOLOGIES: { id: MethodologyCategory; label: string }[] = [
  { id: 'acnu', label: 'Active Comparator New-User (ACNU) Cohort' },
  { id: 'prevalent_user', label: 'Prevalent User Cohort' },
  { id: 'descriptive_cohort', label: 'Descriptive Cohort (Single-Arm)' },
  { id: 'nested_case_control', label: 'Nested Case-Control' },
  { id: 'population_case_control', label: 'Population-Based Case-Control' },
  { id: 'sccs', label: 'Self-Controlled Case Series (SCCS)' },
  { id: 'case_crossover', label: 'Case-Crossover' },
  { id: 'cross_sectional', label: 'Cross-Sectional Prevalence Study' },
  { id: 'drug_utilization', label: 'Drug Utilization Study (DUS)' },
  { id: 'prospective_registry', label: 'Prospective Registry' },
  { id: 'pregnancy_registry', label: 'Pregnancy Safety Registry' },
  { id: 'survey', label: 'HCP/Patient Survey' },
]

interface Props {
  isLoading: boolean
  recommendation: MethodologyRec | null
  selectedMethodology: MethodologyCategory | null
  onSelect: (methodology: MethodologyCategory, confidence: 'recommended' | 'overridden') => void
}

export function MethodologyRecommendation({
  isLoading,
  recommendation,
  selectedMethodology,
  onSelect,
}: Props) {
  const [showOverride, setShowOverride] = useState(false)

  if (isLoading) {
    return (
      <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing study parameters to recommend a methodology...
        </div>
      </div>
    )
  }

  if (!recommendation) return null

  const isAccepted = selectedMethodology === recommendation.primary
  const isOverridden = selectedMethodology && selectedMethodology !== recommendation.primary

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Recommended Methodology
        </h3>
      </div>

      {/* Primary recommendation */}
      <div
        className={`rounded-lg border-2 p-4 transition-colors ${
          isAccepted
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800">
                {recommendation.primary_display_name}
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {Math.round(recommendation.confidence_score * 100)}% match
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {recommendation.primary_description}
            </p>
            <p className="mt-2 text-xs text-slate-500 italic">
              {recommendation.reasoning}
            </p>
          </div>
          {!isAccepted && (
            <button
              type="button"
              onClick={() => onSelect(recommendation.primary, 'recommended')}
              className="flex-shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Accept
            </button>
          )}
          {isAccepted && (
            <span className="flex-shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">
              Selected
            </span>
          )}
        </div>

        {/* Confidence bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all"
              style={{ width: `${recommendation.confidence_score * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alternatives */}
      {recommendation.alternatives.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {recommendation.alternatives.map((alt) => (
            <button
              key={alt.id}
              type="button"
              onClick={() => onSelect(alt.id as MethodologyCategory, 'overridden')}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selectedMethodology === alt.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{alt.display_name}</span>
                <span className="text-xs text-slate-400">{Math.round(alt.score * 100)}%</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Override */}
      <div>
        <button
          type="button"
          onClick={() => setShowOverride(!showOverride)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showOverride ? 'rotate-180' : ''}`}
          />
          Use a different methodology
        </button>
        {showOverride && (
          <select
            value={isOverridden ? (selectedMethodology ?? '') : ''}
            onChange={(e) => {
              if (e.target.value) {
                onSelect(e.target.value as MethodologyCategory, 'overridden')
                setShowOverride(false)
              }
            }}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a methodology...</option>
            {ALL_METHODOLOGIES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
