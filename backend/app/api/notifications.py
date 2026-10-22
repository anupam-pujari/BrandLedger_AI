"""
Notifications API Router (T-107).
Provides user alerts, polling, and read-state management.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user
from app.middleware.auth import CurrentUser
from app.db.client import get_supabase_admin
from app.db.repositories.notification_repo import NotificationRepository

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])


@router.get("")
async def list_notifications(
    is_read: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    notifications = await NotificationRepository.list_notifications(
        client=admin_client,
        user_id=current_user.id,
        is_read=is_read,
        limit=limit
    )
    unread_count = sum(1 for n in notifications if not n.get("is_read"))

    return {
        "success": True,
        "data": {
            "notifications": notifications,
            "unread_count": unread_count
        },
        "error": None,
        "meta": {"total": len(notifications)}
    }


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    res = await NotificationRepository.mark_as_read(
        client=admin_client,
        user_id=current_user.id,
        notification_id=notification_id
    )
    return {
        "success": True,
        "data": {"notification": res},
        "error": None,
        "meta": None
    }


@router.post("/mark-all-read")
async def mark_all_read(
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    count = await NotificationRepository.mark_all_as_read(
        client=admin_client,
        user_id=current_user.id
    )
    return {
        "success": True,
        "data": {"updated_count": count},
        "error": None,
        "meta": None
    }
