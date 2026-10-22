"""
Reviews, Comments, and Audit Log Repository (T-103, T-104, T-105).
"""

from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone


class ReviewRepository:
    REVIEWS_TABLE = "reviews"
    COMMENTS_TABLE = "comments"
    AUDIT_TABLE = "audit_log"

    @classmethod
    async def list_reviews(cls, client: Any, org_id: str, content_id: str) -> List[Dict[str, Any]]:
        res = (
            client.table(cls.REVIEWS_TABLE)
            .select("*")
            .eq("org_id", org_id)
            .eq("content_item_id", content_id)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []

    @classmethod
    async def add_review(
        cls,
        client: Any,
        org_id: str,
        content_id: str,
        reviewer_id: str,
        decision: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        review_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        data = {
            "id": review_id,
            "org_id": org_id,
            "content_item_id": content_id,
            "reviewer_id": reviewer_id,
            "decision": decision,
            "notes": notes,
            "reviewed_at": now,
            "created_at": now
        }
        client.table(cls.REVIEWS_TABLE).insert(data).execute()
        return data

    @classmethod
    async def list_comments(cls, client: Any, org_id: str, content_id: str) -> List[Dict[str, Any]]:
        res = (
            client.table(cls.COMMENTS_TABLE)
            .select("*")
            .eq("org_id", org_id)
            .eq("content_item_id", content_id)
            .order("created_at")
            .execute()
        )
        return res.data or []

    @classmethod
    async def add_comment(
        cls,
        client: Any,
        org_id: str,
        content_id: str,
        author_id: str,
        body: str,
        finding_id: Optional[str] = None
    ) -> Dict[str, Any]:
        comment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        data = {
            "id": comment_id,
            "org_id": org_id,
            "content_item_id": content_id,
            "author_id": author_id,
            "body": body,
            "finding_id": finding_id,
            "created_at": now,
            "updated_at": now
        }
        client.table(cls.COMMENTS_TABLE).insert(data).execute()
        return data

    @classmethod
    async def log_audit_event(
        cls,
        client: Any,
        org_id: str,
        actor_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        old_state: Optional[Dict[str, Any]] = None,
        new_state: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Insert-only audit logging (data-model.md §audit_log)."""
        data = {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "actor_id": actor_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "old_state": old_state,
            "new_state": new_state,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            client.table(cls.AUDIT_TABLE).insert(data).execute()
        except Exception:
            pass
        return data
