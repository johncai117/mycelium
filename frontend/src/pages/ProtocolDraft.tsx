import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProtocolToolbar } from '@/components/ProtocolDraftViewer/ProtocolToolbar'
import { ProtocolDraftViewer } from '@/components/ProtocolDraftViewer/ProtocolDraftViewer'
import { getStudy, saveProtocol } from '@/api'
import type { Protocol, RetrievedChunk } from '@/types'

function SkeletonSection() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse space-y-3">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="h-3 w-full rounded bg-slate-100" />
      <div className="h-3 w-5/6 rounded bg-slate-100" />
      <div className="h-3 w-4/6 rounded bg-slate-100" />
    </div>
  )
}

export function ProtocolDraft() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    if (!id) return
    const loaded = getStudy(id)
    if (!loaded) {
      navigate('/')
      return
    }
    setProtocol(loaded)
  }, [id, navigate])

  const handleSave = () => {
    if (protocol) {
      saveProtocol(protocol)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2000)
    }
  }

  if (!protocol) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonSection key={i} />)}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ProtocolToolbar protocol={protocol} onSave={handleSave} />

      {savedMsg && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg z-50">
          Draft saved ✓
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        <ProtocolDraftViewer
          protocol={protocol}
          retrievedChunks={[] as RetrievedChunk[]}
          onProtocolChange={setProtocol}
        />
      </div>
    </div>
  )
}
