# Architecture

**Analysis Date:** 2026-03-16

## Pattern Overview

**Overall:** Client-server (React + FastAPI) with modular service-oriented backend architecture. Frontend drives a multi-step protocol generation workflow; backend exposes stateless REST APIs for generation, RAG retrieval, validation, and evaluation.

**Key Characteristics:**
- Separation of concerns: frontend handles UI state (localStorage) and editing; backend handles AI/ML logic
- API-first design: all backend operations exposed via FastAPI router pattern
- Service-based backend: discrete services for LLM calls, embeddings, evaluation, export
- Section-by-section generation: protocol created as independent sections enabling granular regeneration
- Rule-based clarification: deterministic rules (not LLM) for follow-up questions
- RAG pipeline: semantic search over historical protocols to provide generation context

## Layers

**Presentation (Frontend React):**
- Purpose: Protocol drafting workbench; study list and setup forms; real-time editing UI
- Location: `frontend/src/`
- Contains: React components (pages, form steps, viewers), TypeScript type definitions, API client
- Depends on: REST API at `/clarify`, `/generate`, `/eval`, `/export`
- Used by: End users (epidemiologists)

**API Layer (FastAPI Routers):**
- Purpose: REST endpoints orchestrating backend services
- Location: `backend/app/api/`
- Contains: Six routers (clarify, retrieve, generate, eval, export, studies) each handling single responsibility
- Depends on: Services layer
- Entry point: `backend/app/main.py` (FastAPI app initialization)

**Service Layer (Business Logic):**
- Purpose: Encapsulate domain logic (LLM, retrieval, evaluation, export)
- Location: `backend/app/services/`
- Contains:
  - `llm.py`: Claude/Ollama API wrapper for section generation and judge feedback
  - `retrieval.py`: ChromaDB vector search with OpenAI embeddings
  - `code_sets.py`: ICD-10/NDC/CPT code lookups
  - `eval_engine.py`: ENCEPP checklist scoring (rule-based) + improvement suggestions
  - `docx_exporter.py`: Word document templating and generation
- Depends on: Model layer, external APIs (Anthropic, OpenAI, ChromaDB)
- Used by: API routers

**Model Layer (Data Schemas):**
- Purpose: Pydantic models for validation and type safety
- Location: `backend/app/models/`
- Contains:
  - `study_input.py`: StudyInput (10+ fields capturing study design)
  - `protocol.py`: Protocol, ProtocolSection, ProtocolFlag, CodeSets
  - `eval_result.py`: ENCEPPItem, EvalResult, ImprovementSuggestion

**State Management (Frontend):**
- Purpose: Persistent storage of studies and protocols
- Location: `frontend/src/api/index.ts` (localStorage persistence functions)
- Contains: getStudies, saveProtocol, updateStudyStatus functions
- Note: MVP uses browser localStorage; intended upgrade path: Supabase Postgres

## Data Flow

**Study Creation & Generation Flow:**

1. **User Input**: Researcher fills StudySetupForm (4 steps) capturing StudyInput
2. **Clarification**: Frontend calls `/clarify` with incomplete StudyInput
   - Backend applies deterministic rules in `_rule_based_questions()`
   - Returns list of ClarifyQuestion objects
   - Frontend conditionally displays modal with missing field prompts
3. **Retrieval** (optional): Frontend calls `/retrieve` with StudyInput
   - `RetrievalService.query()` embeds input with OpenAI
   - Semantic search against ChromaDB collection "protocols"
   - Returns top 10 RetrievedChunk objects with metadata (source_title, score, section)
4. **Generation**: Frontend calls `/generate` with StudyInput + optional retrieved_chunks
   - Backend iterates through SECTION_ORDER (10 sections)
   - For each section: loads section_*.md prompt → calls LLM → stores ProtocolSection
   - Passes prior section summaries as context to next section
   - Generates code_sets (ICD-10, NDC, CPT matches)
   - Flags low-confidence sections for epidemiologist judgment
   - Returns GenerateResponse (sections dict, code_sets, flags)
5. **Local Storage**: Frontend calls `saveProtocol()` to persist Protocol to localStorage
6. **Evaluation**: Frontend calls `/eval` with full Protocol
   - `eval_engine.score_protocol()` applies ENCEPP_CHECKLIST keyword matching
   - Computes encepp_score (0-100), assigns grade (A-D)
   - Optional: calls LLM judge for narrative feedback
7. **Export**: Frontend calls `/export/docx` with Protocol
   - `docx_exporter.py` renders Protocol sections into Word template
   - Returns Blob for browser download

**Regeneration Flow:**

