import type { UseFormReturn } from 'react-hook-form'
import type { StudyFormValues } from './useStudyForm'

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

interface Props {
  form: UseFormReturn<StudyFormValues>
}

export function Step1CoreInputs({ form }: Props) {
  const { register, watch, setValue, formState: { errors } } = form
  const studyType = watch('study_type')

  return (
    <div className="space-y-6">
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
    </div>
  )
}
