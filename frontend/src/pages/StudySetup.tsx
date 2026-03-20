import { useNavigate } from 'react-router-dom'
import { StudySetupForm } from '@/components/StudySetupForm/StudySetupForm'
import type { StudyInput } from '@/types'

export function StudySetup() {
  const navigate = useNavigate()

  const handleSubmit = (inputs: StudyInput) => {
    navigate('/study/new/data-sources', { state: { inputs } })
  }

  return (
    <div className="h-full flex flex-col py-6">
      <div className="max-w-2xl mx-auto px-4 w-full flex flex-col flex-1 min-h-0">
        <div className="mb-6 text-center flex-shrink-0">
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
