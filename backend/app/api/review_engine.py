"""
Review Engine & Findings API Router (T-091, T-092, T-102, T-108).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.dependencies import get_current_user, require_role
from app.middleware.auth import CurrentUser
from app.db.client import get_supabase_admin
from app.db.repositories.content_repo import ContentRepository
from app.db.repositories.rule_repo import RuleRepository
from app.db.repositories.fact_repo import FactRepository
from app.db.repositories.term_repo import TermRepository
from app.db.repositories.asset_repo import AssetRepository
from app.db.repositories.org_repo import OrgRepository
from app.db.repositories.finding_repo import FindingRepository
from app.db.repositories.review_repo import ReviewRepository
from app.engine.orchestrator import ReviewOrchestrator
from app.engine.schemas.finding import FindingResolveRequest

router = APIRouter(prefix="/content", tags=["Review Engine & Findings"])


@router.post("/{content_id}/check", status_code=status.HTTP_202_ACCEPTED)
async def trigger_content_check(
    content_id: str,
    current_user: CurrentUser = Depends(require_role("creator", "brand_manager", "admin"))
):
    """
    Trigger the review engine on the draft content (T-091).
    Transitions draft -> checking -> checked, runs fixed + AI checks, and stores findings.
    """
    admin_client = get_supabase_admin()
    content_item = await ContentRepository.get_by_id(admin_client, current_user.org_id, content_id)
    current_version = content_item.get("current_version")

    if not current_version:
        current_version = {"id": content_item.get("current_version_id", "v-1"), "body": ""}

    # 1. State machine transition: draft/changes_requested -> checking
    if content_item["status"] in ["draft", "changes_requested"]:
        await ContentRepository.transition_status(
            admin_client, current_user.org_id, content_id, "checking", current_user.id, current_user.role
        )

    # 2. Fetch organisation guideline databases
    rules = await RuleRepository.list_rules(admin_client, current_user.org_id, limit=200)
    facts = await FactRepository.list_facts(admin_client, current_user.org_id, limit=200)
    terms = await TermRepository.list_terms(admin_client, current_user.org_id, limit=200)
    assets = await AssetRepository.list_assets(admin_client, current_user.org_id, limit=100)
    org_settings = await OrgRepository.get_settings(admin_client, current_user.org_id)

    # 3. Run Orchestrator
    result = await ReviewOrchestrator.run_review(
        content_item=content_item,
        content_version=current_version,
        rules=rules,
        facts=facts,
        terms=terms,
        assets=assets,
        org_settings=org_settings,
        supabase_client=admin_client
    )

    # 4. State machine transition: checking -> checked
    await ContentRepository.transition_status(
        admin_client, current_user.org_id, content_id, "checked", current_user.id, current_user.role
    )

    # 5. Log audit event (T-105)
    await ReviewRepository.log_audit_event(
        client=admin_client,
        org_id=current_user.org_id,
        actor_id=current_user.id,
        action="content.checked",
        entity_type="content_item",
        entity_id=content_id,
        metadata={"findings_count": len(result["findings"])}
    )

    return {
        "success": True,
        "data": {
            "check_id": str(content_id),
            "status": "checked",
            "findings_count": len(result["findings"]),
            "findings": result["findings"],
            "ai_disclosure": result["ai_disclosure"]
        },
        "error": None,
        "meta": None
    }


@router.get("/{content_id}/check-status")
async def get_check_status(
    content_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    content_item = await ContentRepository.get_by_id(admin_client, current_user.org_id, content_id)
    findings = await FindingRepository.list_findings(admin_client, current_user.org_id, content_id)

    return {
        "success": True,
        "data": {
            "status": content_item["status"],
            "findings_count": len(findings),
            "progress_percent": 100 if content_item["status"] in ["checked", "in_review", "approved"] else 50
        },
        "error": None,
        "meta": None
    }


@router.get("/{content_id}/findings")
async def list_findings(
    content_id: str,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    check_type: Optional[str] = None,
    limit: int = Query(100, ge=1, le=200),
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    findings = await FindingRepository.list_findings(
        client=admin_client,
        org_id=current_user.org_id,
        content_id=content_id,
        status=status,
        severity=severity,
        category=category,
        check_type=check_type,
        limit=limit
    )
    return {
        "success": True,
        "data": {"findings": findings},
        "error": None,
        "meta": {"total": len(findings)}
    }


@router.patch("/{content_id}/findings/{finding_id}")
async def resolve_finding(
    content_id: str,
    finding_id: str,
    payload: FindingResolveRequest,
    current_user: CurrentUser = Depends(require_role("creator", "reviewer", "brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    updated_finding = await FindingRepository.resolve_finding(
        client=admin_client,
        org_id=current_user.org_id,
        finding_id=finding_id,
        user_id=current_user.id,
        resolution_status=payload.status,
        dismiss_reason=payload.dismiss_reason,
        edited_text=payload.edited_text
    )

    # Log audit event (T-105)
    await ReviewRepository.log_audit_event(
        client=admin_client,
        org_id=current_user.org_id,
        actor_id=current_user.id,
        action=f"finding.{payload.status}",
        entity_type="finding",
        entity_id=finding_id,
        metadata={"content_id": content_id, "dismiss_reason": payload.dismiss_reason}
    )

    return {
        "success": True,
        "data": {"finding": updated_finding},
        "error": None,
        "meta": None
    }


@router.get("/{content_id}/ai-disclosures")
async def list_ai_disclosures(
    content_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    res = (
        admin_client.table("ai_disclosures")
        .select("*")
        .eq("org_id", current_user.org_id)
        .eq("content_item_id", content_id)
        .order("called_at", desc=True)
        .execute()
    )
    return {
        "success": True,
        "data": {"disclosures": res.data or []},
        "error": None,
        "meta": {"total": len(res.data or [])}
    }
