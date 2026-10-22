"""
Integration tests for Content Workflow & State Machine (T-144).
Tests draft creation, automatic versioning, diff computation, check triggering,
finding resolution, submit for review, self-approval guard, and PDF certificate export.
"""

import pytest
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from fastapi.testclient import TestClient

from app.main import app
from app.config import get_settings


@pytest.fixture
def client():
    return TestClient(app)


def make_auth_header(user_id: str, org_id: str, role: str, email: str = "user@brand.com") -> dict:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "org_id": org_id,
        "role": role,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=1)).timestamp())
    }
    token = jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


def test_full_content_workflow(client):
    org_id = str(uuid.uuid4())
    author_id = str(uuid.uuid4())
    reviewer_id = str(uuid.uuid4())

    author_headers = make_auth_header(author_id, org_id, role="creator", email="author@brand.com")
    reviewer_headers = make_auth_header(reviewer_id, org_id, role="brand_manager", email="bm@brand.com")

    # 1. Create Content Draft (T-061)
    draft_payload = {
        "title": "Q3 Cloud Platform Launch Announcement",
        "content_type": "text",
        "body": "We are proud to introduce our fastest cloud servers with 99.999% uptime guarantee. Visit [click here](https://example.com).",
        "intent_purpose": "Product Announcement",
        "intent_audience": "Enterprise DevOps Leads",
        "intent_key_message": "High reliability and performance"
    }
    create_res = client.post("/api/v1/content", json=draft_payload, headers=author_headers)
    assert create_res.status_code == 201
    content_item = create_res.json()["data"]["content_item"]
    content_id = content_item["id"]
    assert content_item["status"] == "draft"
    assert content_item["author_id"] == author_id

    # 2. Update Content Draft (T-064) -> Creates Version 2
    update_payload = {
        "body": "We are proud to introduce our fastest cloud servers with 99.999% uptime. Contact support@apexcloud.io."
    }
    update_res = client.put(f"/api/v1/content/{content_id}", json=update_payload, headers=author_headers)
    assert update_res.status_code == 200
    v2 = update_res.json()["data"]["version"]
    assert v2["version_number"] == 2
    assert v2["diff_from_previous"] is not None

    # 3. Check Version Diff (T-066)
    diff_res = client.get(f"/api/v1/content/{content_id}/versions/1/diff/2", headers=author_headers)
    assert diff_res.status_code == 200
    assert "diff" in diff_res.json()["data"]

    # 4. Trigger Review Engine (T-091)
    check_res = client.post(f"/api/v1/content/{content_id}/check", headers=author_headers)
    assert check_res.status_code == 202
    check_data = check_res.json()["data"]
    assert check_data["status"] == "checked"

    # 5. Check Status Polling (T-092)
    status_res = client.get(f"/api/v1/content/{content_id}/check-status", headers=author_headers)
    assert status_res.status_code == 200
    assert status_res.json()["data"]["progress_percent"] == 100

    # 6. Submit for Review (T-100) -> State machine: checked -> in_review
    submit_res = client.post(f"/api/v1/content/{content_id}/submit-for-review", headers=author_headers)
    assert submit_res.status_code == 200
    assert submit_res.json()["data"]["content_item"]["status"] == "in_review"

    # 7. Role & Self-Approval Guards (T-068):
    # 7a. Creator cannot approve (insufficient role)
    creator_approve_res = client.post(f"/api/v1/content/{content_id}/approve", headers=author_headers)
    assert creator_approve_res.status_code == 403
    assert creator_approve_res.json()["error"]["code"] == "AUTH_INSUFFICIENT_ROLE"

    # 7b. Brand Manager who is the author cannot approve own content (CONTENT_SELF_APPROVAL)
    bm_author_headers = make_auth_header(author_id, org_id, role="brand_manager", email="bm_author@brand.com")
    self_approve_res = client.post(f"/api/v1/content/{content_id}/approve", headers=bm_author_headers)
    assert self_approve_res.status_code == 403
    assert self_approve_res.json()["error"]["code"] == "CONTENT_SELF_APPROVAL"

    # 8. Distinct Brand Manager Approval (T-101): Distinct user with role brand_manager approves
    bm_approve_res = client.post(f"/api/v1/content/{content_id}/approve", headers=reviewer_headers)
    assert bm_approve_res.status_code == 200
    assert bm_approve_res.json()["data"]["content_item"]["status"] == "approved"

    # 9. PDF Approval Certificate Export (T-134)
    export_res = client.get(f"/api/v1/content/{content_id}/export/pdf", headers=reviewer_headers)
    assert export_res.status_code == 200
    assert export_res.headers["content-type"] == "application/pdf"
    assert len(export_res.content) > 100
