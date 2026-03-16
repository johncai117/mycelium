---                                                                                                                                                                   
  You are building Mycelium — an AI-assisted epidemiological protocol writing system.                                                                                   
  The full plan is in PLAN.md. Read it carefully before doing anything else.                                                                                            
                                                                                                                                                                        
  Your job is to scaffold the entire project: frontend, backend, and supporting files.                                                                                
  Work through this systematically, completing each piece fully before moving on.

  ---

  ## SETUP FIRST

  1. Read PLAN.md in full.
  2. Create the full directory structure described in the "Repository Structure" section.
  3. Do NOT create placeholder/stub files — write real, working code for each file.

  ---

  ## BACKEND (FastAPI + Python)

  ### 1. `backend/requirements.txt`
  Include: fastapi, uvicorn, anthropic, openai, chromadb, pymupdf, pdfplumber, python-docx,
  pydantic, httpx, python-dotenv, pytest, pandas, openpyxl

  ### 2. `backend/app/models/study_input.py`
  Pydantic model exactly as specified in PLAN.md section B1. Include all fields with
  types, Optional annotations, defaults (washout_days=180, new_user_design=True).

  ### 3. `backend/app/models/protocol.py`
  Pydantic models for: ProtocolSection (content, references_used, confidence level,
  ai_generated bool), Protocol (study_id, study_inputs, sections dict keyed by section name,
  code_sets, flags, version, created_at, updated_at)

  ### 4. `backend/app/models/eval_result.py`
  Pydantic models for: ENCEPPItem, ENCEPPScore, JudgeResult, EvalResult

  ### 5. `backend/app/services/llm.py`
  Claude API wrapper using the `anthropic` Python SDK (model: claude-sonnet-4-6).
  Methods:
  - `generate_section(section_name, study_inputs, retrieved_chunks, system_prompt)` → str
  - `clarify_inputs(study_inputs)` → list of ClarifyQuestion objects
  - `judge_protocol(protocol)` → JudgeResult
  - `regenerate_section(section_id, current_content, researcher_comment, study_inputs, retrieved_chunks)` → str
  Use streaming where appropriate. Handle rate limits with exponential backoff.

  ### 6. `backend/app/services/retrieval.py`
  ChromaDB client wrapper.
  - `query(study_inputs, n_results=10)` → list of RetrievedChunk
  - `add_chunks(chunks_with_metadata)`
  - `get_collection_stats()` → dict
  Collection name: "protocols"

  ### 7. `backend/app/services/code_sets.py`
  Load from `backend/data/code_sets/icd10_by_condition.json` and `ndc_by_drug.json`.
  Method: `lookup(condition_or_drug: str)` → dict with icd10, ndc, cpt lists.
  Seed those JSON files with at least 10 real conditions/drugs
  (rheumatoid arthritis, Type 2 diabetes, atrial fibrillation, COPD, asthma,
  tofacitinib, apixaban, rivaroxaban, adalimumab, semaglutide).

  ### 8. `backend/app/services/eval_engine.py`
  ENCEPP checklist scorer + LLM judge.
  - Hardcode the ENCEPP checklist items (9 sections, ~30 items total) from PLAN.md.
  - `score_protocol(protocol)` → EvalResult
  - Each item: check if the relevant protocol section contains the required element
    (regex + LLM fallback for nuanced items)
  - Compute 0–100 score, letter grade (A≥90, B≥80, C≥70, D<70)

  ### 9. `backend/app/services/docx_exporter.py`
  Use python-docx to generate a formatted Word document.
  - Heading styles for each section
  - Standard regulatory header: study title, sponsor, version, date
  - All 10 protocol sections in order
  - Code set tables (ICD-10, NDC, CPT) as formatted Word tables
  - Return bytes for download

  ### 10. `backend/app/api/clarify.py`
  POST /clarify
  Body: { study_inputs: StudyInput }
  Response: { is_sufficient: bool, questions: [ClarifyQuestion] }
  ClarifyQuestion: { field, question, why_it_matters, options: list[str] | null, required: bool }

  Trigger logic (implement exactly):
  - data_source is None → required question
  - comparators is None AND study_type is "cohort" → required question
  - primary_outcome is None → required question
  - study_period_start or study_period_end is None → required question
  - clinical_context is None or len < 50 → optional question

  ### 11. `backend/app/api/retrieve.py`
  POST /retrieve
  Body: { study_inputs: StudyInput }
  Response: [{ chunk, source_title, source_eu_pas, score, section }]

  ### 12. `backend/app/api/generate.py`
  POST /generate
  Body: { study_inputs: StudyInput, retrieved_chunks: list }
  Response: { sections: dict, code_sets: dict, flags: list }

  POST /generate/section
  Body: { section_id, current_content, researcher_comment, study_inputs, retrieved_chunks }
  Response: { content, change_summary }
  Generate sections in order: background → objectives → study_design → study_setting →
  cohort_definition → variables → study_size → data_analysis → limitations → ethics.
  Call llm.py services. Include retrieved chunks as context in prompts.

  ### 13. `backend/app/api/eval.py`
  POST /eval
  Body: { protocol: Protocol }
  Response: EvalResult

  ### 14. `backend/app/api/export.py`
  POST /export/docx
  Body: { protocol: Protocol }
  Response: FileResponse (.docx)

  ### 15. `backend/app/main.py`
  FastAPI app with all routers mounted. CORS configured for localhost:5173 (Vite dev).
  Include health check: GET /health → { status: "ok" }

  ### 16. `backend/prompts/clarify.md`
  System prompt for the clarify endpoint. Instructs Claude to assess if study inputs are
  sufficient to generate a high-quality regulatory protocol, and return structured questions
  for any gaps. Tone: collaborative scientific colleague, not a form validator.

  ### 17. `backend/prompts/section_background.md`
  System prompt for background section generation. Include: what to cover (disease burden,
  incidence/prevalence, drug mechanism, indication, regulatory history, rationale for study),
  output length (~400-600 words), format (flowing paragraphs, not bullets), reference style.

  ### 18. `backend/prompts/section_objectives.md`
  System prompt for objectives section. PICO format. Primary + secondary objectives.
  Research questions. Standard regulatory language.

  ### 19. `backend/prompts/section_cohort_definition.md`
  System prompt for cohort definition. Must specify: index date logic, washout period,
  new-user design criteria, inclusion criteria, exclusion criteria. Flag if index date
  logic is ambiguous and requires epidemiologist judgment.

  ### 20. `backend/prompts/judge.md`
  System prompt for LLM judge. Evaluate the protocol against ENCEPP checklist standards.
  Provide: overall narrative assessment, specific weaknesses, improvement suggestions per section.
  Calibrate against EMA-approved PASS protocol standards.

  ### 21. `backend/ingestion/ingest_pdfs.py`
  Script to:
  1. Walk a directory of PDF files
  2. Extract text with PyMuPDF (fallback to pdfplumber)
  3. Split into semantic chunks by section headers
  4. Embed with OpenAI text-embedding-3-small
  5. Store in ChromaDB with metadata
  Run as: `python ingest_pdfs.py --pdf_dir /path/to/pdfs --chroma_dir ./chroma_db`

  ### 22. `backend/data/code_sets/icd10_by_condition.json`
  Seed with real ICD-10 codes for 10+ conditions (see #7 above).
  Format: { "rheumatoid_arthritis": { "codes": [{"code": "M05.9", "description": "..."}], "notes": "..." }, ... }

  ### 23. `backend/data/code_sets/ndc_by_drug.json`
  Seed with representative NDC codes or drug ingredient codes for 10+ drugs.

  ---

  ## FRONTEND (React + TypeScript + Vite + Tailwind + shadcn/ui)

  ### Setup
  - `frontend/package.json` with all deps: react, react-dom, typescript, vite, tailwindcss,
    @shadcn/ui (or radix-ui), react-router-dom, react-hook-form, zod, @tanstack/react-query,
    axios, lucide-react
  - `frontend/vite.config.ts` — proxy /api → http://localhost:8000
  - `frontend/tailwind.config.ts` — extend with a neutral scientific color palette
    (slate grays, blue-600 accent, clean whites). Reference Impeccable Style aesthetic.
  - `frontend/tsconfig.json`

  ### Types: `frontend/src/types/index.ts`
  TypeScript interfaces mirroring backend Pydantic models:
  StudyInput, ProtocolSection, Protocol, ClarifyQuestion, RetrievedChunk,
  ENCEPPItem, EvalResult, StudyListItem

  ### API Client: `frontend/src/api/index.ts`
  Typed fetch wrappers for all backend endpoints. Use axios + react-query.
  Functions: clarifyInputs, retrieveProtocols, generateProtocol, regenerateSection,
  evalProtocol, exportDocx, getStudies, createStudy, getStudy, updateStudy

  ### Page 1: Study List — `frontend/src/pages/StudyList.tsx`
  - Clean table: Study name, Drug, Indication, Status badge, Last updated, Actions
  - "New Study" button (primary, top right)
  - Status badges: Drafting (blue), In Review (yellow), Exported (green)
  - Empty state with illustration and call-to-action

  ### Component: Study Setup Form — `frontend/src/components/StudySetupForm/`

  `StudySetupForm.tsx` — 4-step wizard with progress indicator at top.

  `Step1CoreInputs.tsx`
  - Drug Name (text input, required)
  - Drug INN (text input, optional, smaller)
  - Indication (text input with autocomplete suggestions, required)
  - Study Type (segmented control / radio cards): Cohort | Case-Control | Cross-Sectional | Other
  - Each radio card shows a short description of the design type

  `Step2DesignDetails.tsx`
  - Data Source (multi-select checkboxes with icons): Optum EHR | MarketScan | IQVIA | TriNetX | Medicare | Medicaid | Other
  - Comparators (tag input — type and press enter to add tags)
  - Study Period (date range picker: Start → End)
  - Geography (select): US | EU | Both | Other
  - Regulatory Context (select): PASS | Voluntary | Investigator-initiated
  - Sponsor (text, optional)

  `Step3ClinicalContext.tsx`
  - Primary Outcome (text input with help tooltip)
  - Population Description (textarea, 3 rows, with placeholder example)
  - Index Date Logic (text input with example: "First fill of [drug] with 180-day washout")
  - Clinical Context / Additional Notes (textarea, 4 rows)
  - New-User Design (toggle switch, default ON, with explanation)
  - Washout Days (number input, default 180, shown only if new-user design is ON)

  `Step4FollowUpQuestions.tsx`
  - Calls POST /clarify after Step 3
  - Loading state while waiting
  - If is_sufficient: true → show green checkmark + "Ready to generate"
  - If is_sufficient: false → render question cards:
    - Each card: question text, why_it_matters (collapsible), input (text/select/tags based on options)
    - Required questions: red asterisk, cannot skip
    - Optional questions: "Skip for now" link
  - "Generate Protocol" button at bottom (disabled until required questions answered)

  `useStudyForm.ts` — React hook managing form state across all 4 steps,
  validation with Zod schema matching StudyInput type.

  ### Component: Protocol Draft Viewer — `frontend/src/components/ProtocolDraftViewer/`

  `ProtocolDraftViewer.tsx` — main layout: two-column (main + sidebar)

  `ProtocolSection.tsx` — renders one section:
  - Section title (h2) with confidence badge (green/yellow/orange)
  - "AI-generated" | "Edited" | "Approved" badge
  - Content (rendered as formatted paragraphs)
  - Requires-judgment banner (⚠️  orange) if flag present
  - Edit button → switches to edit mode:
    - Textarea with current content
    - "Comment for AI" textarea below ("What should change?")
    - "Regenerate" button → calls POST /generate/section
    - "Save edits" button (saves without LLM)
    - "Cancel" button
  - After regeneration: show diff view (old vs new, green/red highlights)
  - "Approve" button → marks section as approved

  `SectionNav.tsx` — sticky left mini-nav showing all 10 sections as anchors
  with color-coded status dots

  `ReferencePanel.tsx` — right sidebar:
  - "Retrieved References" heading
  - List of top-3 similar protocols: title, EU PAS number, relevance score (%)
  - "View PDF" button per protocol (opens in new tab or modal)
  - Code Sets section below: tabs for ICD-10 | NDC | CPT
    - Table: Code | Description | Source
    - "Add code" inline input
    - "Remove" per row

  `EvalPanel.tsx` — collapsible panel at bottom:
  - Overall score: large number (e.g., "82/100") with letter grade (B)
  - Progress bar
  - Per-section ENCEPP item table: Item | Status (✓/⚠️ /✗) | Finding
  - LLM judge narrative (expandable)
  - "Auto-Improve" button → triggers targeted regeneration of failing sections
  - "Re-score" button

  `ProtocolToolbar.tsx` — sticky top bar:
  - Study name + drug + indication (read-only summary)
  - "Eval Protocol" button
  - "Export DOCX" button (download)
  - "Save Draft" button
  - "Version History" dropdown (shows list of saved versions)

  ### Page 2: Protocol Draft — `frontend/src/pages/ProtocolDraft.tsx`
  Compose ProtocolDraftViewer with the toolbar. Load study from API on mount.
  Show skeleton loading state while generating.

  ### Page 3: Study Setup — `frontend/src/pages/StudySetup.tsx`
  Renders StudySetupForm. On submit: POST /generate → navigate to /study/:id/draft

  ### App shell: `frontend/src/App.tsx`
  React Router routes:
  - `/` → StudyList
  - `/study/new` → StudySetup
  - `/study/:id/draft` → ProtocolDraft
  Minimal nav header: "Mycelium" logo + nav links

  ### `frontend/src/main.tsx`
  App entry. QueryClientProvider wrapper.

  ---

  ## IMPORTANT IMPLEMENTATION NOTES

  1. **Use real Anthropic SDK patterns** — `import Anthropic from "@anthropic-ai/sdk"`
     (Python backend). Model: `claude-sonnet-4-6`. Do not mock LLM calls.

  2. **Environment variables** — backend reads from `.env`:
     ANTHROPIC_API_KEY, OPENAI_API_KEY, CHROMA_DB_PATH, SUPABASE_URL, SUPABASE_KEY
     Create a `.env.example` with all keys listed (no values).

  3. **Prompts use XML tags** for Claude: wrap inputs as `<study_inputs>`,
     `<reference_protocols>`, `<instructions>`, `<current_draft>`, `<researcher_comment>`

  4. **Section generation order matters** — generate background first (sets context
     for all other sections). Pass previously generated sections as context when
     generating later sections.

  5. **ChromaDB persistence** — use PersistentClient with path from env var.
     Do not use in-memory client in production code.

  6. **DOCX template structure** — regulatory protocols have a specific header block:
     Protocol Title, Protocol Version, Date, Sponsor, Study Code. Include this in export.

  7. **Error handling** — all API endpoints return structured errors:
     `{ "error": str, "detail": str, "field": str | null }`

  8. **The form is the UX core** — invest in the Study Setup Form quality.
     Help tooltips on every field. Clear placeholder text. Real validation messages.

  9. **Confidence levels in UI** — high=green, medium=yellow, low=orange.
     Low confidence sections always show the ⚠️  requires-judgment banner.

  10. **Do not skip the code set JSON files** — seed them with real codes.
      These are used in demo/testing and are critical for the variables section generation.

  ---

  ## FINAL CHECKLIST

  After scaffolding everything, verify:
  - [ ] `cd backend && uvicorn app.main:app --reload` starts without errors
  - [ ] `cd frontend && npm install && npm run dev` starts without errors
  - [ ] All 10 backend API endpoints return valid responses (can use stub data if ChromaDB not populated)
  - [ ] Study Setup Form wizard navigates through all 4 steps
  - [ ] Follow-up question cards render when /clarify returns is_sufficient: false
  - [ ] Protocol Draft Viewer renders all 10 sections with edit mode working
  - [ ] ENCEPP eval panel renders with score
  - [ ] DOCX export downloads a valid .docx file
  - [ ] .env.example exists with all required env var names

  ---
  A few notes on using it:

  - Run from the repo root: claude --dangerously-skip-permissions
  - The prompt references PLAN.md so Claude can look up details it needs mid-build
  - It will generate ~30+ files — watch for the frontend package.json / vite.config.ts to confirm it doesn't get lazy on the setup files
  - After it finishes, you'll need to populate .env with real API keys before the backend LLM calls work; the RAG retrieval works without keys using stub data