# Codebase Structure

**Analysis Date:** 2026-03-16

## Directory Layout

```
mycelium/
├── README.md                          # Project overview and quick start
├── PLAN.md                            # Full architecture plan document
├── PROGRESS.md                        # Build progress tracking
├── .env.example                       # Environment variable template
├── .gitignore                         # Git exclusions
├── .github/
│   └── workflows/                     # CI/CD pipeline definitions
├── .planning/
│   └── codebase/                      # This analysis (ARCHITECTURE.md, STRUCTURE.md, etc.)
│
├── frontend/                          # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── App.tsx                    # Root router and layout
│   │   ├── main.tsx                   # Vite entry point
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript interfaces (StudyInput, Protocol, etc.)
│   │   ├── api/
│   │   │   └── index.ts               # Typed API client with axios; localStorage study persistence
│   │   ├── pages/
│   │   │   ├── StudyList.tsx          # / — Study list table, new study button
│   │   │   ├── StudySetup.tsx         # /study/new — Entry form page
│   │   │   ├── ProtocolDraft.tsx      # /study/:id/draft — Editor page with toolbar
│   │   │   └── HowItWorks.tsx         # /how-it-works — Documentation
│   │   ├── components/
│   │   │   ├── shared/
│   │   │   │   └── OnboardingModal.tsx # First-time user welcome
│   │   │   ├── StudySetupForm/
│   │   │   │   ├── StudySetupForm.tsx # Form wrapper (4-step workflow)
│   │   │   │   ├── Step1CoreInputs.tsx # Drug name, indication, study type
│   │   │   │   ├── Step2DesignDetails.tsx # Study period, geography, comparators
│   │   │   │   ├── Step3ClinicalContext.tsx # Primary outcome, population notes
│   │   │   │   ├── Step4FollowUpQuestions.tsx # Clarification modal / follow-ups
│   │   │   │   └── useStudyForm.ts    # Form state hook (validation, submission)
│   │   │   └── ProtocolDraftViewer/
│   │   │       ├── ProtocolDraftViewer.tsx # Main editor layout (3-column: nav / sections / sidebar)
│   │   │       ├── ProtocolToolbar.tsx # Top toolbar (eval, export, save buttons)
│   │   │       ├── SectionNav.tsx      # Left sidebar section navigation
│   │   │       ├── ProtocolSectionView.tsx # Individual section viewer with inline edit
│   │   │       ├── EvalPanel.tsx       # Evaluation panel (ENCEPP score, suggestions)
│   │   │       └── ReferencePanel.tsx  # Right sidebar (retrieved protocols, code sets)
│   │   ├── lib/
│   │   │   └── utils.ts               # Utility functions (formatting, etc.)
│   │   ├── data/
│   │   │   └── exampleStudies.ts      # Demo study fixtures
│   │   ├── vite-env.d.ts              # Vite type declarations
│   │
│   ├── package.json                   # Dependencies (react, axios, tailwind, lucide-react)
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── vite.config.ts                 # Vite build config
│   └── index.html                     # HTML entry point
│
├── backend/                           # FastAPI Python application
│   ├── app/
│   │   ├── main.py                    # FastAPI app initialization, CORS, auth, router registration
│   │   ├── api/
│   │   │   ├── clarify.py             # POST /clarify — Follow-up question logic
│   │   │   ├── retrieve.py            # POST /retrieve — Vector search over protocols
│   │   │   ├── generate.py            # POST /generate and POST /generate/section
│   │   │   ├── eval.py                # POST /eval — ENCEPP scoring + LLM judge
│   │   │   ├── export.py              # POST /export/docx — Word document generation
│   │   │   ├── studies.py             # GET/POST /studies — Study CRUD (optional backend storage)
│   │   │   └── __init__.py            # (empty)
│   │   ├── services/
│   │   │   ├── llm.py                 # LLM service: section generation, judge calls (Ollama/Claude)
│   │   │   ├── retrieval.py           # RetrievalService: ChromaDB query + OpenAI embedding
│   │   │   ├── code_sets.py           # CodeSetService: ICD-10, NDC lookups from JSON files
│   │   │   ├── eval_engine.py         # Evaluation: ENCEPP keyword matching, grade assignment
│   │   │   ├── docx_exporter.py       # DOCX export: python-docx template generation
│   │   │   └── __init__.py            # (empty)
│   │   ├── models/
│   │   │   ├── study_input.py         # Pydantic: StudyInput model (10+ fields)
│   │   │   ├── protocol.py            # Pydantic: Protocol, ProtocolSection, ProtocolFlag, CodeSets
│   │   │   ├── eval_result.py         # Pydantic: ENCEPPItem, EvalResult, ImprovementSuggestion
│   │   │   └── __init__.py            # (empty)
│   │   ├── prompts/
│   │   │   ├── clarify.md             # (optional) System prompt for clarification
│   │   │   ├── section_background.md  # Per-section generation prompts (10 files)
│   │   │   ├── section_objectives.md
│   │   │   └── ... (section_*.md for each of 10 sections)
│   │   └── __init__.py                # (empty)
│   │
│   ├── ingestion/
│   │   ├── ingest_pdfs.py             # Batch PDF → ChromaDB pipeline
│   │   ├── extract_metadata.py        # LLM-assisted metadata extraction per PDF
│   │   └── validate_index.py          # Retrieval quality validation
│   │
│   ├── data/
│   │   └── code_sets/
│   │       ├── icd10_by_condition.json # ICD-10 codes by condition name
│   │       └── ndc_by_drug.json        # NDC codes by drug name
│   │
│   ├── tests/
│   │   └── test_api.py                # Pytest suite (16 tests, no LLM calls)
│   │
│   ├── requirements.txt               # Python dependencies
│   └── chroma_db/                     # (generated) ChromaDB vector store directory
│
├── docs/
│   ├── api_contracts.md               # API request/response schemas
│   ├── prompt_design.md               # Prompt engineering decisions
│   ├── encepp_checklist.md            # ENCEPP items mapped to sections
│   └── domain_glossary.md             # Epidemiology terminology
│
├── samples/                           # (generated) Sample protocol outputs for testing
│
└── infra/                             # Infrastructure / deployment configs (minimal)
```

