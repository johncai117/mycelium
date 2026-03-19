import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, X, ExternalLink, ChevronDown, Loader2 } from 'lucide-react'
import { DATA_SOURCES, SOURCE_TYPES, CARE_SETTINGS, COUNTRIES, CODING_VOCABS } from '@/data/dataSourceCatalog'
import { generateProtocol, retrieveProtocols, createStudy, saveProtocol } from '@/api'
import type { StudyInput, Protocol, EMADataSource } from '@/types'

// ── Capability badge helpers ──────────────────────────────────────────────────

interface CapBadge {
  label: string
  key: keyof EMADataSource
}

const CAPABILITY_BADGES: CapBadge[] = [
  { label: 'Dx codes', key: 'diagnostic_codes' },
  { label: 'Rx', key: 'prescriptions' },
  { label: 'Dispensing', key: 'dispensing' },
  { label: 'Hospital', key: 'hospital_admissions' },
  { label: 'Cause of death', key: 'cause_of_death' },
  { label: 'Lab/clinical', key: 'clinical_measurements' },
  { label: 'PROs', key: 'pro_data' },
  { label: 'Linkage', key: 'linkage_available' },
]

function isYes(val: string | null): boolean {
  return val?.toLowerCase() === 'yes'
}

// ── Filter state ──────────────────────────────────────────────────────────────

interface Filters {
  search: string
  type: string
  country: string
  vocab: string
  care_setting: string
}

// ── Source card ───────────────────────────────────────────────────────────────

interface SourceCardProps {
  source: EMADataSource
  selected: boolean
  onToggle: (name: string) => void
  selectionCount: number
}

