import type { UseFormReturn } from 'react-hook-form'
import type { StudyFormValues } from './useStudyForm'
import { HelpCircle } from 'lucide-react'

interface TooltipProps { text: string }
function Tooltip({ text }: TooltipProps) {
  return (
    <span className="group relative inline-block">
      <HelpCircle className="inline h-3.5 w-3.5 text-slate-400 cursor-help" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity w-56 text-center">
        {text}
      </span>
    </span>
  )
}

interface Props {
  form: UseFormReturn<StudyFormValues>
}

export function Step3ClinicalContext({ form }: Props) {
  const { register, watch, setValue } = form
  const newUserDesign = watch('new_user_design') ?? true

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Primary Outcome{' '}
          <Tooltip text="The primary outcome drives the entire analysis plan. Be specific: e.g., 'Hospitalized heart failure defined by primary discharge diagnosis code ICD-10 I50.x'" />
        </label>
        <input
          {...register('primary_outcome')}
          placeholder="e.g., Major adverse cardiovascular events (MACE)"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Population Description{' '}
          <Tooltip text="Describe the target population in clinical terms: age, disease severity, treatment history, care setting." />
        </label>
        <textarea
          {...register('population_description')}
          rows={3}
          placeholder="e.g., Adults ≥18 years with moderate-to-severe rheumatoid arthritis who have had an inadequate response to conventional DMARDs..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Index Date Logic{' '}
          <Tooltip text="Defines time zero for each subject. The index date anchors all cohort entry criteria, follow-up, and baseline covariate assessment." />
        </label>
        <input
          {...register('index_date_logic')}
          placeholder="e.g., First dispensing of tofacitinib with no prior use in 180-day washout period"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-400">
          Example: "First fill of [drug] with 180-day washout prior to cohort entry"
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Clinical Context / Additional Notes{' '}
          <Tooltip text="Any additional information that helps contextualize this study: known safety signals, prior studies, regulatory background, risk management plan details." />
        </label>
        <textarea
          {...register('clinical_context')}
          rows={4}
          placeholder="e.g., This study is required under EMA PASS condition following approval of tofacitinib for RA. The EMA has requested evaluation of VTE risk following the 2019 safety review..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="rounded-lg border border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-700">
              New-User Design{' '}
              <Tooltip text="Restricts the study cohort to patients initiating therapy for the first time (no prior use during the washout period). Recommended for most pharmacoepidemiology studies to avoid prevalent user bias." />
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Recommended — eliminates prevalent user bias
            </div>
          </div>
          <button
            type="button"
            onClick={() => setValue('new_user_design', !newUserDesign)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              newUserDesign ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                newUserDesign ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {newUserDesign && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Washout Period (days){' '}
              <Tooltip text="Duration of drug-free look-back period required for cohort entry. 180 days is the standard for most PASS studies." />
            </label>
            <input
              {...register('washout_days', { valueAsNumber: true })}
              type="number"
              min={0}
              max={730}
              className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400">Default: 180 days</p>
          </div>
        )}
      </div>
    </div>
  )
}
