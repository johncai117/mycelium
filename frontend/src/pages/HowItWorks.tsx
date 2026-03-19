import { Link } from 'react-router-dom'

interface StepProps {
  number: number
  icon: string
  title: string
  description: string
}

function Step({ number, icon, title, description }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
          {number}
        </div>
        <div className="w-0.5 bg-blue-100 flex-1 mt-2" />
      </div>
      <div className="pb-8">
        <div className="text-2xl mb-1">{icon}</div>
        <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

interface FlowCardProps {
  letter: string
  title: string
  subtitle: string
  children: React.ReactNode
}

function FlowCard({ letter, title, subtitle, children }: FlowCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold">
            {letter}
          </span>
          <div>
            <h2 className="text-white font-semibold text-lg">{title}</h2>
            <p className="text-blue-100 text-sm">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

interface BenefitCardProps {
  icon: string
  headline: string
  description: string
}

function BenefitCard({ icon, headline, description }: BenefitCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4 shadow-sm">
      <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-1">{headline}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

const BENEFITS: BenefitCardProps[] = [
  {
    icon: '⚡',
    headline: 'Hours to minutes',
    description: 'Full PASS study protocol in minutes, not days of manual drafting and internal review cycles.',
  },
  {
    icon: '📋',
    headline: 'Regulatory-anchored',
    description: 'Ingests FDA PMR and EMA PASS obligation letters — every protocol section is anchored to the verbatim regulatory requirement.',
  },
  {
    icon: '✅',
    headline: 'ENCePP-ready',
    description: 'Built-in 29-item ENCePP checklist QA scores your submission readiness before you send it to the regulator.',
  },
  {
    icon: '🗄️',
    headline: 'Database-aware',
    description: '278 EMA/HMA-catalogued real-world data sources with capability matching — picks the right database for your safety signal.',
  },
  {
    icon: '🔍',
    headline: 'Full audit trail',
    description: 'Every section stamped AI-generated with confidence level, human-editable with diff tracking for sponsor review.',
  },
]

export function HowItWorks() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
          🧬 Product Guide
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">How Mycelium works</h1>
        <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
          Mycelium uses AI to help pharmacoepidemiologists write, evaluate, and export
          PASS protocol documents — in minutes, not days.
        </p>
      </div>

      {/* Why Mycelium — Benefits */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 text-center">Why Mycelium</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <BenefitCard key={b.headline} {...b} />
          ))}
        </div>
      </div>

      {/* Two flows */}
      <div className="space-y-8 mb-12">
        {/* Flow A */}
        <FlowCard
          letter="A"
          title="Generate a new protocol"
          subtitle="Start from scratch — AI does the heavy lifting"
        >
          <div>
            <Step
              number={1}
              icon="📋"
              title="Create a study"
              description="Enter the drug name, indication, study type (cohort, case-control, cross-sectional), and data source (e.g. claims database, EHR, registry)."
            />
            <Step
              number={2}
              icon="💬"
              title="Answer clarifying questions"
              description="The AI reviews your inputs and asks targeted follow-up questions to fill any gaps — comparator drug, exposure definition, outcome coding, study period, and more."
            />
            <Step
              number={3}
              icon="⚡"
              title="AI generates your full protocol"
              description="In about 60 seconds, Mycelium produces a complete 10-section PASS protocol: background, objectives, methods, data sources, bias analysis, ethical considerations, and more."
            />
            <Step
              number={4}
              icon="✏️"
              title="Review, edit, and refine"
              description="Read through each section inline. Edit text directly, or ask the AI to regenerate any individual section with updated instructions. Iterate until it's right."
            />
          </div>
        </FlowCard>

        {/* Flow B */}
        <FlowCard
          letter="B"
          title="Edit & evaluate an existing protocol"
          subtitle="Refine, validate, and export for submission"
        >
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <span className="text-2xl">📂</span>
              <div>
                <h3 className="font-semibold text-slate-800">Open a study</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Pick any study from your Studies list. All sections are shown in a structured viewer — navigate via the section sidebar.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-2xl">🔄</span>
              <div>
                <h3 className="font-semibold text-slate-800">Edit inline or regenerate</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Click into any section to edit text directly. Or use "Regenerate" to ask the AI to rewrite a section — you can add custom instructions to guide the output.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-2xl">✅</span>
              <div>
                <h3 className="font-semibold text-slate-800">Run ENCEPP evaluation</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Trigger the 29-item ENCEPP checklist evaluation. The AI scores each item and flags gaps, so you know exactly what needs to be addressed before submission.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-2xl">📄</span>
              <div>
                <h3 className="font-semibold text-slate-800">Export to Word</h3>
                <p className="text-sm text-slate-500 mt-1">
                  When your protocol is ready, export it as a formatted <code className="bg-slate-100 px-1 rounded text-xs">.docx</code> file — ready to submit to your sponsor, CRO, or regulatory body.
                </p>
              </div>
            </div>
          </div>
        </FlowCard>
      </div>

      {/* ENCEPP explainer */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-10">
        <div className="flex gap-3 items-start">
          <span className="text-2xl">🇪🇺</span>
          <div>
            <h2 className="font-semibold text-slate-800 text-base mb-1">What is ENCEPP?</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The <strong>European Network of Centres for Pharmacoepidemiology and Pharmacovigilance</strong> (ENCEPP)
              is an EMA initiative that maintains a checklist of 29 methodological criteria for post-authorisation
              safety studies (PASS). The checklist ensures protocols meet EMA/HMA standards for transparency,
              scientific rigor, and bias control before a study is registered or submitted.
              Mycelium's evaluation feature automatically scores your protocol against all 29 items.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Ready to write your first protocol?</h2>
        <p className="text-sm text-slate-500 mb-5">It takes about 5 minutes to get a full draft.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/study/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            ✨ Create a new study
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View my studies →
          </Link>
        </div>
      </div>
    </div>
  )
}