## Directory Purposes

**frontend/src/pages/:**
- Purpose: Top-level page routes (StudyList, StudySetup, ProtocolDraft)
- Contains: Page component exports, route-specific logic
- Key files: `StudyList.tsx` (entry point for users), `ProtocolDraft.tsx` (main editor)

**frontend/src/components/StudySetupForm/:**
- Purpose: Multi-step form wizard for initial study input
- Contains: 4 step components + useStudyForm hook
- Flow: Step1 (required fields) → Step2 (design) → Step3 (clinical) → Step4 (clarification)
- Uses: `useStudyForm.ts` for shared state management

**frontend/src/components/ProtocolDraftViewer/:**
- Purpose: Protocol editing and review workspace
- Key responsibilities:
  - `ProtocolDraftViewer.tsx`: Layout (left nav, main sections, right sidebar)
  - `ProtocolSectionView.tsx`: Individual section with inline editor
  - `EvalPanel.tsx`: Evaluation trigger and results display
  - `ProtocolToolbar.tsx`: Top-level actions (eval, export, save)
  - `ReferencePanel.tsx`: Retrieved protocols sidebar

**frontend/src/types/:**
- Purpose: Shared TypeScript interfaces used by both frontend and API client
- Maintains type parity with backend Pydantic models

**backend/app/api/:**
- Purpose: REST endpoint handlers organized by responsibility
- Pattern: Each file = one router with 1-2 endpoints
- Dependencies: Inject services (llm, retrieval, eval_engine) at module level

**backend/app/services/:**
- Purpose: Encapsulate domain logic away from HTTP handlers
- Services are instantiated once and reused by routers
- Example: `LLMService().generate_section()` called by generate.py

**backend/app/models/:**
- Purpose: Pydantic data validation schemas
- Used by: API routers (request validation) and services (return types)
- Pattern: Classes inherit from BaseModel; fields typed with Literal for enums

**backend/app/prompts/:**
- Purpose: System prompts for LLM calls
- Files loaded dynamically by llm.py: `_load_prompt(f"section_{section_name}")`
- One file per section, plus clarify.md and judge.md

**backend/ingestion/:**
- Purpose: One-time scripts for populating ChromaDB with historical protocols
- Not part of runtime API; run separately: `python ingestion/ingest_pdfs.py --pdf_dir ...`

**backend/data/code_sets/:**
- Purpose: Static lookup tables (JSON) for code lists
- Loaded once by CodeSetService in memory
- Format: { "code": "description" } or { "code": { "description": "...", "source": "..." } }

## Key File Locations

**Entry Points:**

Frontend:
- `frontend/src/main.tsx` → Vite/React bootstrap
- `frontend/src/App.tsx` → Router initialization (StudyList, StudySetup, ProtocolDraft routes)
- `frontend/index.html` → HTML shell

Backend:
- `backend/app/main.py` → FastAPI app; listen on port 8000
- Start: `uvicorn app.main:app --reload --port 8000` from backend/ directory

**Configuration:**
- `frontend/vite.config.ts` → Vite build and dev server
- `frontend/tsconfig.json` → TypeScript compiler options
- `backend/requirements.txt` → Python dependencies
- `.env.example` → Template; copy to `.env` and fill in ANTHROPIC_API_KEY, OPENAI_API_KEY

