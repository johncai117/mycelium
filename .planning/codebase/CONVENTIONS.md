# Coding Conventions

**Analysis Date:** 2026-03-16

## Naming Patterns

**Files:**
- TypeScript/React files use PascalCase for component exports: `StudySetupForm.tsx`, `EvalPanel.tsx`
- Utility/hook files use camelCase with descriptive names: `useStudyForm.ts`, `api/index.ts`
- Python files use snake_case: `study_input.py`, `eval_engine.py`, `code_sets.py`
- Directories use lowercase with underscores: `app/services/`, `backend/tests/`

**Functions:**
- Frontend functions: camelCase (`clarifyInputs()`, `generateProtocol()`, `evalProtocol()`)
- Python functions: snake_case (`_rule_based_questions()`, `_score_item()`, `_confidence_from_inputs()`)
- Handler/callback functions: prefix with action name (`handleNext()`, `handleSubmit()`, `runEval()`)
- Private functions: prefix with underscore (`_load_prompt()`, `_call_with_backoff()`)

**Variables:**
- Frontend state: camelCase (`currentStep`, `clarifyLoading`, `evalResult`, `isGenerating`)
- Python: snake_case (`study_inputs`, `response_model`, `prior_sections`, `max_retries`)
- Constants: UPPER_SNAKE_CASE (`STEPS`, `AUTH_HEADERS`, `SAMPLE_INPUT`, `DEMO_API_KEY`)
- React props interfaces: use `Props` suffix (`Props` in component files)

**Types:**
- TypeScript interfaces: PascalCase (`StudyInput`, `Protocol`, `ClarifyResponse`, `EvalResult`)
- Type aliases: PascalCase (`StudyType`, `RegulatoryContext`, `Confidence`, `Grade`)
- Pydantic models: PascalCase (`StudyInput`, `Protocol`, `ClarifyQuestion`, `ClarifyResponse`)

## Code Style

**Formatting:**
- Frontend: ESLint with TypeScript support configured in `package.json`
- ESLint rules enforce max-warnings=0, catching unused directives
- No explicit .prettierrc found; relies on default formatting
- Backend: No explicit formatter configured; follows Python conventions

**Linting:**
- Frontend: `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`
- TypeScript strict mode enabled in `tsconfig.json`: `strict: true`
- ESLint plugins: `@typescript-eslint/eslint-plugin`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

## Import Organization

**Order (Frontend):**
1. External libraries: `react`, `lucide-react`, `react-router-dom`
2. Radix UI components: `@radix-ui/react-*`
3. Internal utilities: `@/api`, `@/types`, `@/data`, `@/lib`
4. Component imports with relative paths for local files
5. Type imports: `import type { ... }`

Example from `StudySetupForm.tsx`:
```typescript
import { useState } from 'react'
import { Check } from 'lucide-react'
import { useStudyForm } from './useStudyForm'
import { clarifyInputs } from '@/api'
import type { StudyInput } from '@/types'
```

**Order (Backend):**
1. Python standard library: `os`, `logging`, `json`, `time`
2. Third-party frameworks: `fastapi`, `pydantic`, `urllib`
3. Internal modules: `from app.models`, `from app.services`, `from app.api`

Example from `main.py`:
```python
import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Security
from app.api import clarify, retrieve, generate, eval, export, studies
```

**Path Aliases:**
- Frontend: `@/*` resolves to `./src/*` (defined in `tsconfig.json`)
- No path aliases in backend; uses relative imports

## Error Handling

**Frontend:**
- Errors caught at component level in try-catch blocks
- Loading and error states managed separately with `useState`
- User-friendly error messages displayed: `"Could not reach the server. You can still generate with current inputs."`
- Network failures trigger fallback behavior rather than hard failure

Example from `StudySetupForm.tsx`:
```typescript
try {
  const result = await clarifyInputs(inputs)
  setClarifyQuestions(result.questions)
  setIsSufficient(result.is_sufficient)
} catch {
  setClarifyError('Could not reach the server. You can still generate with current inputs.')
  setIsSufficient(true)
}
```

**Backend:**
- FastAPI HTTPException raised with status codes and detail objects
- Try-catch blocks wrap API handlers to catch and log errors
- Error response format: `{"error": "error_code", "detail": "message", "field": null}`
- Logging at ERROR level for all exceptions

