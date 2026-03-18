import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, Loader2 } from 'lucide-react'
import type {
  ClarifyQuestion,
  MethodologyRecommendation as MethodologyRec,
  MethodologyCategory,
} from '@/types'
import { MethodologyRecommendation } from './MethodologyRecommendation'

interface Props {
  isLoading: boolean
  isSufficient: boolean
  questions: ClarifyQuestion[]
  answers: Record<string, string>
  onAnswerChange: (field: string, value: string) => void
  requiredAnswered: boolean
  methodologyLoading?: boolean
  methodologyRecommendation?: MethodologyRec | null
  selectedMethodology?: MethodologyCategory | null
  onMethodologySelect?: (methodology: MethodologyCategory, confidence: 'recommended' | 'overridden') => void
}

function QuestionCard({
  question,
  answer,
  onChange,
}: {
  question: ClarifyQuestion
  answer: string
  onChange: (val: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [skipped, setSkipped] = useState(false)

  if (skipped) {
    return (
      <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400 italic">Skipped: {question.question}</span>
          <button
            type="button"
            onClick={() => setSkipped(false)}
            className="text-xs text-blue-600 hover:underline"
          >
            Undo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${
      question.required ? 'border-slate-300' : 'border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {question.required && <span className="text-red-500 text-sm mt-0.5">*</span>}
          <span className="text-sm font-medium text-slate-800">{question.question}</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-600 border-l-2 border-blue-200">
          <span className="font-medium">Why it matters: </span>
          {question.why_it_matters}
        </div>
      )}

      {question.options ? (
        <select
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select an option...</option>
          {question.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}

      {!question.required && (
        <button
          type="button"
          onClick={() => setSkipped(true)}
          className="text-xs text-slate-400 hover:text-slate-600 hover:underline"
        >
          Skip for now
        </button>
      )}
    </div>
  )
}

export function Step4FollowUpQuestions({
  isLoading,
  isSufficient,
  questions,
  answers,
  onAnswerChange,
  methodologyLoading = false,
  methodologyRecommendation = null,
  selectedMethodology = null,
  onMethodologySelect,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-600">Checking your inputs for completeness...</p>
      </div>
    )
  }

  if (isSufficient && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <div className="text-center">
          <p className="font-medium text-slate-800">Inputs look complete</p>
          <p className="text-sm text-slate-500 mt-1">
            You have provided sufficient information to generate a high-quality protocol.
          </p>
        </div>
      </div>
    )
  }

  const requiredQuestions = questions.filter((q) => q.required)
  const optionalQuestions = questions.filter((q) => !q.required)

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-sm text-amber-800">
          <span className="font-medium">A few clarifications needed</span> — please answer the
          required questions below before generating your protocol.
        </p>
      </div>

      {requiredQuestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Required
          </h3>
          {requiredQuestions.map((q) => (
            <QuestionCard
              key={q.field}
              question={q}
              answer={answers[q.field] ?? ''}
              onChange={(val) => onAnswerChange(q.field, val)}
            />
          ))}
        </div>
      )}

      {optionalQuestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Optional — improves protocol quality
          </h3>
          {optionalQuestions.map((q) => (
            <QuestionCard
              key={q.field}
              question={q}
              answer={answers[q.field] ?? ''}
              onChange={(val) => onAnswerChange(q.field, val)}
            />
          ))}
        </div>
      )}

      {onMethodologySelect && (
        <MethodologyRecommendation
          isLoading={methodologyLoading}
          recommendation={methodologyRecommendation}
          selectedMethodology={selectedMethodology}
          onSelect={onMethodologySelect}
        />
      )}
    </div>
  )
}
