import { useNavigate } from 'react-router-dom'
import { StudySetupForm } from '@/components/StudySetupForm/StudySetupForm'
import type { StudyInput } from '@/types'

export function StudySetup() {
  const navigate = useNavigate()

  const handleSubmit = (inputs: StudyInput) => {
    navigate('/study/new/data-sources', { state: { inputs } })
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">New Study Protocol</h1>
          <p className="mt-1 text-sm text-slate-500">
            Provide your study details and Mycelium will draft a complete regulatory protocol.
          </p>
        </div>

        <div data-tour="study-form">
          <StudySetupForm onSubmit={handleSubmit} isGenerating={false} />
        </div>
      </div>
    </div>
  )
}