Example from `clarify.py`:
```python
try:
    questions = _rule_based_questions(request.study_inputs)
    is_sufficient = not any(q.required for q in questions)
    return ClarifyResponse(is_sufficient=is_sufficient, questions=questions)
except Exception as e:
    logger.error(f"Clarify error: {e}")
    raise HTTPException(status_code=500, detail={"error": "clarify_failed", "detail": str(e), "field": None})
```

## Logging

**Frontend:**
- No centralized logging; console errors used implicitly
- No explicit log statements observed; relies on browser console

**Backend:**
- Python `logging` module used throughout
- Logger obtained via `logger = logging.getLogger(__name__)`
- Log format: `"%(asctime)s %(levelname)s %(name)s — %(message)s"`
- Log levels: INFO for startup/shutdown, ERROR for exceptions, WARNING for retries

Example from `main.py`:
```python
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)
logger.info("Mycelium backend starting up")
```

## Comments

**When to Comment:**
- Comments used for section dividers and logical grouping: `# ── Auth ──────────────────────────────────────────`
- Docstrings for function descriptions appear in Python docstrings
- JSDoc/TSDoc not extensively used; function names are descriptive

Example pattern from backend:
```python
# ── Clarify endpoint ──────────────────────────────────────────────────────────
@router.post("/clarify", response_model=ClarifyResponse)
async def clarify(request: ClarifyRequest):
```

**Function-level documentation:**
- Python: Single-line docstrings for deterministic functions
- Example from `clarify.py`: `"""Deterministic trigger logic per PLAN.md B3."""`

## Function Design

**Size:**
- Frontend components typically 150-300 lines
- Python functions kept small: `_score_item()` ~25 lines, `_confidence_from_inputs()` ~15 lines
- Long functions broken into helper functions with descriptive names

**Parameters:**
- Props passed as single destructured object in React components: `{ onSubmit, isGenerating }`
- Python functions use positional args or named args
- Default parameters used: `response_model=ClarifyResponse`, `max_retries: int = 3`

**Return Values:**
- Frontend: Components return JSX.Element
- Frontend hooks return objects with multiple values: `{ form, currentStep, nextStep, ... }`
- Python endpoints return Pydantic models or raise HTTPException

## Module Design

**Exports:**
- Frontend: Components exported as named exports (`export function StudySetupForm()`)
- React hooks exported from utility files: `export function useStudyForm()`
- API functions exported as named exports: `export async function clarifyInputs()`
- No barrel files (re-exports) observed; imports are direct

**File Organization:**
- Components placed in `/src/components/` with subdirectories by feature
- API logic centralized in `/src/api/index.ts`
- Type definitions in `/src/types/index.ts`
- Utilities in `/src/lib/`
- Backend: Models in `app/models/`, API routes in `app/api/`, services in `app/services/`

## Type Safety

**TypeScript:**
- Strict mode enabled: `"strict": true`
- Explicit type annotations required: `function useStudyForm(): { form, currentStep, ... }`
- Interface-based props contracts in components
- Type aliases for domain models: `type StudyType = 'cohort' | 'case_control' | ...`

Example from `types/index.ts`:
```typescript
export interface StudyInput {
  drug_name: string
  indication: string
  study_type: StudyType
  drug_inn?: string
  data_source?: string
  comparators?: string[]
  // ... optional fields
}
```

**Python:**
- Pydantic models for request/response validation
- Optional types used: `Optional[str] = None`
- Literal types for enums: `Literal["cohort", "case_control", ...]`
- Type hints in function signatures

## Validation

**Frontend:**
- Zod schema validation via `@hookform/resolvers/zod`
- Form validation happens at hook level in `useStudyForm()`
- Schema defined as `studyInputSchema` with validation rules

Example from `useStudyForm.ts`:
```typescript
export const studyInputSchema = z.object({
  drug_name: z.string().min(1, 'Drug name is required'),
  indication: z.string().min(1, 'Indication is required'),
  study_type: z.enum(['cohort', 'case_control', 'cross_sectional', 'other']),
  // ... more fields with validation
})
```

**Backend:**
- Pydantic BaseModel for automatic validation
- Request models define expected input shape
- FastAPI validates and raises HTTP 422 on invalid input

Example from `study_input.py`:
```python
class StudyInput(BaseModel):
    drug_name: str
    indication: str
    study_type: Literal["cohort", "case_control", "cross_sectional", "other"]
    drug_inn: Optional[str] = None
```

---

*Convention analysis: 2026-03-16*
