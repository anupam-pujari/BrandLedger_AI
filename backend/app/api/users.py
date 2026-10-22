"""
Users API Router (T-025, T-026, T-027).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.dependencies import get_current_user, require_role
from app.middleware.auth import CurrentUser
from app.db.client import get_supabase_admin
from app.db.repositories.user_repo import UserRepository
from app.models.user import UserInviteRequest, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("")
async def list_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(require_role("admin", "brand_manager"))
):
    admin_client = get_supabase_admin()
    users = await UserRepository.list_users(
        client=admin_client,
        org_id=current_user.org_id,
        role=role,
        is_active=is_active,
        limit=limit
    )
    return {
        "success": True,
        "data": {"users": users},
        "error": None,
        "meta": {"total": len(users)}
    }


@router.post("/invite", status_code=status.HTTP_201_CREATED)
async def invite_user(
    payload: UserInviteRequest,
    current_user: CurrentUser = Depends(require_role("admin"))
):
    admin_client = get_supabase_admin()
    user = await UserRepository.invite_user(
        client=admin_client,
        org_id=current_user.org_id,
        email=payload.email,
        role=payload.role,
        display_name=payload.display_name
    )
    return {
        "success": True,
        "data": {"user": user},
        "error": None,
        "meta": None
    }


@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    current_user: CurrentUser = Depends(require_role("admin"))
):
    admin_client = get_supabase_admin()
    user = await UserRepository.update_user(
        client=admin_client,
        org_id=current_user.org_id,
        user_id=user_id,
        update_data=payload.model_dump(exclude_unset=True)
    )
    return {
        "success": True,
        "data": {"user": user},
        "error": None,
        "meta": None
    }
