# Technology Stack

**Analysis Date:** 2026-03-16

## Languages

**Primary:**
- TypeScript 5.5.3 - Frontend React application
- Python 3.11 - Backend FastAPI server

**Secondary:**
- JavaScript (Node.js) - Build tooling and frontend packaging

## Runtime

**Environment:**
- Node.js 22 (Bookworm slim base image in Docker)
- Python 3.11 (via Docker)

**Package Manager:**
- npm (frontend dependencies)
- pip (Python dependencies)
- Lockfile: `package-lock.json` present for frontend, `requirements.txt` for backend (no lockfile)

## Frameworks

**Core:**
- React 18.3.1 - Frontend UI framework
- FastAPI 0.115.0 - Backend API server
- Uvicorn 0.30.6 - ASGI server for FastAPI

**Testing:**
- pytest 8.3.3 - Python unit tests
- pytest-asyncio 0.24.0 - Async test support

**Build/Dev:**
- Vite 5.4.2 - Frontend build tool and dev server
- TypeScript 5.5.3 - Type checking
- ESLint 9.9.0 - Linting
- TailwindCSS 3.4.11 - Utility CSS framework
- PostCSS 8.4.44 - CSS processing

## Key Dependencies

**Frontend UI Components:**
- @radix-ui/react-* (v1.1.0-2.1.1) - Headless UI component library (11 packages: accordion, dialog, dropdown-menu, label, popover, progress, select, separator, slot, switch, tabs, toast, tooltip)
- lucide-react 0.441.0 - Icon library

**Frontend State & Forms:**
- @tanstack/react-query 5.56.2 - Server state management and data fetching
- react-hook-form 7.53.0 - Form handling
- zod 3.23.8 - Schema validation and parsing
- @hookform/resolvers 3.9.0 - Bridge between react-hook-form and validation schemas

**Frontend Utilities:**
- react-router-dom 6.26.2 - Client-side routing
- axios 1.7.7 - HTTP client
- clsx 2.1.1 - Conditional className utilities
- class-variance-authority 0.7.0 - Component variant management
- tailwind-merge 2.5.2 - Merge Tailwind classes intelligently

**Backend AI/LLM:**
- anthropic >=0.34.2 - Anthropic API client
- openai >=1.45.0 - OpenAI API client (for embeddings)

**Backend Document Processing:**
- pymupdf 1.24.10 - PDF extraction
- pdfplumber 0.11.4 - PDF parsing
- python-docx 1.1.2 - Word document creation/export
- openpyxl 3.1.5 - Excel file handling
- pandas 2.2.3 - Data manipulation

**Backend Vector Database:**
- chromadb 0.5.5 - Vector database for embeddings and semantic search

**Backend Utilities:**
- pydantic 2.8.2 - Data validation and serialization
- pydantic-settings 2.5.2 - Configuration management from environment
- python-dotenv 1.0.1 - Load .env files
- httpx 0.27.2 - Async HTTP client
- python-multipart 0.0.12 - Form data parsing

**Backend Dev:**
- pytest 8.3.3 - Test framework
- pytest-asyncio 0.24.0 - Async test support

## Configuration

**Environment:**
- Frontend: `VITE_API_URL` (base URL for backend), `VITE_API_KEY` (bearer token), `VITE_MOCK_MODE` (enable mock responses)
- Backend: `ANTHROPIC_API_KEY` (Anthropic models), `OPENAI_API_KEY` (OpenAI embeddings), `DEMO_API_KEY` (API auth), `CORS_ORIGINS` (allowed frontend origins), `CHROMA_DB_PATH` (vector database location)
- See `.env.example` for required variables

**Build:**
- Frontend: `vite.config.ts` - Vite configuration with React plugin and TypeScript support
- Frontend: `tsconfig.json` - TypeScript configuration with strict mode enabled
- Frontend: `tailwind.config.ts` - Tailwind CSS configuration
- Frontend: `.eslintrc` - ESLint rules (strict, no unused variables)
- Frontend: `postcss.config.js` - PostCSS configuration for Tailwind

## Platform Requirements

**Development:**
- Node 22+ for frontend builds
- Python 3.11+ for backend
- Docker (optional but recommended)
- Ollama (local LLM service at `http://localhost:11434`)
- ChromaDB (persistent vector database, default path: `./backend/chroma_db`)

**Production:**
- Docker container (Node 22 + Python 3.11 base image)
- Cloudflare Pages (frontend deployment)
- Cloudflare Tunnel (backend API exposure)
- OpenAI API (embeddings)
- Anthropic API (optionally used for protocol generation)

---

*Stack analysis: 2026-03-16*
