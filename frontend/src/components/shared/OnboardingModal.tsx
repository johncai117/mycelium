import { useNavigate } from 'react-router-dom'

interface OnboardingModalProps {
  onClose: () => void
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const navigate = useNavigate()

  function dismiss() {
    localStorage.setItem('onboarding_seen', 'true')
    onClose()
  }

  function goToGuide() {
    dismiss()
    navigate('/how-it-works')
  }

  function getStarted() {
    dismiss()
    navigate('/study/new')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header accent */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon + title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
              🧬
            </div>
            <h2 className="text-xl font-bold text-slate-900">Welcome to Mycelium</h2>
          </div>

          {/* Body */}
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Mycelium is an AI-assisted system for writing{' '}
            <strong className="text-slate-800">PASS pharmacoepidemiology protocols</strong> — from
            blank slate to a full 10-section draft in about 60 seconds. You can also edit sections
            inline, run an ENCEPP regulatory checklist, and export to Word for submission.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={goToGuide}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              📖 Show me how it works
            </button>
            <button
              onClick={getStarted}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              ✨ Get started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