function SourceCard({ source, selected, onToggle, selectionCount }: SourceCardProps) {
  const canSelect = selected || selectionCount < 3

  return (
    <div
      className={`relative rounded-xl border bg-white p-4 shadow-sm transition-all cursor-pointer ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : canSelect
          ? 'border-slate-200 hover:border-blue-300 hover:shadow-md'
          : 'border-slate-200 opacity-50 cursor-not-allowed'
      }`}
      onClick={() => canSelect && onToggle(source.name)}
    >
      {/* Selection indicator */}
      <div
        className={`absolute top-3 right-3 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          selected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
        }`}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>

      {/* Header */}
      <div className="pr-8">
        <h3 className="text-sm font-semibold text-slate-800 leading-snug">{source.name}</h3>
        {source.acronym && (
          <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
            {source.acronym}
          </span>
        )}
      </div>

      {/* Type + countries */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {source.type && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {source.type}
          </span>
        )}
        {source.countries && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full truncate max-w-[180px]" title={source.countries}>
            {source.countries.length > 30 ? source.countries.slice(0, 28) + '…' : source.countries}
          </span>
        )}
      </div>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1">
        {CAPABILITY_BADGES.map((badge) => {
          const has = isYes(source[badge.key] as string | null)
          if (!has) return null
          return (
            <span
              key={badge.key}
              className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded"
            >
              ✓ {badge.label}
            </span>
          )
        })}
      </div>

      {/* Coding vocabularies */}
      {(source.dx_vocabulary || source.rx_vocabulary || source.drug_vocabulary) && (
        <div className="mt-2">
          <p className="text-xs text-slate-400 mb-0.5">Vocabularies</p>
          <p className="text-xs text-slate-600">
            {[source.dx_vocabulary, source.rx_vocabulary, source.drug_vocabulary]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      )}

      {/* Data span + population */}
      <div className="mt-2 flex gap-4 text-xs text-slate-500">
        {(source.data_from || source.data_to) && (
          <span>
            {source.data_from ?? '?'} – {source.data_to ?? 'present'}
          </span>
        )}
        {source.population_size && (
          <span>~{Number(source.population_size).toLocaleString()} pts</span>
        )}
      </div>

      {/* Badges row: DARWIN + CDM */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {isYes(source.darwin_eu_partner) && (
          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
            DARWIN EU
          </span>
        )}
        {isYes(source.cdm_mapped) && (
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-medium">
            CDM {source.cdm_version ?? ''}
          </span>
        )}
        {source.website && (
          <a
            href={source.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 ml-auto"
          >
            <ExternalLink className="h-3 w-3" /> Website
          </a>
        )}
      </div>
    </div>
  )
}

// ── Comparison panel ──────────────────────────────────────────────────────────

interface ComparisonRow {
  label: string
  get: (s: EMADataSource) => string
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'Type', get: (s) => s.type ?? '—' },
  { label: 'Countries', get: (s) => s.countries ?? '—' },
  { label: 'Care setting', get: (s) => s.care_setting ?? '—' },
  { label: 'Data span', get: (s) => `${s.data_from ?? '?'} – ${s.data_to ?? 'present'}` },
  { label: 'Population', get: (s) => s.population_size ? Number(s.population_size).toLocaleString() : '—' },
  { label: 'Dx codes', get: (s) => isYes(s.diagnostic_codes) ? `✓ ${s.dx_vocabulary ?? ''}` : '—' },
  { label: 'Prescriptions', get: (s) => isYes(s.prescriptions) ? `✓ ${s.rx_vocabulary ?? ''}` : '—' },
  { label: 'Dispensing', get: (s) => isYes(s.dispensing) ? '✓' : '—' },
  { label: 'Hospital admissions', get: (s) => isYes(s.hospital_admissions) ? '✓' : '—' },
  { label: 'Cause of death', get: (s) => isYes(s.cause_of_death) ? `✓ ${s.cod_vocabulary ?? ''}` : '—' },
  { label: 'Lab / clinical', get: (s) => isYes(s.clinical_measurements) ? '✓' : '—' },
  { label: 'PRO data', get: (s) => isYes(s.pro_data) ? '✓' : '—' },
  { label: 'Linkage', get: (s) => isYes(s.linkage_available) ? `✓ ${s.linked_sources ?? ''}` : '—' },
  { label: 'CDM mapped', get: (s) => isYes(s.cdm_mapped) ? `✓ ${s.cdm_version ?? ''}` : '—' },
  { label: 'DARWIN EU', get: (s) => isYes(s.darwin_eu_partner) ? '✓' : '—' },
  { label: 'Median obs. years', get: (s) => s.median_obs_years ?? '—' },
  { label: 'Data refresh', get: (s) => s.data_refresh ?? '—' },
]

interface ComparisonPanelProps {
  sources: EMADataSource[]
  onRemove: (name: string) => void
}

function ComparisonPanel({ sources, onRemove }: ComparisonPanelProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-blue-200 bg-blue-50 p-4">
      <h3 className="text-sm font-semibold text-blue-800 mb-3">
        Side-by-side comparison ({sources.length} sources)
      </h3>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left text-slate-500 font-medium py-1.5 pr-4 w-32">Field</th>
            {sources.map((s) => (
              <th key={s.name} className="text-left py-1.5 px-3 min-w-[160px]">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-800 truncate max-w-[140px]" title={s.name}>
                    {s.acronym ?? s.name}
                  </span>
                  <button
                    onClick={() => onRemove(s.name)}
                    className="ml-auto text-slate-400 hover:text-red-500 flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'}>
              <td className="py-1.5 pr-4 text-slate-500 font-medium whitespace-nowrap">{row.label}</td>
              {sources.map((s) => (
                <td key={s.name} className="py-1.5 px-3 text-slate-700">
                  {row.get(s)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────

interface FilterSelectProps {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-9 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option value="">{label}: All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DataSourceSelector() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { inputs?: StudyInput; fromTour?: boolean } | null
  const inputs = locationState?.inputs ?? null
  const fromTour = locationState?.fromTour ?? false

  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: '',
    country: '',
    vocab: '',
    care_setting: '',
  })
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredSources = useMemo(() => {
    return DATA_SOURCES.filter((s) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const inName = s.name.toLowerCase().includes(q)
        const inAcronym = s.acronym?.toLowerCase().includes(q) ?? false
        const inCountry = s.countries?.toLowerCase().includes(q) ?? false
        const inType = s.type?.toLowerCase().includes(q) ?? false
        if (!inName && !inAcronym && !inCountry && !inType) return false
      }
      if (filters.type && s.type !== filters.type) return false
      if (filters.country) {
        const countries = s.countries?.split(',').map((c) => c.trim()) ?? []
        if (!countries.includes(filters.country)) return false
      }
      if (filters.vocab) {
        const allVocabs = [s.dx_vocabulary, s.rx_vocabulary, s.cod_vocabulary, s.drug_vocabulary]
          .filter(Boolean)
          .join(',')
          .toLowerCase()
        if (!allVocabs.includes(filters.vocab.toLowerCase())) return false
      }
      if (filters.care_setting && s.care_setting !== filters.care_setting) return false
      return true
    })
  }, [filters])

  const selectedSources = useMemo(
    () => DATA_SOURCES.filter((s) => selectedNames.includes(s.name)),
    [selectedNames]
  )

  const handleToggle = (name: string) => {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const handleProceed = async (withSources: boolean) => {
    if (!inputs) return
    setIsGenerating(true)
    setError(null)
    try {
      const finalInputs: StudyInput = withSources
        ? { ...inputs, selected_data_sources: selectedNames }
        : inputs

      const study = createStudy(finalInputs)
      let chunks: ReturnType<typeof Array.prototype.slice> = []
      try {
        chunks = await retrieveProtocols(finalInputs)
      } catch {
        // RAG unavailable — continue without retrieval
      }

      const result = await generateProtocol(finalInputs, chunks as never)
      const protocol: Protocol = {
        study_id: study.id,
        study_inputs: finalInputs,
        sections: result.sections,
        code_sets: result.code_sets,
        flags: result.flags,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      saveProtocol(protocol)
      navigate(`/study/${study.id}/draft`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed'
      setError(`Error: ${msg}. Make sure the backend is running and ANTHROPIC_API_KEY is set.`)
      setIsGenerating(false)
    }
  }

  const setFilter = (key: keyof Filters) => (value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span>New Study Protocol</span>
            <span>›</span>
            <span className="text-blue-600 font-medium">Step 3 — Data Feasibility</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">Select Data Sources</h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse {DATA_SOURCES.length} EMA/HMA catalogued data sources. Select 1–3 to include in your protocol.
          </p>
        </div>

        {/* Tour mode banner */}
        {fromTour && (
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-sm text-blue-800">
              👋 Tour mode — explore the data source catalog. In real use, your study inputs would filter recommendations.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Sticky filter + action bar */}
        <div className="sticky top-0 z-10 bg-slate-50 pb-3 pt-1">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Search name, acronym, country…"
              value={filters.search}
              onChange={(e) => setFilter('search')(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 w-60 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />

            <FilterSelect
              label="Type"
              value={filters.type}
              options={SOURCE_TYPES}
              onChange={setFilter('type')}
            />
            <FilterSelect
              label="Country"
              value={filters.country}
              options={COUNTRIES}
              onChange={setFilter('country')}
            />
            <FilterSelect
              label="Vocabulary"
              value={filters.vocab}
              options={CODING_VOCABS}
              onChange={setFilter('vocab')}
            />
            <FilterSelect
              label="Care setting"
              value={filters.care_setting}
              options={CARE_SETTINGS}
              onChange={setFilter('care_setting')}
            />

            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters({ search: '', type: '', country: '', vocab: '', care_setting: '' })}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}

            <span className="text-xs text-slate-400 ml-auto">
              {filteredSources.length} of {DATA_SOURCES.length} sources
            </span>
          </div>
        </div>

        {/* Selection summary bar */}
        {selectedNames.length > 0 && (
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-blue-800 font-medium">
              {selectedNames.length} source{selectedNames.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-1.5 flex-wrap flex-1">
              {selectedNames.map((name) => {
                const src = DATA_SOURCES.find((s) => s.name === name)
                return (
                  <span
                    key={name}
                    className="flex items-center gap-1 text-xs bg-white border border-blue-200 text-blue-700 rounded-full px-2.5 py-0.5"
                  >
                    {src?.acronym ?? name}
                    <button onClick={() => handleToggle(name)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => handleProceed(false)}
                disabled={isGenerating || fromTour}
                className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Skip selection
              </button>
              <button
                onClick={() => handleProceed(true)}
                disabled={isGenerating || fromTour}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    Proceed with selected
                    <Check className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Comparison panel */}
        {selectedSources.length >= 2 && (
          <div className="mb-6">
            <ComparisonPanel sources={selectedSources} onRemove={handleToggle} />
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-16">
          {filteredSources.map((source) => (
            <SourceCard
              key={source.name}
              source={source}
              selected={selectedNames.includes(source.name)}
              onToggle={handleToggle}
              selectionCount={selectedNames.length}
            />
          ))}
          {filteredSources.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              No sources match your filters.
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center">
          <button
            onClick={() => navigate('/study/new')}
            disabled={isGenerating}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            ← Back to form
          </button>
          <div className="flex gap-3 items-center">
            {fromTour ? (
              <span className="text-xs text-slate-400 italic">In tour mode — proceed is disabled</span>
            ) : selectedNames.length === 0 ? (
              <span className="text-xs text-slate-400">Select 1–3 sources or skip</span>
            ) : null}
            <button
              onClick={() => handleProceed(false)}
              disabled={isGenerating || fromTour}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Skip — generate without data source
            </button>
            <button
              onClick={() => handleProceed(true)}
              disabled={isGenerating || fromTour || selectedNames.length === 0}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Protocol…
                </>
              ) : (
                `Generate with ${selectedNames.length > 0 ? selectedNames.length + ' source' + (selectedNames.length > 1 ? 's' : '') : 'selection'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
