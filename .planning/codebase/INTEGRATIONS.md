# External Integrations

**Analysis Date:** 2026-03-16

## APIs & External Services

**LLM Providers:**
- Anthropic Claude API - Optional for protocol generation (SDK: `anthropic>=0.34.2`)
  - Auth: Environment variable `ANTHROPIC_API_KEY`
  - Location: Currently referenced but not actively used in generated code paths

- OpenAI API - Embeddings and model inference (SDK: `openai>=1.45.0`)
  - Auth: Environment variable `OPENAI_API_KEY`
  - Usage: Text embedding generation for semantic search (model: `text-embedding-3-small`)
  - Location: `backend/app/services/retrieval.py` line 51-56

**Local LLM Service:**
- Ollama - Local inference server for protocol generation and evaluation
  - Base URL: `http://localhost:11434` (configurable)
  - Model: `qwen3.5:9b`
  - Usage: Generate protocol sections, clarify inputs, evaluate protocols, regenerate sections
  - Location: `backend/app/services/llm.py` (entire service)
  - API: Native Ollama chat endpoint (`/api/chat`)

## Data Storage

**Databases:**
- ChromaDB 0.5.5 - Vector database for protocol embeddings
  - Path: Configurable via `CHROMA_DB_PATH` env var (default: `./backend/chroma_db`)
  - Client: `chromadb.PersistentClient`
  - Collection: `protocols` with cosine similarity metric
  - Usage: Store and retrieve reference protocol chunks for semantic search
  - Location: `backend/app/services/retrieval.py` lines 33-47

**File Storage:**
- Local filesystem only - No cloud storage integration
  - Document export: Generated Word documents served as Blob via FastAPI response
  - Sample data: Stored in `backend/data/` directory
  - ChromaDB data: Persisted to filesystem at configured path

**Caching:**
- In-memory caching via Python service instances
  - ChromaDB connection cached in RetrievalService singleton
  - No distributed cache (Redis, Memcached)

## Authentication & Identity

**Auth Provider:**
- Custom Bearer Token - Simple API key based authentication
  - Implementation: HTTP Bearer scheme via FastAPI `HTTPBearer`
  - Key environment variable: `DEMO_API_KEY`
  - Location: `backend/app/main.py` lines 16-25
  - Protection: Applied to all API routers via dependency injection
  - Frontend integration: Token passed in `Authorization: Bearer {token}` header
  - Location: `frontend/src/api/index.ts` lines 265-269

**No user account system** - Demo-only authentication, no database of users or sessions

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, DataDog, or similar integration

**Logs:**
- Standard Python logging to stdout
  - Format: `%(asctime)s %(levelname)s %(name)s — %(message)s`
  - Location: `backend/app/main.py` line 12
  - Service logs: Info on startup/shutdown, warnings on transient LLM failures
  - Retry logic: Exponential backoff with logging on failures
  - Location: `backend/app/services/llm.py` lines 26-36

**Health Check:**
- Simple health endpoint: `GET /health` returns `{"status": "ok"}`
  - Location: `backend/app/main.py` lines 68-70

## CI/CD & Deployment

**Hosting:**
- Cloudflare Pages - Frontend static site hosting
  - Build command: `cd frontend && npm install && npm run build`
  - Output directory: `frontend/dist`
  - Auto-deployment on push to main branch
  - Documentation: `infra/cloudflare-pages.md`

- Cloudflare Tunnel - Backend API exposure
  - Documentation: `infra/cloudflare-tunnel.md`
  - Allows exposing local/private backend to public internet

- Docker - Containerization
  - Base image: `node:22-bookworm-slim` with Python 3.11 and pip installed
  - Location: `Dockerfile` at project root
  - Includes Claude Code CLI for development workflows

**CI Pipeline:**
- GitHub Actions (inferred from Cloudflare Pages GitHub integration)
  - Automatic deployment on push to main branch
  - No explicit workflow files found; managed by Cloudflare Pages

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` - Anthropic API key (optional, prefixed `sk-ant-`)
- `OPENAI_API_KEY` - OpenAI API key (optional, prefixed `sk-`)
- `DEMO_API_KEY` - Bearer token for API authentication (default: `mycelium-demo-2026`)
- `CORS_ORIGINS` - Comma-separated allowed origins (added to localhost defaults)
- `CHROMA_DB_PATH` - Path to ChromaDB persistence (default: `./backend/chroma_db`)

**Optional env vars:**
- Frontend: `VITE_API_URL` - Backend API base URL (default: `http://localhost:8000`)
- Frontend: `VITE_API_KEY` - API bearer token (populated from `DEMO_API_KEY`)
- Frontend: `VITE_MOCK_MODE` - Enable mock responses (default: auto-detect on GitHub Pages)

**Secrets location:**
- Environment variables only
- `.env` file at project root (not committed)
- See `.env.example` for template

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook endpoints for external services

**Outgoing:**
- None detected - No calls to external webhooks or event systems

---

*Integration audit: 2026-03-16*
