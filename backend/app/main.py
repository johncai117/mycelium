import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")

from app.api import clarify, retrieve, generate, eval, export, studies

# ── Auth ──────────────────────────────────────────────────────────────────────

DEMO_API_KEY = os.getenv("DEMO_API_KEY", "")
bearer_scheme = HTTPBearer(auto_error=False)

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)):
    if not DEMO_API_KEY:
        return  # No key configured — open access
    if credentials is None or credentials.credentials != DEMO_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

# ── App ───────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.getLogger(__name__).info("Mycelium backend starting up")
    yield
    logging.getLogger(__name__).info("Mycelium backend shutting down")


app = FastAPI(
    title="Mycelium API",
    description="AI-assisted epidemiological protocol writing system",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

_default_origins = ["http://localhost:5173", "http://localhost:3000"]
_env_origins = os.getenv("CORS_ORIGINS", "")
allowed_origins = [o.strip() for o in _env_origins.split(",") if o.strip()] or _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.(pages\.dev|cloudflare\.com)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(clarify.router, dependencies=[Depends(verify_api_key)])
app.include_router(retrieve.router, dependencies=[Depends(verify_api_key)])
app.include_router(generate.router, dependencies=[Depends(verify_api_key)])
app.include_router(eval.router, dependencies=[Depends(verify_api_key)])
app.include_router(export.router, dependencies=[Depends(verify_api_key)])
app.include_router(studies.router, dependencies=[Depends(verify_api_key)])


@app.get("/health")
async def health():
    return {"status": "ok"}
