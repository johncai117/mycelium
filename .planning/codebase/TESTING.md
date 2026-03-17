# Testing Patterns

**Analysis Date:** 2026-03-16

## Test Framework

**Runner:**
- pytest 8.3.3
- Config: No explicit pytest.ini; uses defaults from `conftest.py` in `backend/tests/`

**Assertion Library:**
- pytest assertions (native `assert` statements)

**Run Commands:**
```bash
pytest backend/tests/ -v          # Run all backend tests with verbose output
pytest backend/tests/test_api.py  # Run specific test file
pytest -k test_clarify            # Run tests matching pattern
```

## Test File Organization

**Location:**
- Backend tests co-located in `backend/tests/` directory
- Test file naming: `test_*.py` pattern (`test_api.py`)
- Frontend: No test files found; no test framework configured

**Naming:**
- Test functions: `test_*` prefix (`test_health()`, `test_clarify_complete_inputs()`, `test_create_and_get_study()`)
- Descriptive names indicating what is being tested and expected outcome

**Structure:**
```
backend/tests/
├── conftest.py       # Pytest fixtures and configuration
└── test_api.py       # Main API integration tests
```

## Test Structure

**Suite Organization:**
```python
# From test_api.py - grouped by endpoint with section comments

# ── Sample study input ────────────────────────────────────────────────────────
SAMPLE_INPUT = {
    "drug_name": "Tofacitinib",
    # ... complete test data
}

# ── Health check ─────────────────────────────────────────────────────────────
def test_health():
    response = client.get("/health", headers=AUTH)
    assert response.status_code == 200

# ── Clarify endpoint ──────────────────────────────────────────────────────────
def test_clarify_complete_inputs():
    """When all required fields are provided, should return is_sufficient=True."""
    response = client.post("/clarify", json={"study_inputs": SAMPLE_INPUT}, headers=AUTH)
    # assertions...

# ── Retrieve endpoint ─────────────────────────────────────────────────────────
def test_retrieve_returns_list():
    # test implementation
```

**Patterns:**
- Setup: Test data (`SAMPLE_INPUT`) defined once and reused via dict unpacking: `{**SAMPLE_INPUT, "field": None}`
- Assertions: Direct `assert` statements with inline comments: `assert len(required_qs) == 0, f"Unexpected: {required_qs}"`
- Cleanup: Implicit via pytest fixtures (no explicit teardown observed)

## Mocking

**Framework:**
- No external mocking library detected (no `pytest-mock`, `unittest.mock` imports)
- Mocking done at API level via `TestClient` from FastAPI

**Patterns:**
- API mocking: Tests use `TestClient` against actual app instance
- Data isolation: Each test uses fresh test data (`SAMPLE_INPUT`)
- Mock mode detection: `MOCK_MODE` flag in `api/index.ts` simulates responses when backend unavailable

Example from `test_api.py` - mocking via TestClient:
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)  # Creates test client against real app

def test_clarify_complete_inputs():
    response = client.post("/clarify", json={"study_inputs": SAMPLE_INPUT}, headers=AUTH)
    # TestClient handles request/response without actual network
```

Example from frontend `api/index.ts` - conditional mock responses:
```typescript
export async function clarifyInputs(study_inputs: StudyInput): Promise<ClarifyResponse> {
  if (MOCK_MODE) {
    await delay()  // Simulate network latency
    return MOCK_CLARIFY_RESPONSE
  }
  const { data } = await api.post<ClarifyResponse>('/clarify', { study_inputs })
  return data
}
```

**What to Mock:**
- External API calls when backend unavailable
- Time delays: `await delay(ms)` simulates network latency
- Large data responses: `MOCK_PROTOCOL` provides realistic test data

**What NOT to Mock:**
- Core business logic (rule-based clarification, ENCEPP scoring)
- Database operations (tests use in-memory storage via localStorage)
- Internal service calls (use real services, test their integration)

## Fixtures and Factories

**Test Data:**
- Central `SAMPLE_INPUT` constant in `test_api.py` provides complete study data
- Reused via dict unpacking with overrides:
  ```python
  inputs = {**SAMPLE_INPUT, "data_source": None}
  response = client.post("/clarify", json={"study_inputs": inputs}, headers=AUTH)
  ```
- Mock responses defined as module constants: `MOCK_CLARIFY_RESPONSE`, `MOCK_PROTOCOL`, `MOCK_EVAL_RESULT`

**Location:**
- Test fixtures in `backend/tests/conftest.py`
- Auth headers fixture: `auth_headers` (autouse=True to apply to all tests)
- Test data in `backend/tests/test_api.py` as module constants

Example from `conftest.py`:
```python
@pytest.fixture(autouse=True)
def auth_headers(monkeypatch):
    """Patch TestClient to always send the test auth header."""
    pass

