# Mycelium — Build Progress Report
Generated: March 16, 2026

---

## What Was Found

The project had a well-scaffolded initial build covering most of the Phase 1 scope from PLAN.md.

### Backend (FastAPI) — Already Built
- `app/main.py` — FastAPI app with CORS, lifespan hooks
- `app/api/clarify.py` — Rule-based clarify endpoint (deterministic, no LLM needed)
- `app/api/retrieve.py` — ChromaDB semantic search endpoint
- `app/api/generate.py` — Full protocol generation (10 sections) + single section regeneration
- `app/api/eval.py` — ENCEPP scoring (29 checklist items) + LLM judge
- `app/api/export.py` — Word document export with regulatory header block
- `app/models/study_input.py` — StudyInput Pydantic model (all fields from PLAN.md B1)
- `app/models/protocol.py` — Protocol, ProtocolSection, CodeSets, ProtocolFlag models
- `app/models/eval_result.py` — EvalResult, ENCEPPItem, JudgeResult models
- `app/services/llm.py` — Claude API wrapper with backoff, all methods
- `app/services/retrieval.py` — ChromaDB PersistentClient with OpenAI embeddings
- `app/services/code_sets.py` — ICD-10/NDC lookup from JSON files
- `app/services/eval_engine.py` — Full 29-item ENCEPP checker implementation
- `app/services/docx_exporter.py` — python-docx with regulatory header table + appendices
- `app/prompts/` — All 10 section prompts + clarify + judge (quality prompts)
- `ingestion/ingest_pdfs.py` — PDF → ChromaDB pipeline (PyMuPDF + pdfplumber)
- `data/code_sets/icd10_by_condition.json` — Seeded with 10+ conditions
- `data/code_sets/ndc_by_drug.json` — Seeded with 10+ drugs
- `requirements.txt` — All dependencies listed

### Frontend (React + TypeScript) — Already Built
- `src/App.tsx` — Router, Nav, 3 routes
- `src/main.tsx` — Entry with QueryClient, BrowserRouter
- `src/types/index.ts` — Full TypeScript type definitions
- `src/api/index.ts` — Typed API client + localStorage study management
- `src/pages/StudyList.tsx` — Study table with status badges, empty state
- `src/pages/StudySetup.tsx` — Form page with generate flow
- `src/pages/ProtocolDraft.tsx` — Draft page with skeleton loading
- `src/components/StudySetupForm/` — Full 4-step wizard (all steps implemented)
  - Step1CoreInputs, Step2DesignDetails, Step3ClinicalContext, Step4FollowUpQuestions
  - useStudyForm.ts with Zod validation, clarify integration
  - StudySetupForm.tsx with progress indicator, step navigation
- `src/components/ProtocolDraftViewer/` — Full viewer workspace
  - ProtocolDraftViewer.tsx — Two-column layout (main + sidebar)
  - ProtocolSectionView.tsx — Edit mode, comment-for-AI, regenerate, diff view, approve
  - SectionNav.tsx — Sticky sidebar navigation with color-coded status dots
  - ReferencePanel.tsx — Retrieved references + code set manager (add/remove codes)
  - EvalPanel.tsx — ENCEPP score, per-item table, LLM judge, improvement list
  - ProtocolToolbar.tsx — Save draft, export DOCX

---

## What Was Built (This Session)

### New Files Created

1. **`backend/app/api/studies.py`** — Full CRUD API for studies:
   - `GET /studies` — list studies
   - `POST /studies` — create new study
   - `GET /studies/{id}` — get study by ID
   - `PUT /studies/{id}` — update study inputs
   - `POST /studies/{id}/protocol` — save full protocol
   - `GET /studies/{id}/versions` — version history stub
   - In-memory store (replace with Supabase for production)

2. **`backend/ingestion/extract_metadata.py`** — LLM-assisted PDF metadata extraction:
   - Heuristic extraction: year, EU PAS number, regulatory body
   - Optional LLM extraction: drug name, disease area, study type, data source, country
   - HMA/EMA catalog integration for pre-population
   - Usage: `python extract_metadata.py --pdf_dir /path --output metadata.json [--use_llm]`

3. **`backend/ingestion/validate_index.py`** — RAG retrieval quality evaluation:
   - 10 built-in test queries covering common study types
   - Precision@3, Precision@10, Mean Reciprocal Rank (MRR)
   - Target: relevant protocol in top-3 for >80% of queries
   - Usage: `python validate_index.py --chroma_dir ./chroma_db`

