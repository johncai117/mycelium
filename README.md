# Mycelium — AI Epidemiological Protocol Writing System

Mycelium is an AI-assisted system that helps epidemiologists at pharmaceutical companies draft regulatory study protocols for real-world evidence (RWE) studies — specifically Post-Authorization Safety Studies (PASS) required by the FDA and EMA.

**The time savings:** Manual protocol drafting takes 2–6 weeks per study. Mycelium targets >50% reduction by automating the structural scaffolding.

---

## How It Works

1. Researcher fills out a multi-step form (drug, indication, data source, design)
2. System asks clarifying questions for any gaps
3. LLM retrieves similar historical protocols from the knowledge base (RAG)
4. LLM generates all 10 protocol sections using Claude claude-sonnet-4-6
5. Researcher reviews, edits inline, and provides AI feedback to regenerate sections
6. ENCEPP scoring evaluates protocol quality (0–100)
7. Export as regulatory-formatted Word document (.docx)

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- `ANTHROPIC_API_KEY` in `.env`

### Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and fill in environment variables
cp ../.env.example ../.env
# Edit .env with your ANTHROPIC_API_KEY

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at `http://localhost:5173`.

---

## Repository Structure

```
mycelium/
├── PLAN.md                          # Full architecture plan
├── README.md                        # This file
├── .env.example                     # Environment variable template
├── Dockerfile                       # Docker container for Claude Code
│
├── backend/                         # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry
│   │   ├── api/
│   │   │   ├── clarify.py           # POST /clarify
│   │   │   ├── retrieve.py          # POST /retrieve
│   │   │   ├── generate.py          # POST /generate, /generate/section
│   │   │   ├── eval.py              # POST /eval
│   │   │   ├── export.py            # POST /export/docx
│   │   │   └── studies.py           # GET/POST/PUT /studies
│   │   ├── services/
│   │   │   ├── llm.py               # Claude API wrapper
│   │   │   ├── retrieval.py         # ChromaDB query logic
│   │   │   ├── code_sets.py         # ICD-10/NDC lookup
│   │   │   ├── eval_engine.py       # ENCEPP checker
│   │   │   └── docx_exporter.py     # Word document generation
│   │   ├── models/
│   │   │   ├── study_input.py       # StudyInput Pydantic model
│   │   │   ├── protocol.py          # Protocol, ProtocolSection models
│   │   │   └── eval_result.py       # EvalResult, ENCEPPItem models
│   │   └── prompts/
│   │       ├── clarify.md           # Clarify system prompt
│   │       ├── section_*.md         # Per-section generation prompts
│   │       └── judge.md             # LLM judge prompt
│   ├── ingestion/
│   │   ├── ingest_pdfs.py           # PDF → ChromaDB pipeline
│   │   ├── extract_metadata.py      # LLM-assisted metadata extraction
│   │   └── validate_index.py        # Retrieval quality evaluation
│   ├── data/
│   │   └── code_sets/
│   │       ├── icd10_by_condition.json
│   │       └── ndc_by_drug.json
│   ├── tests/
│   │   └── test_api.py              # Pytest test suite (16 tests)
│   └── requirements.txt
│
├── frontend/                        # React + TypeScript + Vite
│   └── src/
│       ├── pages/
│       │   ├── StudyList.tsx        # / — Study list
│       │   ├── StudySetup.tsx       # /study/new — Setup form
│       │   └── ProtocolDraft.tsx    # /study/:id/draft — Editor
│       ├── components/
│       │   ├── StudySetupForm/      # 4-step wizard
│       │   └── ProtocolDraftViewer/ # Main editor workspace
│       ├── api/index.ts             # Typed API client
│       └── types/index.ts           # TypeScript type definitions
│
└── docs/
    ├── api_contracts.md             # API reference
    ├── prompt_design.md             # Prompt engineering decisions
    ├── encepp_checklist.md          # ENCEPP items mapped to sections
    └── domain_glossary.md           # Epidemiology terms for developers
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
ANTHROPIC_API_KEY=sk-ant-...      # Required for LLM generation
OPENAI_API_KEY=sk-...             # Required for RAG embeddings
CHROMA_DB_PATH=./backend/chroma_db  # ChromaDB persistence path
SUPABASE_URL=                     # Optional: Supabase for auth/storage
SUPABASE_KEY=                     # Optional: Supabase for auth/storage
```

**Without API keys:**
- Clarify, eval, and export endpoints work without API keys
- Generate endpoints require `ANTHROPIC_API_KEY`
- Retrieve endpoint requires `OPENAI_API_KEY` (and a populated ChromaDB)

---

## API Reference

See `docs/api_contracts.md` for full API documentation.

Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/clarify` | Get clarifying questions for study inputs |
| POST | `/retrieve` | Semantic search over protocol corpus |
| POST | `/generate` | Generate full protocol (10 sections) |
| POST | `/generate/section` | Regenerate single section with feedback |
| POST | `/eval` | ENCEPP scoring + LLM judge |
| POST | `/export/docx` | Download Word document |
| GET | `/studies` | List all studies |
| POST | `/studies` | Create new study |
| GET | `/studies/{id}` | Get study protocol |

---

## Knowledge Base (RAG)

To populate the knowledge base with protocol PDFs:

```bash
# Ingest PDFs from a directory
cd backend
python ingestion/ingest_pdfs.py --pdf_dir /path/to/pdfs --chroma_dir ./chroma_db

# Optional: Extract richer metadata (requires ANTHROPIC_API_KEY for LLM extraction)
python ingestion/extract_metadata.py --pdf_dir /path/to/pdfs --output metadata.json --use_llm

# Validate retrieval quality
python ingestion/validate_index.py --chroma_dir ./chroma_db
```

**Target:** Relevant protocol in top-3 results for >80% of test queries.

Without a populated knowledge base, the system still generates protocols — it just won't have reference examples to draw from.

---

## Running Tests

```bash
cd backend
source venv/bin/activate  # or use your venv
pytest tests/ -v
```

All 16 tests should pass in ~1-2 seconds (no LLM calls required for tests).

---

## Architecture Decisions

- **Section-by-section generation**: Each of 10 sections gets its own LLM call, enabling granular regeneration
- **Rule-based clarify**: The `/clarify` endpoint uses deterministic rules (not LLM) for speed and consistency
- **localStorage for MVP**: Studies are stored in browser localStorage for simplicity; replace with Supabase for multi-user
- **ChromaDB local**: Vector store runs locally in development; migrate to Pinecone for production scale

See `PLAN.md` for the full architecture document.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Radix UI |
| Backend | FastAPI (Python 3.11) |
| LLM | Claude API (`claude-sonnet-4-6`) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector DB | ChromaDB (local) → Pinecone (prod) |
| PDF Parsing | PyMuPDF + pdfplumber fallback |
| DOCX Export | python-docx |
| Auth/Storage | Supabase (production) |
