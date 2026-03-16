import { useState } from 'react'
import { ExternalLink, Plus, X } from 'lucide-react'
import type { RetrievedChunk, CodeSets, CodeEntry } from '@/types'

interface Props {
  chunks: RetrievedChunk[]
  codeSets: CodeSets
  onCodeSetsChange: (updated: CodeSets) => void
}

export function ReferencePanel({ chunks, codeSets, onCodeSetsChange }: Props) {
  const [activeTab, setActiveTab] = useState<'icd10' | 'ndc' | 'cpt'>('icd10')
  const [newCode, setNewCode] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // Deduplicate sources from chunks
  const sources = Object.values(
    chunks.reduce<Record<string, RetrievedChunk>>((acc, c) => {
      const key = c.source_eu_pas || c.source_title
      if (!acc[key] || c.score > acc[key].score) acc[key] = c
      return acc
    }, {}),
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const codes = codeSets[activeTab]

  const addCode = () => {
    if (!newCode.trim()) return
    const entry: CodeEntry = { code: newCode.trim(), description: newDesc.trim(), source: activeTab.toUpperCase() }
    onCodeSetsChange({ ...codeSets, [activeTab]: [...codes, entry] })
    setNewCode('')
    setNewDesc('')
  }

  const removeCode = (idx: number) => {
    const updated = codes.filter((_, i) => i !== idx)
    onCodeSetsChange({ ...codeSets, [activeTab]: updated })
  }

  return (
    <div className="space-y-6">
      {/* Retrieved References */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Retrieved References
        </h3>
        {sources.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No references retrieved. Add protocol PDFs to the knowledge base to enable retrieval.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.source_eu_pas || s.source_title} className="rounded-lg border border-slate-200 p-3 space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-medium text-slate-700 leading-snug">{s.source_title}</p>
                  <span className="flex-shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                    {Math.round(s.score * 100)}%
                  </span>
                </div>
                {s.source_eu_pas && (
                  <p className="text-xs text-slate-400">{s.source_eu_pas}</p>
                )}
                <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ExternalLink className="h-3 w-3" />View PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code Sets */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Code Sets
        </h3>
        <div className="flex gap-1 mb-3">
          {(['icd10', 'ndc', 'cpt'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.toUpperCase()} ({codeSets[tab].length})
            </button>
          ))}
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {codes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No codes yet.</p>
          ) : (
            codes.map((entry, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded bg-slate-50 px-2 py-1.5">
                <div className="min-w-0">
                  <span className="text-xs font-mono font-medium text-slate-700">{entry.code}</span>
                  <span className="ml-2 text-xs text-slate-500 truncate">{entry.description}</span>
                </div>
                <button onClick={() => removeCode(i)} className="text-slate-300 hover:text-red-400 flex-shrink-0">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-1 mt-2">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCode() }}
            placeholder="Code"
            className="w-24 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCode() }}
            placeholder="Description"
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
          />
          <button onClick={addCode} className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200">
            <Plus className="h-3 w-3 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  )
}
