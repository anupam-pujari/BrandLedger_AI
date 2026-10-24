"""
End-to-end full synchronization verification script.
Tests complete API contract matching frontend client expectations:
  - Auth login & token decoding
  - Source of Truth (Rules, Facts, Terms, Assets, Rulebook Compiler)
  - Content workflow (Intent lock, hybrid review check, FindingProof citations,
    accept/dismiss sync, submit for review, self-approval guard, PDF export)
  - Rule Health, Recurring Mistakes & Dashboard Stats
"""

import sys
import os
import io

# Add backend directory to sys.path
backend_dir = r"c:\D\TechCircuitHAckathon\BrandLedger_AI\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_sync_suite():
    print("[1/8] Verifying Root & Health Endpoints...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    assert res.json()["data"]["status"] == "healthy"

    print("[2/8] Verifying Demo Login & Role-Based Auth...")
    # Login with demo Creator account (Marcus Vance)
    login_res = client.post("/api/v1/auth/login", json={
        "email": "marcus.vance@apexcloud.io",
        "password": "Password123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    creator_token = login_res.json()["data"]["access_token"]
    creator_headers = {"Authorization": f"Bearer {creator_token}"}
    creator_id = login_res.json()["data"]["user"]["id"]

    # Login as Brand Manager (Sarah Lin)
    bm_res = client.post("/api/v1/auth/login", json={
        "email": "sarah.lin@apexcloud.io",
        "password": "Password123!"
    })
    assert bm_res.status_code == 200, f"BM Login failed: {bm_res.text}"
    bm_token = bm_res.json()["data"]["access_token"]
    bm_headers = {"Authorization": f"Bearer {bm_token}"}

    print("[3/8] Verifying Source of Truth Knowledge Layer Sync...")
    # List rules
    rules_res = client.get("/api/v1/rules", headers=creator_headers)
    assert rules_res.status_code == 200
    rules = rules_res.json()["data"]["rules"]
    assert len(rules) > 0, "Rules should be populated"

    # List facts (check content and claim_text fields)
    facts_res = client.get("/api/v1/facts", headers=creator_headers)
    assert facts_res.status_code == 200
    facts = facts_res.json()["data"]["facts"]
    assert len(facts) > 0, "Facts should be populated"
    for f in facts:
        assert f.get("content") or f.get("claim_text"), f"Fact {f['id']} missing content/claim_text"

    # Create new fact using frontend payload structure
    new_fact_res = client.post("/api/v1/facts", json={
        "fact_code": "F-TEST-99",
        "content": "ApexCloud delivers verified latency under 5ms globally.",
        "owner_name": "Marcus Vance",
        "owner_email": "marcus@apexcloud.io",
        "valid_until": "2028-12-31",
        "status": "active",
        "tags": ["latency", "performance"]
    }, headers=creator_headers)
    assert new_fact_res.status_code == 201, f"Create fact failed: {new_fact_res.text}"
    created_fact = new_fact_res.json()["data"]["fact"]
    assert created_fact["content"] == "ApexCloud delivers verified latency under 5ms globally."
    assert created_fact["claim_text"] == "ApexCloud delivers verified latency under 5ms globally."

    # List terms (check replacement & preferred_replacement)
    terms_res = client.get("/api/v1/terms", headers=creator_headers)
    assert terms_res.status_code == 200
    terms = terms_res.json()["data"]["terms"]
    assert len(terms) > 0, "Terms should be populated"

    # Create new term using frontend replacement & reason fields
    new_term_res = client.post("/api/v1/terms", json={
        "term": "unbreakable",
        "replacement": "resilient",
        "term_type": "banned",
        "reason": "Absolute stability guarantee is prohibited without SLA tier."
    }, headers=creator_headers)
    assert new_term_res.status_code in [200, 201], f"Create term failed: {new_term_res.text}"
    created_term = new_term_res.json()["data"]["term"]
    assert created_term["preferred_replacement"] == "resilient"
    assert created_term["replacement"] == "resilient"

    # List assets
    assets_res = client.get("/api/v1/assets", headers=creator_headers)
    assert assets_res.status_code == 200

    print("[4/8] Verifying Content Draft Creation & Intent Lock...")
    draft_res = client.post("/api/v1/content", json={
        "title": "Q3 Cloud Platform Launch Announcement",
        "content_type": "text",
        "body": "ApexCloud is thrilled to introduce our newest cloud servers with a 100% uptime guarantee! Our telemetry engine cuts reporting time by up to 60%. Visit [click here](https://apexcloud.io) for pricing.",
        "intent_purpose": "Product launch announcement",
        "intent_audience": "Enterprise DevOps & Infrastructure Directors",
        "intent_key_message": "High reliability and performance",
        "rules_only_mode": False
    }, headers=creator_headers)
    assert draft_res.status_code == 201, f"Draft creation failed: {draft_res.text}"
    content_item = draft_res.json()["data"]["content_item"]
    content_id = content_item["id"]
    # Check that current_version is serialized as an object with body
    assert content_item.get("current_version") is not None
    assert content_item["current_version"]["body"] is not None
    assert content_item["current_version"]["version_number"] == 1

    print("[5/8] Verifying Review Engine Trigger & FindingProof Citations...")
    check_res = client.post(f"/api/v1/content/{content_id}/check", headers=creator_headers)
    assert check_res.status_code == 202, f"Check trigger failed: {check_res.text}"
    check_data = check_res.json()["data"]
    findings = check_data["findings"]
    assert len(findings) > 0, "Expected review engine to identify findings"

    # Verify FindingProof is populated on every finding
    for f in findings:
        assert f.get("proof") is not None, f"Finding {f['id']} missing proof citation"
        proof = f["proof"]
        assert proof.get("source_document") is not None, f"Proof missing source_document in {f['id']}"
        assert proof.get("source_quote") is not None or f.get("evidence_quote") is not None

    print(f"   -> Review caught {len(findings)} findings with verifiable proof citations.")

    print("[6/8] Verifying Finding Resolution (Accept & Dismiss)...")
    finding_to_accept = findings[0]
    resolve_res = client.patch(
        f"/api/v1/content/{content_id}/findings/{finding_to_accept['id']}",
        json={"status": "accepted", "edited_text": "designed to provide high reliability"},
        headers=creator_headers
    )
    assert resolve_res.status_code == 200, f"Resolve finding failed: {resolve_res.text}"
    assert resolve_res.json()["data"]["finding"]["status"] == "accepted"

    # If critical finding, verify mandatory dismissal reason
    crit_finding = next((f for f in findings if f.get("severity") == "critical"), None)
    if crit_finding:
        # Dismiss without reason should fail
        fail_res = client.patch(
            f"/api/v1/content/{content_id}/findings/{crit_finding['id']}",
            json={"status": "dismissed"},
            headers=creator_headers
        )
        assert fail_res.status_code in [400, 422]
        assert fail_res.json()["error"]["code"] == "FINDING_REASON_REQUIRED"

        # Dismiss with reason should succeed
        ok_res = client.patch(
            f"/api/v1/content/{content_id}/findings/{crit_finding['id']}",
            json={"status": "dismissed", "dismiss_reason": "Approved by senior legal counsel for beta test."},
            headers=creator_headers
        )
        assert ok_res.status_code == 200

    print("[7/8] Verifying Submit for Review, Role Guards, & Self-Approval Prevention...")
    # Submit for review
    sub_res = client.post(f"/api/v1/content/{content_id}/submit-for-review", headers=creator_headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["data"]["content_item"]["status"] == "in_review"

    # Author (Creator) cannot approve
    self_appr_res = client.post(f"/api/v1/content/{content_id}/approve", headers=creator_headers)
    assert self_appr_res.status_code == 403
    assert self_appr_res.json()["error"]["code"] in ["CONTENT_SELF_APPROVAL", "AUTH_INSUFFICIENT_ROLE"]

    # Brand Manager (different user) approves
    bm_appr_res = client.post(f"/api/v1/content/{content_id}/approve", headers=bm_headers)
    assert bm_appr_res.status_code == 200, f"BM approval failed: {bm_appr_res.text}"
    approved_item = bm_appr_res.json()["data"]["content_item"]
    assert approved_item["status"] == "approved"

    # Export certified PDF approval certificate
    pdf_res = client.get(f"/api/v1/content/{content_id}/export/pdf", headers=creator_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert b"%PDF-1.4" in pdf_res.content

    print("[8/8] Verifying Insights (Rule Health, Recurring Mistakes & Dashboard)...")
    # Rule Health
    rh_res = client.get("/api/v1/insights/rule-health", headers=creator_headers)
    assert rh_res.status_code == 200
    rh_rules = rh_res.json()["data"]["rules"]
    assert len(rh_rules) > 0
    for r in rh_rules:
        assert "accept_rate" in r
        assert "dismiss_rate" in r

    # Recurring Mistakes
    rm_res = client.get("/api/v1/insights/recurring-mistakes", headers=creator_headers)
    assert rm_res.status_code == 200
    mistakes = rm_res.json()["data"]["insights"]
    assert len(mistakes) > 0
    for m in mistakes:
        assert "group" in m
        assert "total_violations" in m
        assert "top_issues" in m

    # Dashboard Stats
    dash_res = client.get("/api/v1/insights/dashboard", headers=creator_headers)
    assert dash_res.status_code == 200
    stats = dash_res.json()["data"]["stats"]
    assert stats["total_content_items"] > 0
    assert stats["approval_rate"] > 0
    assert stats["total_findings_detected"] > 0
    assert stats["active_rules_count"] > 0
    assert stats["active_facts_count"] > 0
    assert stats["review_engine_health"] == "operational"

    print("\nALL 8/8 FULL-STACK SYNCHRONIZATION AUDIT GATES PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_sync_suite()
