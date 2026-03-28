"""
JWT authentication middleware for Supabase-issued tokens.

Supabase uses ES256 (asymmetric) signing; we verify using the JWKS endpoint.
Falls back to DEMO_API_KEY header/bearer for local development.
"""

import os
import logging
import time
from typing import Optional

import httpx
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json" if SUPABASE_URL else ""
DEMO_API_KEY = os.getenv("DEMO_API_KEY", "")

bearer_scheme = HTTPBearer(auto_error=False)

# Simple in-process JWKS cache
_jwks_client: Optional[PyJWKClient] = None
_jwks_last_fetched: float = 0
_JWKS_CACHE_TTL = 3600  # 1 hour


def _get_jwks_client() -> Optional[PyJWKClient]:
    global _jwks_client, _jwks_last_fetched
    if not JWKS_URL:
        return None
    now = time.time()
    if _jwks_client is None or (now - _jwks_last_fetched) > _JWKS_CACHE_TTL:
        _jwks_client = PyJWKClient(JWKS_URL)
        _jwks_last_fetched = now
    return _jwks_client


def _verify_supabase_jwt(token: str) -> dict:
    """Verify a Supabase ES256 JWT and return its claims."""
    client = _get_jwks_client()
    if client is None:
        raise HTTPException(status_code=401, detail="Auth not configured (missing SUPABASE_URL)")
    try:
        signing_key = client.get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            options={"verify_aud": False},  # Supabase tokens have no audience claim
        )
        return claims
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> dict:
    """
    FastAPI dependency that returns the authenticated user's claims.

    Priority:
    1. Valid Supabase JWT → returns full JWT claims dict
    2. DEMO_API_KEY match → returns synthetic demo user (dev bypass)
    3. No SUPABASE_URL and no DEMO_API_KEY configured → open access (returns empty dict)
    """
    token = credentials.credentials if credentials else None

    # Dev/demo bypass
    if token and DEMO_API_KEY and token == DEMO_API_KEY:
        return {"sub": "demo", "email": "demo@localhost", "role": "authenticated"}

    # No auth configured at all → open access
    if not SUPABASE_URL and not DEMO_API_KEY:
        return {}

    if not token:
        raise HTTPException(status_code=401, detail="Authorization header required")

    return _verify_supabase_jwt(token)
