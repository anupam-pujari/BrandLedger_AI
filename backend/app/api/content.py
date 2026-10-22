"""
Content & Version Management API Router (T-061, T-062, T-063, T-064, T-065, T-066, T-100, T-101).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.dependencies import get_current_user, require_role
from app.middleware.auth import CurrentUser
from app.db.client import get_supabase_admin
from app.db.repositories.content_repo import ContentRepository
from app.models.content import ContentCreate, ContentUpdate

router = APIRouter(prefix="/content", tags=["Content & Versions"])


@router.get("")
async def list_content(
    status: Optional[str] = None,
    author_id: Optional[str] = None,
    content_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    items = await ContentRepository.list_content(
        client=admin_client,
        org_id=current_user.org_id,
        status=status,
        author_id=author_id,
        content_type=content_type,
        limit=limit
    )
    return {
        "success": True,
        "data": {"content_items": items},
        "error": None,
        "meta": {"total": len(items)}
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_content(
    payload: ContentCreate,
    current_user: CurrentUser = Depends(require_role("creator", "brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    item = await ContentRepository.create(
        client=admin_client,
        org_id=current_user.org_id,
        author_id=current_user.id,
        content_data=payload.model_dump()
    )
    return {
        "success": True,
        "data": {
            "content_item": item,
            "version": item.get("current_version")
        },
        "error": None,
        "meta": None
    }


@router.get("/{content_id}")
async def get_content(
    content_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    item = await ContentRepository.get_by_id(admin_client, current_user.org_id, content_id)
    return {
        "success": True,
        "data": {
            "content_item": item,
            "current_version": item.get("current_version"),
            "findings_summary": {"critical": 0, "warning": 0, "info": 0}
        },
        "error": None,
        "meta": None
    }


@router.put("/{content_id}")
async def update_content(
    content_id: str,
    payload: ContentUpdate,
    current_user: CurrentUser = Depends(require_role("creator", "brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    item = await ContentRepository.update(
        client=admin_client,
        org_id=current_user.org_id,
        content_id=content_id,
        user_id=current_user.id,
        update_data=payload.model_dump(exclude_unset=True),
        user_role=current_user.role
    )
    return {
        "success": True,
        "data": {
            "content_item": item,
            "version": item.get("current_version")
        },
        "error": None,
        "meta": None
    }


@router.get("/{content_id}/versions")
async def list_versions(
    content_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    versions = await ContentRepository.list_versions(
        client=admin_client,
        org_id=current_user.org_id,
        content_id=content_id
    )
    return {
        "success": True,
        "data": {"versions": versions},
        "error": None,
        "meta": {"total": len(versions)}
    }


@router.get("/{content_id}/versions/{v1}/diff/{v2}")
async def get_version_diff(
    content_id: str,
    v1: int,
    v2: int,
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    diff_data = await ContentRepository.get_version_diff(
        client=admin_client,
        org_id=current_user.org_id,
        content_id=content_id,
        v1_num=v1,
        v2_num=v2
    )
    return {
        "success": True,
        "data": diff_data,
        "error": None,
        "meta": None
    }


@router.post("/{content_id}/submit-for-review")
async def submit_for_review(
    content_id: str,
    current_user: CurrentUser = Depends(require_role("creator", "brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    item = await ContentRepository.transition_status(
        client=admin_client,
        org_id=current_user.org_id,
        content_id=content_id,
        target_status="in_review",
        actor_id=current_user.id,
        actor_role=current_user.role
    )
    return {
        "success": True,
        "data": {"content_item": item},
        "error": None,
        "meta": None
    }


@router.post("/{content_id}/approve")
async def approve_content(
    content_id: str,
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    item = await ContentRepository.transition_status(
        client=admin_client,
        org_id=current_user.org_id,
        content_id=content_id,
        target_status="approved",
        actor_id=current_user.id,
        actor_role=current_user.role
    )
    return {
        "success": True,
        "data": {"content_item": item},
        "error": None,
        "meta": None
    }
