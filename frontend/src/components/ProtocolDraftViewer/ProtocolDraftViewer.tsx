import { useState } from 'react'
import type { Protocol, ProtocolSection, RetrievedChunk, EvalResult, CodeSets } from '@/types'
import { SectionNav } from './SectionNav'
import { ProtocolSectionView } from './ProtocolSectionView'
import { ReferencePanel } from './ReferencePanel'
import { EvalPanel } from './EvalPanel'

const SECTION_ORDER = [
  'background', 'objectives', 'study_design', 'study_setting',
  'cohort_definition', 'variables', 'study_size', 'data_analysis',
  'limitations', 'ethics',
]

interface Props {
  protocol: Protocol
  retrievedChunks: RetrievedChunk[]
  onProtocolChange: (updated: Protocol) => void
}

export function ProtocolDraftViewer({ protocol, retrievedChunks, onProtocolChange }: Props) {
  const [activeSection, setActiveSection] = useState(SECTION_ORDER[0])
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null)

  const updateSection = (key: string, updated: ProtocolSection) => {
    onProtocolChange({
      ...protocol,
      sections: { ...protocol.sections, [key]: updated },
    })
  }

  const updateCodeSets = (codeSets: CodeSets) => {
    onProtocolChange({ ...protocol, code_sets: codeSets })
  }

  const handleNavSelect = (key: string) => {
    setActiveSection(key)
    const el = document.getElementById(`section-${key}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex gap-6">
      {/* Left mini-nav */}
      <aside className="hidden lg:block w-44 flex-shrink-0">
        <SectionNav
          sections={protocol.sections}
          activeSection={activeSection}
          onSelect={handleNavSelect}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 space-y-4">
        {SECTION_ORDER.map((key) => {
          const section = protocol.sections[key]
          if (!section) return null
          return (
            <ProtocolSectionView
              key={key}
              sectionKey={key}
              section={section}
              flags={protocol.flags}
              studyInputs={protocol.study_inputs}
              retrievedChunks={retrievedChunks}
              onUpdate={updateSection}
            />
          )
        })}

        <EvalPanel
          protocol={protocol}
          evalResult={evalResult}
          onEvalComplete={setEvalResult}
        />
      </main>

      {/* Right sidebar */}
      <aside className="hidden xl:block w-64 flex-shrink-0">
        <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <ReferencePanel
            chunks={retrievedChunks}
            codeSets={protocol.code_sets}
            onCodeSetsChange={updateCodeSets}
          />
        </div>
      </aside>
    </div>
  )
}
