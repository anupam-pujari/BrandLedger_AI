"""
BrandProof Content Lifecycle, Review Execution & Workflow API Router.

Implements the complete review journey from planing.txt (Section 4 & Section 5):
  1. Draft creation with Intent Lock (purpose, audience, key message)
  2. Review check trigger -> runs hybrid engine & Claim Passport
  3. Finding resolution (accept / edit / dismiss with mandatory reason for critical items)
  4. Role-based review queue (creator submit -> reviewer request changes -> manager approve)
  5. Version diffing and PDF approval record export
"""

import difflib
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status

from app.api.auth import get_current_user_from_header
from app.engine.orchestrator import ReviewOrchestrator
from app.schemas import (
    AIDisclosure,
    ApiResponse,
    Comment,
    CommentCreateRequest,
    ContentCreateRequest,
    ContentItem,
    ContentUpdateRequest,
    Finding,
    FindingReasonRequiredError,
    FindingResolveRequest,
    InsufficientRoleError,
    InvalidTransitionError,
    SelfApprovalError,
)
from app.store import store

router = APIRouter(tags=["Content Review & Governance"])


# ==============================================================================
# Content Items & Versions
def _serialize_content_item(item: Dict[str, Any]) -> ContentItem:
    data = dict(item)
    latest = data.get("latest_version")
    if latest:
        data["current_version"] = latest
    return ContentItem(**data)


