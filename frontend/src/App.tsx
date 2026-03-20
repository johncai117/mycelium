import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { StudyList } from './pages/StudyList'
import { StudySetup } from './pages/StudySetup'
import { DataSourceSelector } from './pages/DataSourceSelector'
import { ProtocolDraft } from './pages/ProtocolDraft'
import { HowItWorks } from './pages/HowItWorks'
import { MOCK_MODE } from './api'
import { OnboardingModal } from './components/shared/OnboardingModal'

function Nav({ onTakeTour }: { onTakeTour: () => void }) {
  const location = useLocation()
  const isDraft = location.pathname.includes('/draft')

  if (isDraft) return null  // Toolbar replaces nav on draft page

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600 tracking-tight">Mycelium</span>
          <span className="text-xs text-slate-400 font-normal hidden sm:block">
            AI Protocol Writing System
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/"
            className={`font-medium transition-colors ${
              location.pathname === '/' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Studies
          </Link>
          <Link
            to="/how-it-works"
            className={`font-medium transition-colors ${
              location.pathname === '/how-it-works' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Guide
          </Link>
          <button
            onClick={onTakeTour}
            className="font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Tour ✦
          </button>
        </nav>
      </div>
    </header>
  )
}

function MockBanner() {
  if (!MOCK_MODE) return null
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
      🧪 Demo Mode — API calls are mocked. Deploy your own backend for full functionality.
    </div>
  )
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('onboarding_seen')
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      <MockBanner />
      <Nav onTakeTour={() => setShowOnboarding(true)} />
      <div className="flex-1 overflow-y-auto min-h-0">
        <Routes>
          <Route path="/" element={<StudyList onTakeTour={() => setShowOnboarding(true)} />} />
          <Route path="/study/new" element={<StudySetup />} />
          <Route path="/study/new/data-sources" element={<DataSourceSelector />} />
          <Route path="/study/:id/draft" element={<ProtocolDraft />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
        </Routes>
      </div>
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
    </div>
  )
}
