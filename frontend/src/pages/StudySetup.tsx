import { useNavigate } from 'react-router-dom'
import { StudySetupForm } from '@/components/StudySetupForm/StudySetupForm'
import type { StudyInput } from '@/types'

export function StudySetup() {
  const navigate = useNavigate()

  const handleSubmit = (inputs: StudyInput) => {
    navigate('/study/new/data-sources', { state: { inputs } })
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 h-full flex flex-col py-10">
        <div className="mb-8 text-center flex-shrink-0">
          <h1 className="text-2xl font-semibold text-slate-800">New Study Protocol</h1>
          <p className="mt-1 text-sm text-slate-500">
            Provide your study details and Mycelium will draft a complete regulatory protocol.
          </p>
        </div>

        <div data-tour="study-form" className="flex-1 min-h-0 flex flex-col">
          <StudySetupForm onSubmit={handleSubmit} isGenerating={false} />
        </div>
      </div>
    </div>
  )
}
