import type { ProtocolSection } from '@/types'

const SECTIONS = [
  { key: 'background', label: 'Background' },
  { key: 'objectives', label: 'Objectives' },
  { key: 'study_design', label: 'Study Design' },
  { key: 'study_setting', label: 'Study Setting' },
  { key: 'cohort_definition', label: 'Cohort Definition' },
  { key: 'variables', label: 'Variables' },
  { key: 'study_size', label: 'Study Size' },
  { key: 'data_analysis', label: 'Data Analysis' },
  { key: 'limitations', label: 'Limitations' },
  { key: 'ethics', label: 'Ethics' },
]

interface Props {
  sections: Record<string, ProtocolSection>
  activeSection: string
  onSelect: (key: string) => void
}

function statusDot(section?: ProtocolSection) {
  if (!section) return 'bg-slate-200'
  const s = section.status ?? (section.ai_generated ? 'ai_generated' : 'edited')
  if (s === 'approved') return 'bg-green-500'
  if (s === 'edited') return 'bg-blue-500'
  if (section.confidence === 'low') return 'bg-orange-400'
  if (section.confidence === 'medium') return 'bg-yellow-400'
  return 'bg-green-400'
}

export function SectionNav({ sections, activeSection, onSelect }: Props) {
  return (
    <nav className="sticky top-4 space-y-0.5">
      <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Sections
      </p>
      {SECTIONS.map((s) => (
        <button
          key={s.key}
          onClick={() => onSelect(s.key)}
          className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
            activeSection === s.key
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDot(sections[s.key])}`} />
          {s.label}
        </button>
      ))}
    </nav>
  )
}
