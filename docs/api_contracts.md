# Mycelium API Contracts

FastAPI auto-generates interactive docs at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` (ReDoc). This document summarizes the key contracts for frontend integration and work stream collaboration.

---

## Base URL

Development: `http://localhost:8000`
Frontend proxy: `/api/*` → `http://localhost:8000/*` (configured in `vite.config.ts`)

---

## Authentication

MVP: No authentication.
Production: Bearer token via Supabase JWT (to be implemented).

---

## Standard Error Response

All endpoints return structured errors on failure:

```json
{
  "error": "error_code",
  "detail": "Human-readable description",
  "field": "field_name_or_null"
}
```

HTTP status codes: `400` (bad input), `404` (not found), `500` (server error).

---

## Endpoints

### GET /health

Health check.

**Response:**
```json
{ "status": "ok" }
```

---

### POST /clarify

Assess whether study inputs are sufficient and return clarifying questions for any gaps.

**Request:**
```json
{
  "study_inputs": { ...StudyInput }
}
```

**Response:**
```json
{
  "is_sufficient": true,
  "questions": [
    {
      "field": "data_source",
      "question": "Which database will this study use?",
      "why_it_matters": "The data source determines available code types...",
      "options": ["Optum EHR", "MarketScan", "IQVIA PharMetrics", ...],
      "required": true
    }
  ]
}
```

**Trigger rules (deterministic, no LLM):**
- `data_source` is null → required question
- `comparators` is null AND `study_type` is `"cohort"` → required question
- `primary_outcome` is null → required question
- `study_period_start` or `study_period_end` is null → required question
- `clinical_context` is null or < 50 chars → optional question

---

### POST /retrieve

Semantic search over the protocol corpus (ChromaDB). Returns top-10 similar chunks.
Returns empty list if ChromaDB is not populated (RAG unavailable).

**Request:**
```json
{
  "study_inputs": { ...StudyInput }
}
```

**Response:**
```json
[
  {
    "chunk": "Section text from similar protocol...",
    "source_title": "EUPAS12345 - Tofacitinib RA PASS",
    "source_eu_pas": "EUPAS12345",
    "score": 0.923,
    "section": "cohort_definition"
  }
]
```

---

### POST /generate

Generate a complete protocol (all 10 sections) from study inputs and retrieved context.
**Warning:** This is a slow endpoint (10 LLM calls sequentially). Expect 30–90 seconds.

**Request:**
```json
{
  "study_inputs": { ...StudyInput },
  "retrieved_chunks": [ ...RetrievedChunk[] ]
}
```

**Response:**
```json
{
  "sections": {
    "background": {
      "content": "...",
      "references_used": [],
      "confidence": "high",
      "ai_generated": true
    },
    "objectives": { ... },
    ...
  },
  "code_sets": {
    "icd10": [{ "code": "M05.9", "description": "...", "source": "ICD-10-CM" }],
    "ndc": [],
    "cpt": []
  },
  "flags": [
    {
      "section": "cohort_definition",
      "message": "Requires epidemiologist review and validation before submission.",
      "severity": "requires_judgment"
    }
  ]
}
```

---

### POST /generate/section

Regenerate a single protocol section with researcher feedback incorporated.

**Request:**
```json
{
  "section_id": "cohort_definition",
  "current_content": "Current text of the section...",
  "researcher_comment": "Add more detail about the washout period rationale.",
  "study_inputs": { ...StudyInput },
  "retrieved_chunks": [ ...RetrievedChunk[] ]
}
```

**Response:**
```json
{
  "content": "Revised section text...",
  "change_summary": "Section revised per researcher feedback. Added ~42 words."
}
```

---

### POST /eval

Score a protocol against the ENCEPP checklist (29 items, rule-based) and run an LLM judge for qualitative assessment.

**Request:**
```json
{
  "protocol": { ...Protocol }
}
```

**Response:**
```json
{
  "encepp_score": 82,
  "overall_grade": "B",
  "encepp_items": [
    {
      "item": "Primary objective clearly stated",
      "section": "objectives",
      "score": 1.0,
      "finding": "Present (matched: primary objective, primary aim)."
    },
    ...
  ],
  "judge_narrative": "This protocol demonstrates strong methodological foundations...",
  "improvement_suggestions": [
    {
      "section": "cohort_definition",
      "suggestion": "Add explicit language about the baseline assessment window..."
    }
  ]
}
```

**Grade scale:** A ≥ 90, B ≥ 80, C ≥ 70, D < 70

---

### POST /export/docx

Generate a formatted Word document of the protocol.

**Request:**
```json
{
  "protocol": { ...Protocol }
}
```

**Response:** Binary `.docx` file with `Content-Disposition: attachment`.

---

### GET /studies

List all studies in the in-memory store.

**Response:**
```json
[
  {
    "id": "uuid",
    "drug_name": "Tofacitinib",
    "indication": "Rheumatoid Arthritis",
    "study_type": "cohort",
    "status": "drafting",
    "updated_at": "2026-03-16T12:00:00",
    "sponsor": "Pfizer Inc."
  }
]
```

---

### POST /studies

Create a new study record.

**Request:**
```json
{ "study_inputs": { ...StudyInput } }
```

**Response:** `201 Created` with `StudyListItem`

---

### GET /studies/{study_id}

Get a full protocol by study ID.

**Response:** `Protocol` object or `404`

---

### PUT /studies/{study_id}

Update study inputs.

**Request:** `{ "study_inputs": { ...StudyInput } }`

**Response:** Updated `Protocol` or `404`

---

### POST /studies/{study_id}/protocol

Save a complete protocol (e.g., after generation).

**Request:** `{ "protocol": { ...Protocol } }`

---

### GET /studies/{study_id}/versions

Get version history (stub returns current version only in MVP).

---

## Data Models

### StudyInput

| Field | Type | Required | Default |
|-------|------|----------|---------|
| drug_name | string | yes | - |
| indication | string | yes | - |
| study_type | `cohort\|case_control\|cross_sectional\|other` | yes | - |
| drug_inn | string? | no | null |
| data_source | string? | no | null |
| comparators | string[]? | no | null |
| study_period_start | string? (date) | no | null |
| study_period_end | string? (date) | no | null |
| geography | string? | no | null |
| regulatory_context | `PASS\|voluntary\|investigator_initiated`? | no | null |
| sponsor | string? | no | null |
| primary_outcome | string? | no | null |
| population_description | string? | no | null |
| index_date_logic | string? | no | null |
| washout_days | int? | no | 180 |
| new_user_design | bool? | no | true |
| clinical_context | string? | no | null |

### ProtocolSection

| Field | Type |
|-------|------|
| content | string |
| references_used | string[] |
| confidence | `high\|medium\|low` |
| ai_generated | bool |

### Protocol

| Field | Type |
|-------|------|
| study_id | string (UUID) |
| study_inputs | StudyInput |
| sections | `Record<section_name, ProtocolSection>` |
| code_sets | CodeSets |
| flags | ProtocolFlag[] |
| version | int |
| created_at | datetime |
| updated_at | datetime |

---

## Section Names

The 10 protocol sections (in generation order):

1. `background`
2. `objectives`
3. `study_design`
4. `study_setting`
5. `cohort_definition`
6. `variables`
7. `study_size`
8. `data_analysis`
9. `limitations`
10. `ethics`