1. Researcher edits section content inline in ProtocolSectionView
2. Provides comment in feedback modal
3. Frontend calls `/generate/section` with section_id, comment, current_content
4. Backend regenerates single section via LLM with instructions
5. Returns RegenerateResponse (new content, change_summary)
6. Frontend updates section in Protocol object

**State Management Flow:**

1. Protocol object held in React state (ProtocolDraft page)
2. Mutations use immutable pattern: spread operator creates new protocol/section objects
3. `saveProtocol()` persists to localStorage key `mycelium_protocols` (keyed by study_id)
4. StudyListItem updates trigger save to `mycelium_studies` key
5. All updates include version bump and updated_at timestamp

## Key Abstractions

**StudyInput:**
- Purpose: Immutable capture of study design parameters
- Examples: `frontend/src/types/index.ts`, `backend/app/models/study_input.py`
- Pattern: Pydantic model with required (drug_name, indication, study_type) and optional fields

**Protocol:**
- Purpose: Container for all protocol data (inputs, sections, evaluations)
- Examples: `backend/app/models/protocol.py`
- Pattern: Immutable object with version tracking (version, created_at, updated_at)
- Contains: sections dict (keyed by section name), code_sets, flags, study_inputs reference

**ProtocolSection:**
- Purpose: Represents one section of the 10-section protocol
- Pattern: Immutable with content, confidence level, ai_generated flag
- Confidence scoring: "high" when inputs are complete, "low" when inferred from minimal context

**RetrievedChunk:**
- Purpose: Single matching historical protocol chunk for RAG context
- Pattern: Contains chunk text, source metadata, similarity score
- Used by: Generation endpoint to provide examples during LLM calls

**EvalResult:**
- Purpose: Protocol quality assessment
- Pattern: Composition of ENCEPPItem list (per-item scores) + overall grade (A-D) + suggestions
- Scoring: ENCEPP keyword matching (0, 0.5, 1.0 per item) → aggregate → grade

## Entry Points

**Frontend Root:**
- Location: `frontend/src/App.tsx`
- Triggers: Browser load
- Responsibilities: Route initialization, global layout (nav, mock banner), session state

**Frontend Pages:**
- `StudyList.tsx` (/): Lists all studies, new study button, status badges
- `StudySetup.tsx` (/study/new): 4-step form → creates Study, redirects to draft
- `ProtocolDraft.tsx` (/study/:id/draft): Loads protocol from localStorage, renders editor
- `HowItWorks.tsx` (/how-it-works): Documentation page

**Backend Root:**
- Location: `backend/app/main.py`
- Triggers: `uvicorn app.main:app --reload --port 8000`
- Responsibilities: FastAPI initialization, CORS middleware, router registration, auth

**Backend Routers:**
- `clarify.py`: POST /clarify → `clarify()` function
- `retrieve.py`: POST /retrieve → `retrieve()` function
- `generate.py`: POST /generate and POST /generate/section
- `eval.py`: POST /eval → `eval_protocol()` function
- `export.py`: POST /export/docx → `export_docx()` function
- `studies.py`: GET/POST /studies, GET /studies/{id}

## Error Handling

**Strategy:** Exceptions bubble up to HTTP exception handlers; logged server-side; user-facing messages in response.

**Patterns:**

Backend error handling (example from `clarify.py`):
```python
try:
    questions = _rule_based_questions(request.study_inputs)
    is_sufficient = not any(q.required for q in questions)
    return ClarifyResponse(is_sufficient=is_sufficient, questions=questions)
except Exception as e:
    logger.error(f"Clarify error: {e}")
    raise HTTPException(status_code=500, detail={"error": "clarify_failed", "detail": str(e), "field": None})
```

Frontend error handling (mock mode fallback):
- If API_KEY is missing and MOCK_MODE is false, frontend displays demo banner
- API calls wrapped in try-catch in components (see EvalPanel, ProtocolSectionView)
- Failed API calls show user notification with error detail

## Cross-Cutting Concerns

**Logging:** Server-side only (backend uses Python logging module); configured in main.py at INFO level

**Validation:**
- Frontend: TypeScript type checking at compile time; Pydantic validation at API boundaries (request models)
- Backend: Pydantic model validation on all POST endpoints

**Authentication:**
- Optional Bearer token (DEMO_API_KEY env var); if not set, open access
- Implemented in main.py `verify_api_key()` dependency

**Immutability:**
- Frontend uses React immutable state patterns (spread operator for updates)
- Backend Pydantic models are immutable by default
- Protocol updates create new Protocol object, never mutate in place

**API Configuration:**
- Base URL from env var VITE_API_URL (frontend) or defaults to http://localhost:8000
- CORS configured in main.py with regex for Cloudflare Pages domains
- API client in `frontend/src/api/index.ts` handles mock mode vs. real API transparently

---

*Architecture analysis: 2026-03-16*
