import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")

from app.api import clarify, retrieve, generate, eval, export, studies


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clarify.router)
app.include_router(retrieve.router)
app.include_router(generate.router)
app.include_router(eval.router)
app.include_router(export.router)
app.include_router(studies.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
