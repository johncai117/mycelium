import os
import pytest

# Set test API key before app is imported
os.environ.setdefault("DEMO_API_KEY", "test-key")


@pytest.fixture(autouse=True)
def auth_headers(monkeypatch):
    """Patch TestClient to always send the test auth header."""
    pass


AUTH_HEADERS = {"Authorization": "Bearer test-key"}