AUTH_HEADERS = {"Authorization": "Bearer test-key"}
```

## Coverage

**Requirements:**
- No explicit coverage enforced; tests are integration-focused
- Test count: ~20 integration tests covering main API endpoints

**View Coverage:**
- No coverage tool configured; run `pytest --cov` if pytest-cov installed

## Test Types

**Unit Tests:**
- Not explicitly separated; most tests are integration tests
- Scope: Individual API endpoints and their request/response contracts
- Approach: Black-box testing via HTTP (TestClient)

Example from `test_api.py`:
```python
def test_clarify_missing_data_source():
    """Missing data_source should trigger a required clarifying question."""
    inputs = {**SAMPLE_INPUT, "data_source": None}
    response = client.post("/clarify", json={"study_inputs": inputs}, headers=AUTH)
    assert response.status_code == 200
    data = response.json()
    assert data["is_sufficient"] is False
    fields = [q["field"] for q in data["questions"]]
    assert "data_source" in fields
```

**Integration Tests:**
- Scope: API endpoints with their dependencies (request validation, response formatting, data flow)
- Approach: Full HTTP request/response cycle via TestClient
- Coverage: All major endpoints (clarify, retrieve, generate, eval, export, studies CRUD)

Example from `test_api.py`:
```python
def test_create_and_get_study():
    """Create a study, then retrieve it by ID."""
    # Create
    create_resp = client.post("/studies", json={"study_inputs": SAMPLE_INPUT}, headers=AUTH)
    assert create_resp.status_code == 201
    study = create_resp.json()
    study_id = study["id"]

    # Get
    get_resp = client.get(f"/studies/{study_id}", headers=AUTH)
    assert get_resp.status_code == 200
    protocol = get_resp.json()
    assert protocol["study_id"] == study_id
```

**E2E Tests:**
- Not implemented; frontend has no test files
- Would require Playwright/Cypress for full user flow testing

## Common Patterns

**Async Testing:**
- FastAPI endpoints use `async def` but TestClient handles async automatically
- No explicit async/await in tests; TestClient manages event loop
- Asyncio plugin: `pytest-asyncio` 0.24.0 installed but not actively used in test_api.py

**Error Testing:**
- HTTP status code assertions: `assert response.status_code == 500`
- Error response structure validation:
  ```python
  def test_eval_empty_protocol():
      """Scoring an empty protocol should return a low score (D grade)."""
      response = client.post("/eval", json={"protocol": protocol_dict}, headers=AUTH)
      assert response.status_code == 200
      data = response.json()
      assert data["encepp_score"] == 0
      assert data["overall_grade"] == "D"
  ```

**Optional field testing:**
- Tests verify optional field handling:
  ```python
  def test_clarify_short_clinical_context():
      """Short/missing clinical_context should trigger an optional question."""
      inputs = {**SAMPLE_INPUT, "clinical_context": "short"}
      response = client.post("/clarify", json={"study_inputs": inputs}, headers=AUTH)
      optional_qs = [q for q in data["questions"] if not q["required"]]
      fields = [q["field"] for q in optional_qs]
      assert "clinical_context" in fields
  ```

**Validation testing:**
- Pydantic models validated implicitly by FastAPI
- Response model validation ensures shape: `response_model=ClarifyResponse`
- Tests verify response structure matches type definitions:
  ```python
  def test_retrieve_returns_list():
      response = client.post("/retrieve", json={"study_inputs": SAMPLE_INPUT}, headers=AUTH)
      assert response.status_code == 200
      data = response.json()
      assert isinstance(data, list)
  ```

## Test Coverage Summary

**Covered endpoints:**
- `GET /health` - Health check (1 test)
- `POST /clarify` - Clarification logic (5 tests)
  - Complete inputs
  - Missing data_source
  - Missing primary_outcome
  - Cohort missing comparators
  - Short clinical_context
- `POST /retrieve` - Protocol retrieval (1 test)
- `POST /studies` - Study creation (1 test as part of CRUD)
- `GET /studies/{id}` - Study retrieval (1 test as part of CRUD)
- `GET /studies` - List studies (1 test)
- `PUT /studies/{id}` - Update study (1 test)
- `GET /studies/{id}/versions` - Version history (1 test)
- `POST /eval` - Protocol evaluation (2 tests)
  - Empty protocol
  - Protocol with content
- `POST /export/docx` - Document export (1 test)
- `Code sets service` - Code set lookup (1 test)

**Not covered:**
- Frontend components (no test files exist)
- React hooks (useStudyForm, form state management)
- API client functions (clarifyInputs, generateProtocol, etc.)
- Error boundaries and edge cases in components
- Network retry logic and timeout handling
- LLM service integration (generate, judge, regenerate endpoints)
- Real ChromaDB retrieval (only mock data tested)

## Test Execution

**Setup:**
- Environment variable `DEMO_API_KEY` set in conftest: `os.environ.setdefault("DEMO_API_KEY", "test-key")`
- Auth headers passed to all requests: `{"Authorization": "Bearer test-key"}`

**Example test run:**
```bash
cd /Users/weinwang/Documents/mycelium
pytest backend/tests/test_api.py::test_clarify_complete_inputs -v

# Output:
# backend/tests/test_api.py::test_clarify_complete_inputs PASSED
```

---

*Testing analysis: 2026-03-16*
