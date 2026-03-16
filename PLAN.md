# Mycelium — AI Epidemiological Protocol Writing System
## Full Build Plan v1.0 | March 2026

---

## Overview

Mycelium is an AI-assisted system that helps epidemiologists at pharmaceutical companies draft regulatory study protocols for real-world evidence (RWE) studies — specifically Post-Authorization Safety Studies (PASS) required by the FDA and EMA.

**Core loop:** Researcher provides study context → LLM asks clarifying questions if under-specified → RAG retrieves similar historical protocols → LLM drafts full protocol section-by-section → Researcher reviews and edits inline → LLM revises on comment → Export as regulatory DOCX.

**The time savings:** Manual protocol drafting takes 2–6 weeks per study. The system targets >50% reduction by automating the structural scaffolding.

---

## Phase 1 Scope

Build the **Protocol Drafting Engine** end-to-end:

1. Structured input form with follow-up question logic
2. RAG pipeline over 1,000+ approved regulatory protocols
3. Section-by-section protocol generation via Claude API
4. Inline editing UI with comment → LLM revision loop
5. ENCEPP-based eval + LLM judge for quality scoring
6. DOCX export following regulatory template structure

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + TypeScript + Vite | Component-based, strong typing for complex forms |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI with accessible components |
| UI Design System | [Impeccable Style](https://impeccable.style/#commands-section) | Scientific/professional aesthetic for the workbench |
| Backend API | FastAPI (Python 3.11) | Native ML/AI libs, async, auto OpenAPI docs |
| LLM | Claude API — `claude-sonnet-4-6` | Best for long structured document generation |
| Embeddings | OpenAI `text-embedding-3-small` or Cohere | Cost-effective, high quality for scientific text |
| Vector DB | ChromaDB (local dev) → Pinecone (prod) | Semantic search over protocol corpus |
| PDF Parsing | PyMuPDF (`fitz`) + pdfplumber fallback | Handles multi-column layouts and tables in PDFs |
| DOCX Export | `python-docx` | Template-based Word document generation |
| Auth & Storage | Supabase | Auth, file storage, Postgres for metadata |
| Testing | pytest (backend) + Vitest + Testing Library (frontend) | |

---

## Repository Structure

```
mycelium/
├── PLAN.md                          # This file
├── .gitignore
├── README.md
│
├── frontend/                        # React + TypeScript UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── StudySetupForm/      # Input form + follow-up question flow
│   │   │   ├── ProtocolDraftViewer/ # Section viewer with inline editing
│   │   │   ├── ReferencePanel/      # Sidebar: retrieved historical protocols
│   │   │   ├── CodeSetManager/      # ICD-10/NDC/CPT code set editor
│   │   │   ├── EvalPanel/           # ENCEPP score + LLM judge feedback
│   │   │   └── shared/              # Buttons, inputs, modals, etc.
│   │   ├── pages/
│   │   │   ├── StudySetup.tsx
│   │   │   ├── ProtocolDraft.tsx
│   │   │   └── StudyList.tsx
│   │   ├── api/                     # Typed API client (fetch wrappers)
│   │   ├── types/                   # Shared TypeScript types
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                         # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry
│   │   ├── api/
│   │   │   ├── generate.py          # POST /generate, POST /generate/section
│   │   │   ├── retrieve.py          # POST /retrieve
│   │   │   ├── clarify.py           # POST /clarify (follow-up questions)
│   │   │   ├── eval.py              # POST /eval (ENCEPP scoring)
│   │   │   └── export.py            # POST /export (DOCX)
│   │   ├── services/
│   │   │   ├── llm.py               # Claude API wrapper
│   │   │   ├── retrieval.py         # Vector DB query logic
│   │   │   ├── chunker.py           # PDF → semantic chunks
│   │   │   ├── embedder.py          # Embedding pipeline
│   │   │   ├── code_sets.py         # ICD-10/NDC/CPT lookup
│   │   │   ├── eval_engine.py       # ENCEPP checker + LLM judge
│   │   │   └── docx_exporter.py     # DOCX template generation
│   │   ├── models/
│   │   │   ├── study_input.py       # Pydantic: StudyInput schema
│   │   │   ├── protocol.py          # Pydantic: Protocol, ProtocolSection
│   │   │   └── eval_result.py       # Pydantic: ENCEPPScore, JudgeResult
│   │   └── prompts/
│   │       ├── clarify.md           # System prompt for follow-up questions
│   │       ├── section_*.md         # Per-section generation prompts
│   │       └── judge.md             # LLM judge scoring prompt
│   ├── ingestion/
│   │   ├── ingest_pdfs.py           # Batch PDF → ChromaDB pipeline
│   │   ├── extract_metadata.py      # LLM-assisted metadata extraction per PDF
│   │   └── validate_index.py        # Test retrieval quality on sample queries
│   ├── data/
│   │   └── code_sets/
│   │       ├── icd10_by_condition.json
│   │       └── ndc_by_drug.json
│   ├── tests/
│   └── requirements.txt
│
└── docs/
    ├── api_contracts.md             # API request/response schemas
    ├── prompt_design.md             # Prompt engineering decisions
    ├── encepp_checklist.md          # ENCEPP items mapped to protocol sections
    └── domain_glossary.md           # Epidemiology terms for developers
```

---

## Work Streams

### Work Stream A — Knowledge Base & RAG Pipeline
**Owner:** 1 developer | Python, vector databases, PDF processing

**A1: PDF ingestion pipeline**
- Use `PyMuPDF` to extract text from the 971 protocol PDFs in the EMA/HMA catalog
- Handle multi-column layouts; preserve section headers as metadata
- Script: `backend/ingestion/ingest_pdfs.py`

**A2: Chunking strategy**
- Split by section (not fixed-size chunks) — protocols have clear section headers
- Preserve section label + study metadata as chunk metadata
- Target ~500–800 tokens per chunk

**A3: Metadata extraction per protocol**
- For each PDF, LLM-extract: disease area, drug name, drug class, study type, data source, country, year, regulatory body
- Use the `HMA EMA catalog refined.xlsx` to pre-populate known fields
- Script: `backend/ingestion/extract_metadata.py`

**A4: Embedding pipeline**
- Embed all chunks with OpenAI `text-embedding-3-small`
- Store in ChromaDB with metadata for filtered retrieval
- Index fields: disease, drug_class, study_type, data_source, country, year

**A5: Retrieval API**
```
POST /retrieve
{
  "study_inputs": StudyInput
}
→ [{ "chunk": str, "source_title": str, "source_eu_pas": str, "score": float, "section": str }]
```
Returns top-10 chunks. Frontend shows top-3 source protocols in Reference Panel.

**A6: Retrieval evaluation**
- Build 20-query test set with expected relevant protocols
- Measure precision@3 and precision@10
- Target: relevant protocol in top 3 for >80% of test queries

---

### Work Stream B — Protocol Generation Engine
**Owner:** 1 developer | Python, prompt engineering, LLM APIs

**B1: Study input schema (Pydantic)**
```python
class StudyInput(BaseModel):
    # Required
    drug_name: str
    drug_inn: str | None
    indication: str
    study_type: Literal["cohort", "case_control", "cross_sectional", "other"]

    # Strongly recommended (will trigger clarifying questions if missing)
    data_source: str | None          # Optum, MarketScan, IQVIA, TriNetX, Medicare...
    comparators: list[str] | None
    study_period_start: str | None
    study_period_end: str | None
    geography: str | None

    # Optional / inferable
    regulatory_context: Literal["PASS", "voluntary", "investigator_initiated"] | None
    sponsor: str | None
    primary_outcome: str | None
    population_description: str | None
    index_date_logic: str | None
    washout_days: int | None          # default 180
    new_user_design: bool | None      # default True
    clinical_context: str | None      # free text: anything else relevant
```

**B2: Protocol section taxonomy**
Generate these sections in order:
1. `background` — disease epidemiology, drug mechanism, regulatory context
2. `objectives` — primary + secondary objectives, research questions
3. `study_design` — design type, rationale, study period
4. `study_setting` — data source description, population, geography
5. `cohort_definition` — index date, inclusion/exclusion criteria, washout
6. `variables` — exposures, outcomes, confounders/covariates with code lists
7. `study_size` — sample size rationale or descriptive statement
8. `data_analysis` — descriptive stats, incidence rates, regression, sensitivity analyses
9. `limitations` — bias, confounding, generalizability
10. `ethics` — IRB waiver, HIPAA, data use agreement, consent

**B3: Clarifying question logic (POST /clarify)**
Before generating, the system assesses whether inputs are sufficient:

```
POST /clarify
{ "study_inputs": StudyInput }
→ {
    "is_sufficient": bool,
    "questions": [
      {
        "field": "data_source",
        "question": "Which database will this study use? (e.g., Optum EHR, MarketScan, IQVIA)",
        "why_it_matters": "The data source determines which code types are available and how the enrollment criteria should be written.",
        "options": ["Optum EHR", "MarketScan", "IQVIA PharMetrics", "TriNetX", "Medicare/Medicaid", "Other"],
        "required": true
      },
      ...
    ]
  }
```

**Trigger clarifying questions when:**
- `data_source` is null → always ask (required)
- `comparators` is null → ask unless study_type is cross-sectional
- `primary_outcome` is null → ask (LLM cannot safely infer this)
- `study_period_start` is null → ask
- `clinical_context` is very short (<50 chars) → ask for more detail

**Always flag for epidemiologist judgment (even with full input):**
- Index date logic when drug has complex treatment pathways
- Comparator selection rationale
- Sensitivity analysis choices
- Code set validation

**B4: Generation API**
```
POST /generate
{ "study_inputs": StudyInput, "retrieved_chunks": [...] }
→ {
    "sections": {
      "background": { "content": str, "references_used": [str], "confidence": "high"|"medium"|"low" },
      "objectives": { ... },
      ...
    },
    "code_sets": { "icd10": [...], "ndc": [...], "cpt": [...] },
    "flags": [{ "section": str, "message": str, "severity": "info"|"warning"|"requires_judgment" }]
  }
```

**B5: Section regeneration API**
```
POST /generate/section
{ "section_id": str, "current_content": str, "researcher_comment": str, "study_inputs": StudyInput, "retrieved_chunks": [...] }
→ { "content": str, "change_summary": str }
```

**B6: Prompt design principles**
- Each section has its own system prompt in `backend/prompts/section_*.md`
- Every prompt includes: (1) study inputs, (2) retrieved reference chunks, (3) output format, (4) domain guardrails
- Use XML tags to structure inputs to Claude: `<study_inputs>`, `<reference_protocols>`, `<instructions>`
- Generate one section at a time (not whole protocol in one call) — easier to regenerate individual sections
- Reference [Pfizer SAP paper](venture_incubation/Venture%20Incubation/Methodology%20References/generative%20AI%20writing%20SAP%20Pfizer.pdf) for prompt patterns

**B7: Code set integration**
- Start with curated JSON: `backend/data/code_sets/icd10_by_condition.json`
- Extract code sets from the 40 reference PDFs in the knowledge base
- Future: integrate OHDSI concept sets API

---

### Work Stream C — User Interface (Epidemiologist Workbench)
**Owner:** John | React, TypeScript

**Design system:** Use [Impeccable Style](https://impeccable.style/#commands-section) commands for UI scaffolding. Scientific/professional aesthetic — this is a clinical research tool, not a consumer app.

#### Screen 1: Study List (`/`)
- Table of studies with status (drafting / review / exported)
- "New Study" button → opens Study Setup Form

#### Screen 2: Study Setup Form (`/study/new`)

Multi-step form with progressive disclosure. Steps:

**Step 1 — Core Inputs** (always required)
```
Drug Name (text)                 [required]
Drug INN / Generic Name (text)   [optional, auto-fill from drug name if possible]
Indication / Disease (text)      [required, with autocomplete from catalog]
Study Type (select)              [required]
  → Cohort | Case-Control | Cross-Sectional | Other
```

**Step 2 — Study Design Details**
```
Data Source (select + multi)     [required - triggers clarifying question if empty]
  → Optum EHR | MarketScan | IQVIA | TriNetX | Medicare | Medicaid | Other
Comparators (tag input)          [required for cohort - triggers clarifying question]
Study Period Start (date)        [required]
Study Period End (date)          [required]
Geography (select)               [US | EU | Both | Other]
Regulatory Context (select)      [PASS | Voluntary | Investigator-initiated]
Sponsor (text)                   [optional]
```

**Step 3 — Clinical Context**
```
Primary Outcome (text)           [triggers clarifying question if missing]
Population Description (text)    [free text, hints provided]
Index Date Logic (text)          [free text, show example: "First fill of drug X with 180-day washout"]
Clinical Context / Notes (textarea) [anything else relevant]
New-User Design (toggle)         [default: ON]
Washout Days (number)            [default: 180]
```

**Step 4 — Follow-Up Questions (dynamic)**
- After Step 3, call `POST /clarify`
- If `is_sufficient: false`, show follow-up question cards before generating
- Each card shows: the question, why it matters, and input options
- User can skip optional questions ("I'll specify this later")
- Required questions must be answered before generation can proceed

**Form UX rules:**
- Show help text tooltips on every field (epidemiologist writes the copy)
- Smart defaults pre-fill common values (new-user design ON, washout 180 days)
- Validate in real-time; show domain-specific validation errors (e.g., "Study period predates drug approval")
- "Generate Protocol" button only active when required fields complete + required follow-up questions answered

#### Screen 3: Protocol Draft Viewer (`/study/:id/draft`)

The main workspace. Layout:

```
┌─────────────────────────────────┬──────────────────────┐
│  Protocol Sections (main)       │  Reference Panel     │
│                                 │  (sidebar, 300px)    │
│  [Background]          ✏️ Edit  │  Similar Protocols:  │
│  Lorem ipsum...                 │  • A3921383 (0.92)  │
│                                 │  • DARWIN P3-C1 (0.87)│
│  [Objectives]          ✏️ Edit  │  • BIFAP 2024 (0.84) │
│  Lorem ipsum...                 │                      │
│                                 │  [Open PDF]          │
│  [Study Design]        ✏️ Edit  │                      │
│  Lorem ipsum...                 │  Code Sets:          │
│  ⚠️ Requires judgment           │  ICD-10: M05.9, ...  │
│                                 │  NDC: 00069...       │
│  [Code Set Manager]             │                      │
│  ICD-10 | NDC | CPT             │  Eval Score:         │
│                                 │  ENCEPP: 82/100      │
│  [Eval Panel]                   │  ⚠️ 3 warnings       │
│  ENCEPP score + flags           │                      │
└─────────────────────────────────┴──────────────────────┘
[Export DOCX]  [Save Draft]  [Version History]
```

**Section editor behavior:**
- Click ✏️ Edit → section becomes editable textarea
- "Comment for AI" box appears below: researcher types feedback
- "Regenerate Section" button → calls `POST /generate/section`
- Shows diff of AI changes vs. previous version
- Badge: "AI-generated" | "Edited" | "Approved"
- Sections flagged with ⚠️ show "Requires judgment" banner — highlight fields the epidemiologist must personally validate

**Confidence indicators:**
- `high` → green badge, no warning
- `medium` → yellow badge, soft warning
- `low` → orange badge + requires-judgment flag

#### Screen 4: Eval Panel
- ENCEPP Checklist score (see Evals section below)
- Per-item pass/fail/partial table
- LLM judge narrative feedback
- "Improve" button per item → triggers targeted section regeneration

#### Screen 5: Export
- Preview of final protocol structure
- Select regulatory template (default: ICH E6 / ENCePP)
- Download as `.docx`

---

## AI Tools Given to the LLM

The generation engine has access to these tools via tool use in the Claude API:

| Tool | Purpose |
|------|---------|
| `search_pubmed` | Literature search for disease epidemiology and drug background |
| `lookup_code_set` | Retrieve ICD-10/NDC/CPT codes by condition or drug name |
| `retrieve_protocols` | Semantic search over historical protocol corpus |
| `get_drug_info` | Drug class, mechanism, approval date, label indications |
| `causal_method_decision_tree` | Given study design inputs, recommend appropriate causal inference method (Eric's decision tree) |
| `run_python` | Data simulation, feasibility calculations, sample size estimation |

**Tool call pattern:** The generation engine calls tools during the `background` and `variables` section generation. It does not call tools during `ethics` or `limitations` (pure template sections).

---

## Evals: What Makes a Good Protocol?

### ENCEPP Checklist Scoring

Source: [ENCePP Checklist for Study Protocols](https://encepp.europa.eu/encepp-toolkit/encepp-checklist-study-protocols_en)

Map each checklist item to a protocol section and score automatically:

| ENCEPP Section | Items | Scoring |
|----------------|-------|---------|
| Research Question | Primary objective clearly stated, PICO defined | 0/1 per item |
| Study Design | Design named, rationale given, new-user design documented | 0/1 per item |
| Source Population | Database described, coverage, time period, geography | 0/1 per item |
| Exposure | Drug defined, index date logic, washout period, new-user criteria | 0/1 per item |
| Outcomes | Primary outcome defined with code list, secondary outcomes listed | 0/1 per item |
| Covariates | Confounder list, baseline period, source of covariate data | 0/1 per item |
| Statistical Analysis | Analysis method named, sensitivity analyses listed | 0/1 per item |
| Bias Discussion | Selection bias, information bias, confounding discussed | 0/1 per item |
| Ethics | IRB/ethics board, data use agreement, consent statement | 0/1 per item |

**Scoring endpoint:**
```
POST /eval
{ "protocol": Protocol }
→ {
    "encepp_score": int,          # 0–100
    "encepp_items": [{ "item": str, "score": 0|0.5|1, "finding": str }],
    "judge_narrative": str,       # LLM qualitative assessment
    "improvement_suggestions": [{ "section": str, "suggestion": str }],
    "overall_grade": "A"|"B"|"C"|"D"
  }
```

**Iteration loop:** After eval, researcher can click "Auto-Improve" → system regenerates flagged sections with eval feedback injected into prompt → re-score → repeat until score ≥ threshold (default: 80/100).

### Reference "Good Papers" corpus
The 40 regulatory-approved protocol PDFs in `venture_incubation/Venture Incubation/Reference materials/` are ground truth. Use these for:
- Few-shot examples in generation prompts
- LLM judge calibration ("this protocol scored A by EMA standards — compare to it")
- ENCEPP checklist fine-tuning

### Reference "Bad Paper" signals
From the DARWIN EU and other rejected/amended protocols, note patterns:
- Missing code list for primary outcome
- Index date logic not specified
- Comparator selection not justified
- No sensitivity analysis plan
- Limitations section copy-pasted without study-specific content

---

## API Contracts

### Full API surface (FastAPI)

```
POST /clarify                    # Assess input completeness, return follow-up questions
POST /retrieve                   # Semantic search over protocol corpus
POST /generate                   # Full protocol generation
POST /generate/section           # Regenerate single section with researcher comment
POST /eval                       # ENCEPP scoring + LLM judge
POST /export/docx                # Generate Word document
GET  /studies                    # List studies
POST /studies                    # Create new study
GET  /studies/:id                # Get study with all draft content
PUT  /studies/:id                # Update study inputs
GET  /studies/:id/versions       # Version history
```

### Integration contracts between work streams

```
WS-A → WS-B:  POST /retrieve  {study_inputs} → [{chunk, source, score, section}]
WS-B → WS-C:  POST /generate  {study_inputs, chunks} → {sections: {...}, code_sets, flags}
WS-C → WS-B:  POST /generate/section  {section_id, current_content, comment, study_inputs, chunks}
WS-C → WS-B:  POST /eval  {protocol} → {encepp_score, judge_narrative, ...}
```

---

## Data / RAG Details

### Knowledge Base Sources
1. **EMA/HMA Catalog** — 1,387 registered studies, 971 with downloadable protocol PDFs (`HMA EMA catalog refined.xlsx`)
2. **Reference PDFs** — 40 manually curated protocols in `venture_incubation/Reference materials/`
3. **PubMed search** — live search during generation for background/rationale sections

### Retrieval Strategy
- Embed query as: `"{drug_name} {indication} {study_type} {data_source}"` + `"{primary_outcome} {population_description}"`
- Metadata pre-filter: study_type, geography
- Top 10 chunks returned; UI shows top 3 source protocols with relevance scores
- Each retrieved chunk shows its originating section label so generation prompt can use section-appropriate context

### Causal Inference Decision Tree (Eric)
Eric is building a decision tree for methodology selection. Input: study design parameters. Output: recommended method (propensity score matching, IPTW, difference-in-differences, target trial emulation, etc.) with rationale. This becomes the `causal_method_decision_tree` tool.

### Data Simulation (Qi Wang / GaoGao)
Synthetic patient population data for testing the full pipeline without real EHR data. Should match structure of Optum EHR / MarketScan schemas.

---

## Milestones

| Milestone | Deliverable | Success Criteria | Target |
|-----------|------------|-----------------|--------|
| M0 | Repo setup, env, API keys | All devs can run ingestion on 10 sample PDFs | Week 1 |
| M1 | Knowledge base live | Top-3 retrieval relevant for >80% of test queries | Week 3–4 |
| M2 | Generation MVP | End-to-end: inputs → API → draft text (no UI) | Week 5–6 |
| M3 | UI Alpha | Full draft workflow in browser | Week 7–9 |
| M4 | Eval + Export | ENCEPP scoring live; DOCX export matches template | Week 10–11 |
| M5 | Pilot | 3 real studies; epidemiologist reports >50% time savings | Week 12–14 |

---

## Open Questions (resolve Week 1)

- [ ] Authentication: single org or multi-tenant? Auth provider?
- [ ] Deployment: AWS / GCP / Azure? Data residency requirements?
- [ ] Protocol PDF access: where are the 971 PDFs hosted? Already downloaded?
- [ ] Embedding budget: use OpenAI API or self-hosted model?
- [ ] Primary regulatory template target: ICH E6, ENCePP, or Pfizer internal?
- [ ] Epidemiologist reviewer availability for pilot (M5)?
- [ ] Database subscription: do we have access to Optum / IQVIA for real feasibility queries?
- [ ] PubMed API key / NCBI E-utilities setup

---

## Key References

- ENCePP Checklist: https://encepp.europa.eu/encepp-toolkit/encepp-checklist-study-protocols_en
- Impeccable Style (UI): https://impeccable.style/#commands-section
- CLI-Anything (tool use pattern reference): https://github.com/HKUDS/CLI-Anything
- RLM / discussion on LLM tool use: https://github.com/alexzhang13/rlm
- Pfizer SAP paper: `venture_incubation/Venture Incubation/Methodology References/generative AI writing SAP Pfizer.pdf`
- EPI Protocol System spec: `venture_incubation/Venture Incubation/EPI_Protocol_System_Project_Document.docx`
- HMA/EMA Catalog guide: `venture_incubation/Venture Incubation/HMA_EMA_Catalog_Developer_Guide.docx`
