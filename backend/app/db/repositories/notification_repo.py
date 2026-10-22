"""
Notifications Repository (T-106, T-107).
Handles user alerts for review submissions, changes requested, approvals, and expiring facts.
"""

from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone


class NotificationRepository:
    TABLE_NAME = "notifications"

    @classmethod
    async def list_notifications(
        cls,
        client: Any,
        user_id: str,
        is_read: Optional[bool] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        query = client.table(cls.TABLE_NAME).select("*").eq("user_id", user_id)
        if is_read is not None:
            query = query.eq("is_read", is_read)
        res = query.order("created_at", desc=True).limit(limit).execute()
        return res.data or []

    @classmethod
    async def create_notification(
        cls,
        client: Any,
        user_id: str,
        org_id: str,
        title: str,
        message: str,
        link_url: Optional[str] = None
    ) -> Dict[str, Any]:
        data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "org_id": org_id,
            "title": title,
            "message": message,
            "link_url": link_url,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            client.table(cls.TABLE_NAME).insert(data).execute()
        except Exception:
            pass
        return data

    @classmethod
    async def mark_as_read(cls, client: Any, user_id: str, notification_id: str) -> Dict[str, Any]:
        data = {"is_read": True}
        client.table(cls.TABLE_NAME).update(data).eq("id", notification_id).eq("user_id", user_id).execute()
        return {"id": notification_id, "is_read": True}

    @classmethod
    async def mark_all_as_read(cls, client: Any, user_id: str) -> int:
        client.table(cls.TABLE_NAME).update({"is_read": True}).eq("user_id", user_id).execute()
        return 1
