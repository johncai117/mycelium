import { useState } from 'react'
import { X } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import type { StudyFormValues } from './useStudyForm'

const DATA_SOURCES = [
  'Optum EHR',
  'Optum Clinformatics',
  'IBM MarketScan',
  'IQVIA PharMetrics',
  'TriNetX',
  'Medicare',
  'Medicaid',
  'CPRD',
  'Other',
]

const GEOGRAPHIES = ['US', 'EU', 'Both', 'Other']
const REGULATORY_CONTEXTS = [
  { value: 'PASS', label: 'PASS (Post-Authorization Safety Study)' },
  { value: 'voluntary', label: 'Voluntary / Non-interventional' },
  { value: 'investigator_initiated', label: 'Investigator-Initiated' },
]

interface Props {
  form: UseFormReturn<StudyFormValues>
}

export function Step2DesignDetails({ form }: Props) {
  const { register, watch, setValue } = form
  const [comparatorInput, setComparatorInput] = useState('')
  const comparators = watch('comparators') ?? []
  const dataSource = watch('data_source') ?? ''

  const addComparator = () => {
    const trimmed = comparatorInput.trim()
    if (trimmed && !comparators.includes(trimmed)) {
      setValue('comparators', [...comparators, trimmed])
      setComparatorInput('')
    }
  }

  const removeComparator = (tag: string) => {
    setValue('comparators', comparators.filter((c) => c !== tag))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Data Source</label>
        <p className="text-xs text-slate-400">
          Select the database(s) that will be used for this study
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DATA_SOURCES.map((source) => (
            <label key={source} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="data_source"
                value={source}
                checked={dataSource === source}
                onChange={() => setValue('data_source', source)}
                className="text-blue-600"
              />
              <span className="text-sm text-slate-700">{source}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Comparators</label>
        <p className="text-xs text-slate-400">
          Type a comparator drug or group and press Enter to add
        </p>
        <div className="flex gap-2">
          <input
            value={comparatorInput}
            onChange={(e) => setComparatorInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addComparator() } }}
            placeholder="e.g., Methotrexate"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addComparator}
            className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium hover:bg-slate-200"
          >
            Add
          </button>
        </div>
        {comparators.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {comparators.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
              >
                {tag}
                <button type="button" onClick={() => removeComparator(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Study Period Start</label>
          <input
            {...register('study_period_start')}
            type="date"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Study Period End</label>
          <input
            {...register('study_period_end')}
            type="date"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Geography</label>
          <select
            {...register('geography')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {GEOGRAPHIES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Regulatory Context</label>
          <select
            {...register('regulatory_context')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {REGULATORY_CONTEXTS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Sponsor <span className="text-xs text-slate-400">(optional)</span>
        </label>
        <input
          {...register('sponsor')}
          placeholder="e.g., Pfizer Inc."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
