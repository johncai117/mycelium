import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { StudyList } from './pages/StudyList'
import { StudySetup } from './pages/StudySetup'
import { ProtocolDraft } from './pages/ProtocolDraft'
import { MOCK_MODE } from './api'

function Nav() {
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
  return (
    <div className="min-h-screen bg-slate-50">
      <MockBanner />
      <Nav />
      <Routes>
        <Route path="/" element={<StudyList />} />
        <Route path="/study/new" element={<StudySetup />} />
        <Route path="/study/:id/draft" element={<ProtocolDraft />} />
      </Routes>
    </div>
  )
}
