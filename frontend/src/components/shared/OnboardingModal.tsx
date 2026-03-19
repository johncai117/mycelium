import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudies } from '@/api'
import { EXAMPLE_PROTOCOLS } from '@/data/exampleStudies'
import type { StudyListItem } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────

interface WalkthroughStep {
  title: string
  description: string
  target?: string   // CSS selector for element to spotlight
  action?: string   // CTA button label
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface Props {
  onClose: () => void
}

// ── Step definitions ───────────────────────────────────────────────────────

const STEPS: WalkthroughStep[] = [
  {
    title: 'Welcome to Mycelium',
    description:
      'An AI system for writing PASS pharmacoepidemiology protocols — from blank slate to a full 10-section draft in minutes. Let us show you around.',
    position: 'center',
    action: 'Start Tour',
  },
  {
    title: 'Your Studies',
    description:
      'This is your study dashboard. All your protocol drafts live here — with their design type, status, and last updated date.',
    target: '[data-tour="study-header"]',
    position: 'bottom',
  },
  {
    title: 'New Study',
    description:
      'Click here to start a new protocol. You will fill in study details across 4 steps — intake form, data source selection, AI generation, and review.',
    target: '[data-tour="new-study"]',
    position: 'bottom',
  },
  {
    title: 'Upload your PMR or PASS letter',
    description:
      'On Step 1, upload your FDA PMR or EMA PASS obligation letter. Mycelium extracts the safety signal, milestones, and verbatim study description automatically.',
    position: 'center',
  },
  {
    title: 'Pick your database',
    description:
      'After the intake form, choose from 278 EMA/HMA-catalogued real-world data sources. Filter by country, coding vocabulary, and outcome capability.',
    position: 'center',
  },
  {
    title: 'Protocol draft',
    description:
      'Mycelium generates a full 10-section protocol anchored to your regulatory requirement. Every section is editable, approvable, and tracked.',
    position: 'center',
  },
  {
    title: 'ENCePP score',
    description:
      'The built-in ENCePP checker scores your protocol against 29 regulatory quality criteria. Know your submission readiness before you file.',
    position: 'center',
  },
  {
    title: 'Export to Word',
    description:
      'Export to Word with a single click — formatted for regulatory submission. Load sample studies to explore the full workflow.',
    position: 'center',
    action: 'Let me try it →',
  },
]

// ── Constants ──────────────────────────────────────────────────────────────

const PAD = 8    // px gap between highlight ring and target element
const GAP = 12   // px gap between highlight ring and tooltip card
const CARD_W = 320

// ── Component ──────────────────────────────────────────────────────────────

export function OnboardingModal({ onClose }: Props) {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const step = STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1
  const hasTarget = !!targetRect

  // ── Demo data seeding ────────────────────────────────────────────────────

  function seedDemoData() {
    if (getStudies().length === 0) {
      const studyItems: StudyListItem[] = EXAMPLE_PROTOCOLS.map((p) => ({
        id: p.study_id,
        drug_name: p.study_inputs.drug_name,
        indication: p.study_inputs.indication,
        study_type: p.study_inputs.study_type,
        status: 'review' as const,
        updated_at: p.updated_at,
        sponsor: p.study_inputs.sponsor,
      }))
      localStorage.setItem('mycelium_studies', JSON.stringify(studyItems))

      const protocolsMap: Record<string, typeof EXAMPLE_PROTOCOLS[number]> = {}
      for (const p of EXAMPLE_PROTOCOLS) {
        protocolsMap[p.study_id] = p
      }
      localStorage.setItem('mycelium_protocols', JSON.stringify(protocolsMap))
    }
  }

  // ── Navigation handlers ──────────────────────────────────────────────────

  function dismiss() {
    localStorage.setItem('onboarding_seen', 'true')
    onClose()
  }

  function handleNext() {
    if (isLast) {
      seedDemoData()
      dismiss()
      navigate('/')
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  function handlePrev() {
    if (!isFirst) setStepIndex((i) => i - 1)
  }

  function handleAction() {
    if (isFirst) {
      setStepIndex(1)
    } else if (isLast) {
      seedDemoData()
      dismiss()
      navigate('/')
    } else {
      handleNext()
    }
  }

  // ── Target element tracking ──────────────────────────────────────────────

  const updateTargetRect = useCallback(() => {
    if (!step.target) {
      setTargetRect(null)
      return
    }
    const el = document.querySelector(step.target)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
    } else {
      setTargetRect(null)
    }
  }, [step.target])

  useEffect(() => {
    updateTargetRect()
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)
    return () => {
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [updateTargetRect])

  // ── Tooltip positioning ──────────────────────────────────────────────────

  function getTooltipStyle(): CSSProperties {
    if (!hasTarget || !targetRect) {
      return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: CARD_W,
      }
    }

    const pos = step.position ?? 'bottom'
    const clampedLeft = Math.max(
      16,
      Math.min(
        targetRect.left + targetRect.width / 2 - CARD_W / 2,
        window.innerWidth - CARD_W - 16,
      ),
    )

    switch (pos) {
      case 'top':
        return {
          position: 'absolute',
          bottom: window.innerHeight - (targetRect.top - PAD - GAP),
          left: clampedLeft,
          width: CARD_W,
        }
      case 'right':
        return {
          position: 'absolute',
          top: Math.max(16, targetRect.top),
          left: targetRect.right + PAD + GAP,
          width: CARD_W,
        }
      case 'left':
        return {
          position: 'absolute',
          top: Math.max(16, targetRect.top),
          right: window.innerWidth - (targetRect.left - PAD - GAP),
          width: CARD_W,
        }
      default: // bottom
        return {
          position: 'absolute',
          top: targetRect.bottom + PAD + GAP,
          left: clampedLeft,
          width: CARD_W,
        }
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={step.title}>
      {hasTarget && targetRect ? (
        // Spotlight mode — four overlay panels + highlight ring
        <>
          {/* Top panel */}
          <div
            className="absolute bg-slate-900/60"
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, targetRect.top - PAD) }}
          />
          {/* Bottom panel */}
          <div
            className="absolute bg-slate-900/60"
            style={{ top: targetRect.bottom + PAD, left: 0, right: 0, bottom: 0 }}
          />
          {/* Left panel */}
          <div
            className="absolute bg-slate-900/60"
            style={{
              top: targetRect.top - PAD,
              left: 0,
              width: Math.max(0, targetRect.left - PAD),
              height: targetRect.height + PAD * 2,
            }}
          />
          {/* Right panel */}
          <div
            className="absolute bg-slate-900/60"
            style={{
              top: targetRect.top - PAD,
              left: targetRect.right + PAD,
              right: 0,
              height: targetRect.height + PAD * 2,
            }}
          />
          {/* Highlight ring — pointer-events-none so target stays clickable */}
          <div
            className="absolute rounded-lg pointer-events-none"
            style={{
              top: targetRect.top - PAD,
              left: targetRect.left - PAD,
              width: targetRect.width + PAD * 2,
              height: targetRect.height + PAD * 2,
              boxShadow: '0 0 0 3px rgb(59 130 246), 0 0 0 6px rgba(59 130 246 / 0.3)',
            }}
          />
        </>
      ) : (
        // Full-screen backdrop for center steps
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={dismiss}
        />
      )}

      {/* Tooltip card */}
      <div
        className="absolute z-10 bg-white rounded-2xl shadow-xl border border-slate-200 p-5"
        style={getTooltipStyle()}
      >
        {/* Header row: step counter + close */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400">
            {stepIndex + 1} of {STEPS.length}
          </span>
          <button
            onClick={dismiss}
            className="text-slate-300 hover:text-slate-500 transition-colors"
            aria-label="Close tour"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h3 className="font-semibold text-slate-900 text-base mb-1.5">{step.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">{step.description}</p>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === stepIndex
                  ? 'bg-blue-600 w-4'
                  : i < stepIndex
                  ? 'bg-blue-200 w-1.5'
                  : 'bg-slate-200 w-1.5'
              }`}
            />
          ))}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2">
          {isFirst ? (
            <button
              onClick={dismiss}
              className="flex-none rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Skip
            </button>
          ) : (
            <button
              onClick={handlePrev}
              className="flex-none rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            onClick={step.action ? handleAction : handleNext}
            className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {step.action ?? (isLast ? 'Finish' : 'Next →')}
          </button>
        </div>
      </div>
    </div>
  )
}
