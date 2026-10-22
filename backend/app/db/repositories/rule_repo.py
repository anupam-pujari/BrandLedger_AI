"""
Rules Repository (Rulebook Database Operations).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.embeddings.embedder import embed_text
from app.models.common import EntityNotFoundError


class RuleRepository:
    TABLE_NAME = "rules"

    @classmethod
    async def list_rules(
        cls,
        client: Any,
        org_id: str,
        category: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        query = client.table(cls.TABLE_NAME).select("*").eq("org_id", org_id)

        if category:
            query = query.eq("category", category)
        if status:
            query = query.eq("status", status)
        if severity:
            query = query.eq("severity", severity)
        if search:
            query = query.ilike("title", f"%{search}%")

        response = query.order("rule_code").limit(limit).execute()
        return response.data or []

    @classmethod
    async def get_by_id(cls, client: Any, org_id: str, rule_id: str) -> Dict[str, Any]:
        response = (
            client.table(cls.TABLE_NAME)
            .select("*")
            .eq("org_id", org_id)
            .eq("id", rule_id)
            .execute()
        )
        if not response.data:
            raise EntityNotFoundError(f"Rule with id '{rule_id}' was not found in your organization.")
        return response.data[0]

    @classmethod
    async def create(
        cls,
        client: Any,
        org_id: str,
        rule_data: Dict[str, Any],
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        data = dict(rule_data)
        data["org_id"] = org_id
        if created_by:
            data["created_by"] = created_by

        # Auto-generate embedding for semantic search (T-051)
        text_for_embedding = f"{data.get('title', '')}: {data.get('description', '')}"
        data["embedding"] = embed_text(text_for_embedding)

        response = client.table(cls.TABLE_NAME).insert(data).execute()
        return response.data[0]

    @classmethod
    async def update(
        cls,
        client: Any,
        org_id: str,
        rule_id: str,
        rule_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        # Verify exists
        await cls.get_by_id(client, org_id, rule_id)

        data = {k: v for k, v in rule_data.items() if v is not None}
        data["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Re-compute embedding if description or title changed
        if "title" in data or "description" in data:
            rule = await cls.get_by_id(client, org_id, rule_id)
            title = data.get("title", rule.get("title"))
            desc = data.get("description", rule.get("description"))
            data["embedding"] = embed_text(f"{title}: {desc}")

        response = (
            client.table(cls.TABLE_NAME)
            .update(data)
            .eq("org_id", org_id)
            .eq("id", rule_id)
            .execute()
        )
        return response.data[0]

    @classmethod
    async def update_status(
        cls,
        client: Any,
        org_id: str,
        rule_id: str,
        status: str,
        approved_by: Optional[str] = None
    ) -> Dict[str, Any]:
        await cls.get_by_id(client, org_id, rule_id)
        update_payload = {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        if approved_by:
            update_payload["approved_by"] = approved_by

        response = (
            client.table(cls.TABLE_NAME)
            .update(update_payload)
            .eq("org_id", org_id)
            .eq("id", rule_id)
            .execute()
        )
        return response.data[0]
