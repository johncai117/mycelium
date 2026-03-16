import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StudySetupForm } from '@/components/StudySetupForm/StudySetupForm'
import { generateProtocol, retrieveProtocols, createStudy, saveProtocol } from '@/api'
import type { StudyInput, Protocol } from '@/types'

export function StudySetup() {
  const navigate = useNavigate()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (inputs: StudyInput) => {
    setIsGenerating(true)
    setError(null)
    try {
      // Create study in local store
      const study = createStudy(inputs)

      // Retrieve similar protocols for context
      let chunks: ReturnType<typeof Array.prototype.slice> = []
      try {
        chunks = await retrieveProtocols(inputs)
      } catch {
        // RAG unavailable — continue without retrieval
      }

      // Generate full protocol
      const result = await generateProtocol(inputs, chunks as never)

      // Build protocol object and save
      const protocol: Protocol = {
        study_id: study.id,
        study_inputs: inputs,
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
    } finally {
      setIsGenerating(false)
    }
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

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <StudySetupForm onSubmit={handleSubmit} isGenerating={isGenerating} />
      </div>
    </div>
  )
}
