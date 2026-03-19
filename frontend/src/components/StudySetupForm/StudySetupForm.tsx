import { useState } from 'react'
import { Check } from 'lucide-react'
import { useStudyForm } from './useStudyForm'
import { Step1CoreInputs } from './Step1CoreInputs'
import { Step2DesignDetails } from './Step2DesignDetails'
import { Step3ClinicalContext } from './Step3ClinicalContext'
import { Step4FollowUpQuestions } from './Step4FollowUpQuestions'
import { clarifyInputs, recommendMethodology } from '@/api'
import type { StudyInput } from '@/types'
import { EXAMPLE_STUDY_INPUT } from '@/data/exampleStudies'

const STEPS = [
  { number: 1, label: 'Core Inputs' },
  { number: 2, label: 'Study Design' },
  { number: 3, label: 'Clinical Context' },
  { number: 4, label: 'Review & Generate' },
]

interface Props {
  onSubmit: (inputs: StudyInput) => void
  isGenerating: boolean
}

export function StudySetupForm({ onSubmit, isGenerating }: Props) {
  const {
    form,
    currentStep,
    nextStep,
    prevStep,
    clarifyQuestions,
    setClarifyQuestions,
    isSufficient,
    setIsSufficient,
    clarifyAnswers,
    setClarifyAnswers,
    getStudyInputs,
    requiredQuestionsAnswered,
    methodologyRecommendation,
    setMethodologyRecommendation,
    selectedMethodology,
    selectMethodology,
    setRegulatoryDocExtracted,
  } = useStudyForm()

  const [clarifyLoading, setClarifyLoading] = useState(false)
  const [clarifyError, setClarifyError] = useState<string | null>(null)
  const [methodologyLoading, setMethodologyLoading] = useState(false)

  const handleNext = async () => {
    if (currentStep === 3) {
      // Trigger clarify call before going to step 4
      setClarifyLoading(true)
      setClarifyError(null)
      try {
        const inputs = getStudyInputs()
        const result = await clarifyInputs(inputs)
        setClarifyQuestions(result.questions)
        setIsSufficient(result.is_sufficient)

        // Trigger methodology recommendation in parallel
        setMethodologyLoading(true)
        recommendMethodology(inputs)
          .then((rec) => setMethodologyRecommendation(rec))
          .catch(() => {})
          .finally(() => setMethodologyLoading(false))
      } catch {
        setClarifyError('Could not reach the server. You can still generate with current inputs.')
        setIsSufficient(true)
      } finally {
        setClarifyLoading(false)
      }
    }
    nextStep()
  }

  const handleSubmit = () => {
    const inputs = getStudyInputs()
    onSubmit(inputs)
  }

  const canProceed = () => {
    if (currentStep === 1) {
      const { drug_name, indication } = form.getValues()
      return !!(drug_name?.trim() && indication?.trim())
    }
    if (currentStep === 4) {
      return requiredQuestionsAnswered || isSufficient
    }
    return true
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Load example study */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => form.reset(EXAMPLE_STUDY_INPUT)}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          📋 Load example study
        </button>
        <span className="text-xs text-slate-500">Loads a pre-filled semaglutide cardiovascular outcomes study</span>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, i) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  currentStep > step.number
                    ? 'bg-blue-600 text-white'
                    : currentStep === step.number
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  currentStep === step.number ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px] max-h-[60vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-slate-800 mb-5">
          {STEPS[currentStep - 1].label}
        </h2>

        {currentStep === 1 && (
          <Step1CoreInputs
            form={form}
            onRegulatoryDocConfirmed={setRegulatoryDocExtracted}
          />
        )}
        {currentStep === 2 && <Step2DesignDetails form={form} />}
        {currentStep === 3 && <Step3ClinicalContext form={form} />}
        {currentStep === 4 && (
          <Step4FollowUpQuestions
            isLoading={clarifyLoading}
            isSufficient={isSufficient}
            questions={clarifyQuestions}
            answers={clarifyAnswers}
            onAnswerChange={(field, val) =>
              setClarifyAnswers((prev) => ({ ...prev, [field]: val }))
            }
            requiredAnswered={requiredQuestionsAnswered}
            methodologyLoading={methodologyLoading}
            methodologyRecommendation={methodologyRecommendation}
            selectedMethodology={selectedMethodology}
            onMethodologySelect={selectMethodology}
          />
        )}

        {clarifyError && (
          <p className="mt-3 text-xs text-amber-600">{clarifyError}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceed() || isGenerating}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating Protocol...
              </>
            ) : (
              'Generate Protocol'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
