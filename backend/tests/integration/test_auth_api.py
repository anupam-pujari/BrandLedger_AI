"""
Integration tests for Authentication API endpoints (T-142).
Tests POST /auth/signup, POST /auth/login, and JWT claims validation.
"""

import pytest
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.config import get_settings


@pytest.fixture
def client():
    return TestClient(app)


def test_auth_signup_flow(client):
    payload = {
        "email": "lead@apexcloud.io",
        "password": "SecurePassword123!",
        "display_name": "Lead Architect",
        "org_name": "ApexCloud Technologies"
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 201
    json_data = response.json()
    assert json_data["success"] is True

    data = json_data["data"]
    assert "access_token" in data
    assert data["user"]["email"] == "lead@apexcloud.io"
    assert data["organisation"]["name"] == "ApexCloud Technologies"

    # Verify JWT claims
    settings = get_settings()
    claims = jwt.decode(data["access_token"], settings.supabase_jwt_secret, algorithms=["HS256"])
    assert claims["email"] == "lead@apexcloud.io"
    assert claims["role"] == "admin"
    assert "org_id" in claims


def test_auth_login_flow(client):
    payload = {
        "email": "reviewer@apexcloud.io",
        "password": "AnyPasswordPassesForDemo"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "access_token" in json_data["data"]
    assert json_data["data"]["user"]["email"] == "reviewer@apexcloud.io"
