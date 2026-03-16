import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { StudyInput, ClarifyQuestion } from '@/types'

export const studyInputSchema = z.object({
  drug_name: z.string().min(1, 'Drug name is required'),
  drug_inn: z.string().optional(),
  indication: z.string().min(1, 'Indication is required'),
  study_type: z.enum(['cohort', 'case_control', 'cross_sectional', 'other']),
  data_source: z.string().optional(),
  comparators: z.array(z.string()).optional(),
  study_period_start: z.string().optional(),
  study_period_end: z.string().optional(),
  geography: z.string().optional(),
  regulatory_context: z.enum(['PASS', 'voluntary', 'investigator_initiated']).optional(),
  sponsor: z.string().optional(),
  primary_outcome: z.string().optional(),
  population_description: z.string().optional(),
  index_date_logic: z.string().optional(),
  washout_days: z.number().min(0).optional(),
  new_user_design: z.boolean().optional(),
  clinical_context: z.string().optional(),
})

export type StudyFormValues = z.infer<typeof studyInputSchema>

export function useStudyForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [clarifyQuestions, setClarifyQuestions] = useState<ClarifyQuestion[]>([])
  const [isSufficient, setIsSufficient] = useState(false)
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<string, string>>({})

  const form = useForm<StudyFormValues>({
    resolver: zodResolver(studyInputSchema),
    defaultValues: {
      study_type: 'cohort',
      washout_days: 180,
      new_user_design: true,
      comparators: [],
    },
  })

  const goToStep = (step: number) => setCurrentStep(step)
  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 4))
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const getStudyInputs = (): StudyInput => {
    const values = form.getValues()
    // Merge clarify answers into study inputs
    const merged: StudyInput = { ...values } as StudyInput
    for (const [field, answer] of Object.entries(clarifyAnswers)) {
      if (answer && field in merged) {
        ;(merged as unknown as Record<string, unknown>)[field] = answer
      }
    }
    return merged
  }

  const requiredQuestionsAnswered = clarifyQuestions
    .filter((q) => q.required)
    .every((q) => clarifyAnswers[q.field]?.trim())

  return {
    form,
    currentStep,
    goToStep,
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
  }
}
