import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Clock } from 'lucide-react'
import { getStudies } from '@/api'
import type { StudyListItem } from '@/types'

function StatusBadge({ status }: { status: StudyListItem['status'] }) {
  const styles = {
    drafting: 'bg-blue-100 text-blue-700',
    review: 'bg-yellow-100 text-yellow-700',
    exported: 'bg-green-100 text-green-700',
  }
  const labels = { drafting: 'Drafting', review: 'In Review', exported: 'Exported' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-20">
      <FileText className="mx-auto h-12 w-12 text-slate-300" />
      <h3 className="mt-4 text-base font-semibold text-slate-700">No studies yet</h3>
      <p className="mt-1 text-sm text-slate-400">
        Create your first study protocol to get started.
      </p>
      <button
        onClick={onNew}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        New Study
      </button>
    </div>
  )
}

export function StudyList({ onTakeTour }: { onTakeTour: () => void }) {
  const navigate = useNavigate()
  const studies = getStudies()

  return (
    <>
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6" data-tour="study-header">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Studies</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {studies.length} protocol{studies.length !== 1 ? 's' : ''} in workspace
            {' · '}
            <button
              onClick={onTakeTour}
              className="text-blue-500 hover:text-blue-600 transition-colors underline underline-offset-2"
            >
              Take the tour
            </button>
          </p>
        </div>
        <button
          data-tour="new-study"
          onClick={() => navigate('/study/new')}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Study
        </button>
      </div>

      {studies.length === 0 ? (
        <EmptyState onNew={() => navigate('/study/new')} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Drug / Indication</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Design</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studies.map((study) => (
                <tr key={study.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{study.drug_name}</div>
                    <div className="text-xs text-slate-400">{study.indication}</div>
                    {study.sponsor && <div className="text-xs text-slate-400">{study.sponsor}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {study.study_type.replace('_', '-')}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <StatusBadge status={study.status} />
                    {study.id.startsWith('demo-') && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Sample
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(study.updated_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/study/${study.id}/draft`)}
                      className="text-xs text-blue-600 font-medium hover:underline"
                    >
                      Open →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  )
}
