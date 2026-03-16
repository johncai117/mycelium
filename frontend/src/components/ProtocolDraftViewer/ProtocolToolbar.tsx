import { Download, Save } from 'lucide-react'
import type { Protocol } from '@/types'
import { exportDocx, saveProtocol } from '@/api'

interface Props {
  protocol: Protocol
  onSave: () => void
}

export function ProtocolToolbar({ protocol, onSave }: Props) {
  const { drug_name, indication, study_type, sponsor } = protocol.study_inputs

  const handleExport = async () => {
    try {
      const blob = await exportDocx(protocol)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `protocol_${protocol.study_id}_v${protocol.version}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Check backend is running and API key is set.')
    }
  }

  const handleSave = () => {
    saveProtocol(protocol)
    onSave()
  }

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 truncate">{drug_name}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 truncate">{indication}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
              {study_type.replace('_', '-')}
            </span>
            {sponsor && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-400">{sponsor}</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            v{protocol.version} · {Object.keys(protocol.sections).length} sections generated
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export DOCX
          </button>
        </div>
      </div>
    </div>
  )
}
