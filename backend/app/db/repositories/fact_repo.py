"""
Facts Repository (Approved Facts Vault Database Operations).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, date, timedelta
from app.embeddings.embedder import embed_text
from app.models.common import EntityNotFoundError


class FactRepository:
    TABLE_NAME = "facts"

    @classmethod
    async def list_facts(
        cls,
        client: Any,
        org_id: str,
        status: Optional[str] = None,
        owner_id: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        # Use v_facts view when querying to get dynamically computed is_expired field
        query = client.table("v_facts").select("*").eq("org_id", org_id)

        if status:
            query = query.eq("status", status)
        if owner_id:
            query = query.eq("owner_id", owner_id)
        if search:
            query = query.ilike("content", f"%{search}%")

        response = query.order("fact_code").limit(limit).execute()
        return response.data or []

    @classmethod
    async def get_by_id(cls, client: Any, org_id: str, fact_id: str) -> Dict[str, Any]:
        response = (
            client.table("v_facts")
            .select("*")
            .eq("org_id", org_id)
            .eq("id", fact_id)
            .execute()
        )
        if not response.data:
            raise EntityNotFoundError(f"Fact with id '{fact_id}' was not found in your organization.")
        return response.data[0]

    @classmethod
    async def create(
        cls,
        client: Any,
        org_id: str,
        fact_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        data = dict(fact_data)
        data["org_id"] = org_id

        # Convert date to string if date object
        if isinstance(data.get("valid_until"), date):
            data["valid_until"] = data["valid_until"].isoformat()

        # Auto-generate 384-d embedding for semantic search in Claim Passport (T-052)
        data["embedding"] = embed_text(data["content"])

        response = client.table(cls.TABLE_NAME).insert(data).execute()
        return response.data[0]

    @classmethod
    async def update(
        cls,
        client: Any,
        org_id: str,
        fact_id: str,
        fact_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        await cls.get_by_id(client, org_id, fact_id)

        data = {k: v for k, v in fact_data.items() if v is not None}
        data["updated_at"] = datetime.now(timezone.utc).isoformat()

        if isinstance(data.get("valid_until"), date):
            data["valid_until"] = data["valid_until"].isoformat()

        if "content" in data:
            data["embedding"] = embed_text(data["content"])

        response = (
            client.table(cls.TABLE_NAME)
            .update(data)
            .eq("org_id", org_id)
            .eq("id", fact_id)
            .execute()
        )
        return response.data[0]

    @classmethod
    async def get_expiring(
        cls,
        client: Any,
        org_id: str,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get active facts expiring within the next N days (T-036)."""
        today = date.today()
        target_date = today + timedelta(days=days)

        response = (
            client.table("v_facts")
            .select("*")
            .eq("org_id", org_id)
            .gte("valid_until", today.isoformat())
            .lte("valid_until", target_date.isoformat())
            .order("valid_until")
            .execute()
        )
        return response.data or []