**Core Logic:**
- Study input capture: `frontend/src/components/StudySetupForm/`
- Generation orchestration: `backend/app/api/generate.py`
- LLM interface: `backend/app/services/llm.py` (calls Ollama at http://localhost:11434)
- Evaluation: `backend/app/services/eval_engine.py`
- Export: `backend/app/services/docx_exporter.py` (661 lines, uses python-docx)

**Testing:**
- Frontend: component tests (Vitest + React Testing Library) - not yet implemented
- Backend: `backend/tests/test_api.py` (16 pytest tests, mocked LLM/embeddings)

**Type Definitions:**
- `frontend/src/types/index.ts` → All TypeScript interfaces (Study, Protocol, ProtocolSection, etc.)
- `backend/app/models/*.py` → Corresponding Pydantic models

## Naming Conventions

**Files:**

Patterns:
- Pages: PascalCase (e.g., `StudyList.tsx`, `ProtocolDraft.tsx`)
- Components: PascalCase (e.g., `ProtocolSectionView.tsx`, `EvalPanel.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useStudyForm.ts`)
- Services (backend): snake_case (e.g., `eval_engine.py`, `docx_exporter.py`)
- API routes: snake_case (e.g., `clarify.py`, `retrieve.py`)

Directories:
- PascalCase for grouped components: `StudySetupForm/`, `ProtocolDraftViewer/`
- lowercase for functional directories: `api/`, `services/`, `models/`, `pages/`, `components/`

**TypeScript/JavaScript:**

Examples from codebase:
- Functions: camelCase (`generateProtocol()`, `evalProtocol()`, `updateSection()`)
- Constants: UPPER_SNAKE_CASE (`SECTION_ORDER`, `MOCK_MODE`, `VITE_API_URL`)
- Types: PascalCase (`StudyInput`, `Protocol`, `ProtocolSection`, `ClarifyResponse`)
- Interfaces: PascalCase with `I` prefix optional (`StudyInput`, `RetrievedChunk`)

**Python:**

Examples from codebase:
- Classes: PascalCase (`StudyInput`, `Protocol`, `RetrievalService`, `LLMService`)
- Functions: snake_case (`generate_section()`, `_rule_based_questions()`, `score_protocol()`)
- Constants: UPPER_SNAKE_CASE (`SECTION_ORDER`, `JUDGMENT_REQUIRED_SECTIONS`, `MODEL`)
- Private functions: prefix with `_` (e.g., `_load_prompt()`, `_confidence_from_inputs()`)

## Where to Add New Code

**New Feature (e.g., "Add comparison mode"):**

1. **API endpoint**: Create handler in `backend/app/api/new_feature.py`
   ```python
   from fastapi import APIRouter
   from pydantic import BaseModel

   router = APIRouter()

   class ComparisonRequest(BaseModel):
       protocol_id_1: str
       protocol_id_2: str

   @router.post("/compare")
   async def compare_protocols(request: ComparisonRequest):
       # logic here
   ```

2. **Register router**: Add to `backend/app/main.py`
   ```python
   from app.api import new_feature
   app.include_router(new_feature.router, dependencies=[Depends(verify_api_key)])
   ```

3. **Add service** (if needed): `backend/app/services/comparison.py`
   - Encapsulate logic away from endpoint handler
   - Classes should be instantiated at module level and injected into routers

4. **Add frontend page**: `frontend/src/pages/Comparison.tsx`
   - Add route to `App.tsx`: `<Route path="/compare" element={<Comparison />} />`
   - Call API from hook or useEffect

5. **Add types**: Update `frontend/src/types/index.ts` with request/response interfaces

**New Component/Module:**

1. If component is reusable/shared: `frontend/src/components/shared/NewComponent.tsx`
2. If specific to feature: `frontend/src/components/FeatureName/NewComponent.tsx`
3. Always add TypeScript props interface and JSDoc comment
4. Import styles: use Tailwind classes inline; avoid separate CSS files

Example:
```typescript
interface ProtocolComparisonProps {
  protocol1: Protocol
  protocol2: Protocol
  onClose: () => void
}

export function ProtocolComparison({ protocol1, protocol2, onClose }: ProtocolComparisonProps) {
  // implementation
}
```

**Utilities:**

- General utilities: `frontend/src/lib/utils.ts`
- Service classes: `backend/app/services/new_service.py`
- Models: `backend/app/models/new_model.py`

**Tests:**

- Backend unit tests: `backend/tests/test_<module>.py` (pytest)
- Frontend component tests: `frontend/src/components/__tests__/ComponentName.test.tsx` (Vitest)

## Special Directories

**frontend/.next/ (if using Next.js):**
- Status: Not used; project uses Vite + React Router
- Generated by: (N/A)
- Committed: N/A

**backend/chroma_db/:**
- Purpose: Vector database persistence directory
- Generated: Yes, populated by `backend/ingestion/ingest_pdfs.py`
- Committed: No (in .gitignore)
- Restore by: Re-running ingestion script with PDF corpus

**frontend/dist/:**
- Purpose: Production build output
- Generated: Yes, by `npm run build`
- Committed: No (in .gitignore)

**.env:**
- Purpose: Runtime environment variables (secrets)
- Generated: No; template is `.env.example`
- Committed: No (in .gitignore for security)
- Required vars: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (for LLM and embeddings)
- Optional vars: `CHROMA_DB_PATH`, `CORS_ORIGINS`, `DEMO_API_KEY`

**docs/:**
- Purpose: Reference documentation
- Generated: No; hand-written
- Committed: Yes
- Files:
  - `api_contracts.md`: OpenAPI-style API reference
  - `prompt_design.md`: Prompt engineering notes
  - `encepp_checklist.md`: ENCEPP criteria mapped to sections
  - `domain_glossary.md`: Epidemiology terminology for developers

---

*Structure analysis: 2026-03-16*