4. **`backend/tests/test_api.py`** — 16 pytest test cases:
   - Health check, clarify (5 tests), retrieve, studies CRUD (5 tests), eval (2), code sets, export
   - All 16 tests pass in ~1.2 seconds without requiring API keys
   - Run: `pytest backend/tests/ -v`

5. **`docs/api_contracts.md`** — Complete API reference with request/response schemas

6. **`docs/prompt_design.md`** — Prompt engineering decisions and rationale

7. **`docs/encepp_checklist.md`** — ENCEPP items mapped to protocol sections with scoring logic

8. **`docs/domain_glossary.md`** — Epidemiology terms glossary for developers

9. **`README.md`** — Project documentation with quick start guide

### Modified Files

- **`backend/app/main.py`** — Added `studies` router import and include
- **`backend/requirements.txt`** — Updated anthropic/openai to `>=` version pinning (allows newer versions)

---

## Current State

### What Works Without API Keys
- Health check endpoint
- Clarify endpoint (rule-based, no LLM)
- Eval endpoint (ENCEPP rule-based scoring)
- Export DOCX endpoint
- Studies CRUD (in-memory)
- All 16 backend tests

### What Requires ANTHROPIC_API_KEY
- `POST /generate` — Full protocol generation
- `POST /generate/section` — Section regeneration
- `POST /eval` → LLM judge portion (rule-based scoring still works)

### What Requires OPENAI_API_KEY + Populated ChromaDB
- `POST /retrieve` — Semantic search (returns empty list if unavailable)
- Generation quality improves significantly with retrieval context

### Known Limitations / MVP Simplifications
1. **In-memory study storage** — `studies.py` uses a Python dict; data is lost on server restart. Replace with Supabase/Postgres for production
2. **ChromaDB not populated** — The knowledge base (RAG corpus) is empty until you run `ingest_pdfs.py` on the 971 EMA/HMA protocol PDFs
3. **No authentication** — Open API, no user sessions. Add Supabase Auth for production
4. **Single-section version history** — Version history stub returns one entry. Implement history tracking in production
5. **No streaming** — Generation is blocking (~30–90 seconds for full protocol). Add SSE/WebSocket streaming for UX improvement

---

## How to Run

### Backend

```bash
# From repo root
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set environment variables
cp ../.env.example ../.env
echo "ANTHROPIC_API_KEY=sk-ant-..." >> ../.env

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
# From repo root
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

### Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
# Expected: 16 passed in ~1.2s
```

### Populate Knowledge Base

```bash
cd backend
source venv/bin/activate

# Ingest protocol PDFs
python ingestion/ingest_pdfs.py \
  --pdf_dir /path/to/ema_pas_pdfs \
  --chroma_dir ./chroma_db

# Validate retrieval quality
python ingestion/validate_index.py --chroma_dir ./chroma_db
# Target: Precision@3 > 80%
```

---

## TODOs / Next Steps

### Immediate (MVP completion)
- [ ] Set up real API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY)
- [ ] Run `ingest_pdfs.py` on EMA/HMA protocol PDFs
- [ ] Run `validate_index.py` and tune chunking if precision < 80%
- [ ] Test end-to-end flow: form → generate → edit → eval → export

### Short Term (Phase 1 completion)
- [ ] Add streaming for generation (SSE or WebSocket) to improve UX
- [ ] Implement real version history (save each generated version)
- [ ] Replace localStorage with Supabase for multi-session persistence
- [ ] Populate more code sets in `ndc_by_drug.json` from reference PDFs
- [ ] Add OHDSI concept set API integration for code lookup

### Medium Term (Phase 2)
- [ ] Implement LLM tool use: `search_pubmed`, `lookup_code_set`, `get_drug_info`
- [ ] Add Eric's causal inference decision tree (`causal_method_decision_tree` tool)
- [ ] Multi-tenant authentication with Supabase
- [ ] Migrate ChromaDB → Pinecone for production scale
- [ ] Build pilot study with 3 real protocols for M5 milestone

### Quality Improvements
- [ ] Replace keyword-based ENCEPP scoring with LLM-based item scoring
- [ ] Calibrate LLM judge against EMA-reviewed protocols
- [ ] Track confidence level accuracy over time
- [ ] Add feedback loop: researcher ratings → prompt improvement

---

## File Count Summary

| Category | Files |
|----------|-------|
| Backend Python | 18 |
| Backend prompts | 12 |
| Backend data (JSON) | 2 |
| Backend tests | 1 |
| Ingestion scripts | 3 |
| Frontend TypeScript | 17 |
| Documentation | 5 |
| Config/infra | 6 |
| **Total** | **64** |
