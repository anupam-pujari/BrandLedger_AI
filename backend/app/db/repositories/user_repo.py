"""
User Repository (Database operations for users table).
"""

from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
from app.models.common import EntityNotFoundError


class UserRepository:
    TABLE_NAME = "users"

    @classmethod
    async def list_users(
        cls,
        client: Any,
        org_id: str,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        query = client.table(cls.TABLE_NAME).select("*").eq("org_id", org_id)
        if role:
            query = query.eq("role", role)
        if is_active is not None:
            query = query.eq("is_active", is_active)
        response = query.order("created_at", desc=True).limit(limit).execute()
        return response.data or []

    @classmethod
    async def get_by_id(cls, client: Any, org_id: str, user_id: str) -> Dict[str, Any]:
        response = (
            client.table(cls.TABLE_NAME)
            .select("*")
            .eq("org_id", org_id)
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            raise EntityNotFoundError(f"User with id '{user_id}' was not found in your organization.")
        return response.data[0]

    @classmethod
    async def invite_user(
        cls,
        client: Any,
        org_id: str,
        email: str,
        role: str,
        display_name: str
    ) -> Dict[str, Any]:
        user_id = str(uuid.uuid4())
        data = {
            "id": user_id,
            "org_id": org_id,
            "email": email,
            "role": role,
            "display_name": display_name,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        response = client.table(cls.TABLE_NAME).insert(data).execute()
        return response.data[0] if response.data else data

    @classmethod
    async def update_user(
        cls,
        client: Any,
        org_id: str,
        user_id: str,
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        await cls.get_by_id(client, org_id, user_id)
        data = {k: v for k, v in update_data.items() if v is not None}
        response = (
            client.table(cls.TABLE_NAME)
            .update(data)
            .eq("org_id", org_id)
            .eq("id", user_id)
            .execute()
        )
        return response.data[0] if response.data else {**data, "id": user_id, "org_id": org_id}