@router.get("/content", response_model=ApiResponse[Dict[str, Any]])
async def list_content(
    status: Optional[str] = Query(None),
    author_id: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    items = store.list_content(org_id=user["org_id"], status=status, author_id=author_id)
    return ApiResponse(data={"content_items": [_serialize_content_item(c) for c in items]})


@router.post("/content", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def create_content(
    payload: ContentCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    item = store.create_content(
        org_id=user["org_id"],
        author_id=user["id"],
        data=payload.model_dump(),
    )
    return ApiResponse(data={"content_item": _serialize_content_item(item)})


@router.get("/content/{content_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_content(content_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    item = store.get_content(org_id=user["org_id"], content_id=content_id)
    return ApiResponse(data={"content_item": _serialize_content_item(item)})


@router.put("/content/{content_id}", response_model=ApiResponse[Dict[str, Any]])
async def update_content(
    content_id: str,
    payload: ContentUpdateRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    body = payload.body or ""
    item = store.update_content(
        org_id=user["org_id"],
        content_id=content_id,
        body=body,
        author_id=user["id"],
    )
    if payload.rules_only_mode is not None:
        item["rules_only_mode"] = payload.rules_only_mode
    if payload.title:
        item["title"] = payload.title
    if payload.intent_purpose:
        item["intent_purpose"] = payload.intent_purpose
    if payload.intent_audience:
        item["intent_audience"] = payload.intent_audience
    if payload.intent_key_message:
        item["intent_key_message"] = payload.intent_key_message

    return ApiResponse(data={
        "content_item": _serialize_content_item(item),
        "version": item.get("latest_version"),
    })


# ==============================================================================
# Review Engine Execution (planing.txt Section 4, Stage 3)
# ==============================================================================

@router.post("/content/{content_id}/check", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_202_ACCEPTED)
async def trigger_review_check(
    content_id: str,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    """
    Executes Hybrid Review Engine on current draft:
    Deterministic checks -> Privacy masking -> Claim Passport & Tone -> Intent Lock ranking.
    """
    content_item = store.get_content(org_id=user["org_id"], content_id=content_id)
    version = content_item["latest_version"]
    rules = store.list_rules(org_id=user["org_id"], status="approved")
    facts = store.list_facts(org_id=user["org_id"])
    terms = store.list_terms(org_id=user["org_id"])
    assets = store.list_assets(org_id=user["org_id"])
    org_settings = store.get_org_settings(user["org_id"])

    review_result = await ReviewOrchestrator.run_review(
        content_item=content_item,
        content_version=version,
        rules=rules,
        facts=facts,
        terms=terms,
        assets=assets,
        org_settings=org_settings,
    )

    # Persist findings to store
    store.save_findings(content_id=content_id, findings=review_result["findings"])

    # Persist AI disclosure record if generated
    if review_result.get("ai_disclosure"):
        store.save_ai_disclosure(content_id=content_id, disclosure=review_result["ai_disclosure"])

    content_item["status"] = "checked"
    content_item["findings_count"] = review_result["findings_count"]
    review_result["status"] = "checked"

    return ApiResponse(data=review_result)


@router.get("/content/{content_id}/check-status", response_model=ApiResponse[Dict[str, Any]])
async def get_check_status(content_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    item = store.get_content(org_id=user["org_id"], content_id=content_id)
    return ApiResponse(data={
        "status": "completed" if item["status"] != "draft" else "idle",
        "findings_count": item.get("findings_count", 0),
        "progress_percent": 100 if item["status"] != "draft" else 0,
    })


# ==============================================================================
# Findings Management & Resolution (planing.txt Line 73, Line 100)
# ==============================================================================

@router.get("/content/{content_id}/findings", response_model=ApiResponse[Dict[str, Any]])
async def list_findings(
    content_id: str,
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    findings = store.list_findings(org_id=user["org_id"], content_id=content_id, category=category, severity=severity)
    return ApiResponse(data={"findings": [Finding(**f) for f in findings]})


@router.patch("/content/{content_id}/findings/{finding_id}", response_model=ApiResponse[Dict[str, Any]])
async def resolve_finding(
    content_id: str,
    finding_id: str,
    payload: FindingResolveRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    resolved = store.resolve_finding(
        org_id=user["org_id"],
        content_id=content_id,
        finding_id=finding_id,
        status=payload.status,
        dismiss_reason=payload.dismiss_reason,
        edited_text=payload.edited_text,
        user_id=user["id"],
    )
    return ApiResponse(data={"finding": Finding(**resolved)})


# ==============================================================================
# Review & Approval Workflow (planing.txt Line 60-75)
# ==============================================================================

@router.post("/content/{content_id}/submit-for-review", response_model=ApiResponse[Dict[str, Any]])
async def submit_for_review(content_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    item = store.submit_for_review(org_id=user["org_id"], content_id=content_id, user_id=user["id"])
    return ApiResponse(data={"content_item": _serialize_content_item(item)})


@router.post("/content/{content_id}/approve", response_model=ApiResponse[Dict[str, Any]])
async def approve_content(content_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    """
    Brand Manager final approval.
    Enforces governance rule: No author can approve their own content (planing.txt Line 84).
    """
    if user.get("role") not in ["brand_manager", "admin"]:
        raise InsufficientRoleError("Action requires brand_manager or admin role.")

    item = store.approve_content(org_id=user["org_id"], content_id=content_id, user_id=user["id"])
    return ApiResponse(data={"content_item": _serialize_content_item(item)})


@router.post("/content/{content_id}/request-changes", response_model=ApiResponse[Dict[str, Any]])
async def request_changes(
    content_id: str,
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    notes = payload.get("notes", "")
    item = store.request_changes(org_id=user["org_id"], content_id=content_id, notes=notes, user_id=user["id"])
    return ApiResponse(data={"content_item": _serialize_content_item(item)})


# ==============================================================================
# Version Comparison & Diff (planing.txt Line 103, Line 139)
# ==============================================================================

@router.get("/content/{content_id}/versions/{v1}/diff/{v2}", response_model=ApiResponse[Dict[str, Any]])
async def get_version_diff(
    content_id: str,
    v1: int,
    v2: int,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    ver1 = store.get_version(content_id, v1)
    ver2 = store.get_version(content_id, v2)

    text1 = ver1.get("body", "") if ver1 else ""
    text2 = ver2.get("body", "") if ver2 else ""

    diff_ops: List[List[Any]] = []

    try:
        from diff_match_patch import diff_match_patch
        dmp = diff_match_patch()
        diffs = dmp.diff_main(text1, text2)
        dmp.diff_cleanupSemantic(diffs)
        diff_ops = [[op, txt] for op, txt in diffs]
    except Exception:
        # Standard difflib fallback
        matcher = difflib.SequenceMatcher(None, text1, text2)
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                diff_ops.append([0, text1[i1:i2]])
            elif tag == "delete":
                diff_ops.append([-1, text1[i1:i2]])
            elif tag == "insert":
                diff_ops.append([1, text2[j1:j2]])
            elif tag == "replace":
                diff_ops.append([-1, text1[i1:i2]])
                diff_ops.append([1, text2[j1:j2]])

    return ApiResponse(data={"diff": diff_ops})


# ==============================================================================
# AI Disclosure Audit Trail (planing.txt Line 110, Line 149)
# ==============================================================================

@router.get("/content/{content_id}/ai-disclosures", response_model=ApiResponse[Dict[str, Any]])
async def get_ai_disclosures(content_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    disclosures = store.get_ai_disclosures(content_id)
    return ApiResponse(data={"disclosures": [AIDisclosure(**d) for d in disclosures]})


# ==============================================================================
# PDF Approval Record Export (planing.txt Line 75, Line 104)
# ==============================================================================

@router.get("/content/{content_id}/export/pdf")
async def export_approval_pdf(content_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    """Generate and return PDF approval certificate record."""
    item = store.get_content(org_id=user["org_id"], content_id=content_id)
    findings = store.list_findings(org_id=user["org_id"], content_id=content_id)

    # Clean PDF bytes generation
    vnum = item.get("current_version") if isinstance(item.get("current_version"), int) else (item.get("latest_version", {}).get("version_number", 1) if isinstance(item.get("latest_version"), dict) else 1)
    pdf_text = (
        f"%PDF-1.4\n"
        f"1 0 obj << /Title ({item['title']}) /Author ({user.get('display_name', 'BrandProof')}) >> endobj\n"
        f"2 0 obj << /Type /Catalog /Pages 3 0 R >> endobj\n"
        f"3 0 obj << /Type /Pages /Kids [4 0 R] /Count 1 >> endobj\n"
        f"4 0 obj << /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj\n"
        f"5 0 obj << /Length 200 >> stream\n"
        f"BT /F1 14 Tf 50 720 Td (BRANDPROOF AUDIT & APPROVAL RECORD) Tj ET\n"
        f"BT /F1 10 Tf 50 690 Td (Document: {item['title']}) Tj ET\n"
        f"BT /F1 10 Tf 50 670 Td (Status: {item['status'].upper()} | Version: v{vnum}) Tj ET\n"
        f"BT /F1 10 Tf 50 650 Td (Governance Checks Passed: {len([f for f in findings if f.get('status') == 'accepted'])} resolved) Tj ET\n"
        f"endstream\nendobj\nxref\n0 6\n0000000000 65535 f \n"
        f"trailer << /Size 6 /Root 2 0 R >>\nstartxref\n500\n%%EOF"
    )

    return Response(
        content=pdf_text.encode("utf-8"),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="brandproof_approval_{content_id}.pdf"'},
    )


# ==============================================================================
# Comments & Discussion
# ==============================================================================

@router.get("/content/{content_id}/comments", response_model=ApiResponse[Dict[str, Any]])
async def list_comments(content_id: str):
    comments = store.list_comments(content_id)
    return ApiResponse(data={"comments": [Comment(**c) for c in comments]})


@router.post("/content/{content_id}/comments", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def add_comment(
    content_id: str,
    payload: CommentCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    comment = store.add_comment(
        content_id=content_id,
        author_id=user["id"],
        text=payload.text,
        finding_id=payload.finding_id,
    )
    return ApiResponse(data={"comment": Comment(**comment)})
