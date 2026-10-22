"""
Terminology Repository (Preferred & Banned Terms Database Operations).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.common import EntityNotFoundError


class TermRepository:
    TABLE_NAME = "terms"

    @classmethod
    async def list_terms(
        cls,
        client: Any,
        org_id: str,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        query = client.table(cls.TABLE_NAME).select("*").eq("org_id", org_id)

        if search:
            query = query.ilike("preferred_term", f"%{search}%")

        response = query.order("preferred_term").limit(limit).execute()
        return response.data or []

    @classmethod
    async def get_by_id(cls, client: Any, org_id: str, term_id: str) -> Dict[str, Any]:
        response = (
            client.table(cls.TABLE_NAME)
            .select("*")
            .eq("org_id", org_id)
            .eq("id", term_id)
            .execute()
        )
        if not response.data:
            raise EntityNotFoundError(f"Terminology entry '{term_id}' was not found.")
        return response.data[0]

    @classmethod
    async def create(
        cls,
        client: Any,
        org_id: str,
        term_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        data = dict(term_data)
        data["org_id"] = org_id
        response = client.table(cls.TABLE_NAME).insert(data).execute()
        return response.data[0]

    @classmethod
    async def update(
        cls,
        client: Any,
        org_id: str,
        term_id: str,
        term_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        await cls.get_by_id(client, org_id, term_id)
        data = {k: v for k, v in term_data.items() if v is not None}
        data["updated_at"] = datetime.now(timezone.utc).isoformat()

        response = (
            client.table(cls.TABLE_NAME)
            .update(data)
            .eq("org_id", org_id)
            .eq("id", term_id)
            .execute()
        )
        return response.data[0]

    @classmethod
    async def delete(cls, client: Any, org_id: str, term_id: str) -> bool:
        await cls.get_by_id(client, org_id, term_id)
        client.table(cls.TABLE_NAME).delete().eq("org_id", org_id).eq("id", term_id).execute()
        return True

    @classmethod
    async def get_all_for_review(cls, client: Any, org_id: str) -> List[Dict[str, Any]]:
        """Fetch all terminology entries for deterministic spaCy phrase matching."""
        response = (
            client.table(cls.TABLE_NAME)
            .select("id, preferred_term, banned_alternatives, case_sensitive, notes")
            .eq("org_id", org_id)
            .execute()
        )
        return response.data or []
