"""
Content and Version Repository (T-060, T-064, T-065, T-066, T-067, T-068).
"""

from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
from diff_match_patch import diff_match_patch

from app.models.common import EntityNotFoundError, BrandProofException


class ContentRepository:
    ITEMS_TABLE = "content_items"
    VERSIONS_TABLE = "content_versions"

    # Valid transitions from clarifications.md C-05
    ALLOWED_TRANSITIONS = {
        "draft": ["checking"],
        "checking": ["checked"],
        "checked": ["draft", "in_review"],
        "in_review": ["changes_requested", "approved"],
        "changes_requested": ["draft", "checking"],
        "approved": []
    }

    @classmethod
    async def list_content(
        cls,
        client: Any,
        org_id: str,
        status: Optional[str] = None,
        author_id: Optional[str] = None,
        content_type: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        query = client.table(cls.ITEMS_TABLE).select("*").eq("org_id", org_id)
        if status:
            query = query.eq("status", status)
        if author_id:
            query = query.eq("author_id", author_id)
        if content_type:
            query = query.eq("content_type", content_type)
        response = query.order("updated_at", desc=True).limit(limit).execute()
        return response.data or []

    @classmethod
    async def get_by_id(cls, client: Any, org_id: str, content_id: str) -> Dict[str, Any]:
        response = (
            client.table(cls.ITEMS_TABLE)
            .select("*")
            .eq("org_id", org_id)
            .eq("id", content_id)
            .execute()
        )
        if not response.data:
            raise EntityNotFoundError(f"Content item '{content_id}' not found.")
        
        item = response.data[0]
        # Attach current version if exists
        if item.get("current_version_id"):
            v_res = (
                client.table(cls.VERSIONS_TABLE)
                .select("*")
                .eq("id", item["current_version_id"])
                .execute()
            )
            item["current_version"] = v_res.data[0] if v_res.data else None
        else:
            item["current_version"] = None
        return item

    @classmethod
    async def create(
        cls,
        client: Any,
        org_id: str,
        author_id: str,
        content_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        content_id = str(uuid.uuid4())
        version_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        body = content_data.get("body", "")

        # 1. Prepare Content Item
        item_data = {
            "id": content_id,
            "org_id": org_id,
            "author_id": author_id,
            "title": content_data["title"],
            "content_type": content_data.get("content_type", "text"),
            "format": content_data.get("format", "plain_text"),
            "status": "draft",
            "intent_purpose": content_data.get("intent_purpose"),
            "intent_audience": content_data.get("intent_audience"),
            "intent_key_message": content_data.get("intent_key_message"),
            "rules_only_mode": content_data.get("rules_only_mode", False),
            "current_version_id": version_id,
            "created_at": now,
            "updated_at": now
        }

        # 2. Prepare Version 1
        version_data = {
            "id": version_id,
            "content_item_id": content_id,
            "version_number": 1,
            "body": body,
            "extracted_text": content_data.get("extracted_text"),
            "diff_from_previous": None,
            "created_at": now,
            "created_by": author_id
        }

        # Insert into database
        client.table(cls.ITEMS_TABLE).insert(item_data).execute()
        client.table(cls.VERSIONS_TABLE).insert(version_data).execute()

        item_data["current_version"] = version_data
        return item_data

    @classmethod
    async def update(
        cls,
        client: Any,
        org_id: str,
        content_id: str,
        user_id: str,
        update_data: Dict[str, Any],
        user_role: str = "creator"
    ) -> Dict[str, Any]:
        item = await cls.get_by_id(client, org_id, content_id)

        # Enforce that author or admin can edit draft
        if item["author_id"] != user_id and user_role not in ["admin", "brand_manager"]:
            raise BrandProofException(
                status_code=403,
                error_code="AUTH_INSUFFICIENT_ROLE",
                message="Only the content author can modify this draft."
            )

        now = datetime.now(timezone.utc).isoformat()
        item_updates = {"updated_at": now}

        for field in ["title", "intent_purpose", "intent_audience", "intent_key_message", "rules_only_mode"]:
            if field in update_data and update_data[field] is not None:
                item_updates[field] = update_data[field]

        # Check if new version needed due to body change
        new_body = update_data.get("body")
        current_version = item.get("current_version") or {}
        prev_body = current_version.get("body", "")

        if new_body is not None and new_body != prev_body:
            # Generate diff using diff_match_patch (T-066)
            dmp = diff_match_patch()
            diffs = dmp.diff_main(prev_body, new_body)
            dmp.diff_cleanupSemantic(diffs)

            # Determine next version number
            prev_vnum = current_version.get("version_number", 1)
            new_vnum = prev_vnum + 1
            new_version_id = str(uuid.uuid4())

            new_version_data = {
                "id": new_version_id,
                "content_item_id": content_id,
                "version_number": new_vnum,
                "body": new_body,
                "extracted_text": update_data.get("extracted_text"),
                "diff_from_previous": [{"op": op, "text": text} for op, text in diffs],
                "created_at": now,
                "created_by": user_id
            }

            client.table(cls.VERSIONS_TABLE).insert(new_version_data).execute()
            item_updates["current_version_id"] = new_version_id
            item["current_version"] = new_version_data

        client.table(cls.ITEMS_TABLE).update(item_updates).eq("id", content_id).execute()
        item.update(item_updates)
        return item

    @classmethod
    async def list_versions(cls, client: Any, org_id: str, content_id: str) -> List[Dict[str, Any]]:
        # Verify content exists in org
        await cls.get_by_id(client, org_id, content_id)
        response = (
            client.table(cls.VERSIONS_TABLE)
            .select("*")
            .eq("content_item_id", content_id)
            .order("version_number", desc=True)
            .execute()
        )
        return response.data or []

    @classmethod
    async def get_version_diff(
        cls,
        client: Any,
        org_id: str,
        content_id: str,
        v1_num: int,
        v2_num: int
    ) -> Dict[str, Any]:
        await cls.get_by_id(client, org_id, content_id)
        res1 = (
            client.table(cls.VERSIONS_TABLE)
            .select("*")
            .eq("content_item_id", content_id)
            .eq("version_number", v1_num)
            .execute()
        )
        res2 = (
            client.table(cls.VERSIONS_TABLE)
            .select("*")
            .eq("content_item_id", content_id)
            .eq("version_number", v2_num)
            .execute()
        )
        if not res1.data or not res2.data:
            raise EntityNotFoundError("One or both requested versions were not found.")

        v1 = res1.data[0]
        v2 = res2.data[0]

        dmp = diff_match_patch()
        diffs = dmp.diff_main(v1["body"], v2["body"])
        dmp.diff_cleanupSemantic(diffs)

        return {
            "version_a": v1_num,
            "version_b": v2_num,
            "diff": [{"op": op, "text": text} for op, text in diffs]
        }

    @classmethod
    async def transition_status(
        cls,
        client: Any,
        org_id: str,
        content_id: str,
        target_status: str,
        actor_id: str,
        actor_role: str = "creator"
    ) -> Dict[str, Any]:
        item = await cls.get_by_id(client, org_id, content_id)
        current_status = item["status"]

        # Validate state machine (T-067)
        allowed = cls.ALLOWED_TRANSITIONS.get(current_status, [])
        if target_status not in allowed:
            raise BrandProofException(
                status_code=409,
                error_code="CONTENT_INVALID_TRANSITION",
                message=f"Cannot transition content status from '{current_status}' to '{target_status}'. Allowed transitions: {allowed}."
            )

        # Self-approval guard (T-068): author cannot approve own content
        if target_status == "approved":
            if item["author_id"] == actor_id:
                raise BrandProofException(
                    status_code=403,
                    error_code="CONTENT_SELF_APPROVAL",
                    message="Creators cannot approve their own content. A distinct brand manager or reviewer is required."
                )
            if actor_role not in ["brand_manager", "admin"]:
                raise BrandProofException(
                    status_code=403,
                    error_code="AUTH_INSUFFICIENT_ROLE",
                    message="Only brand managers or administrators can approve content."
                )

        now = datetime.now(timezone.utc).isoformat()
        update_data = {
            "status": target_status,
            "updated_at": now
        }
        client.table(cls.ITEMS_TABLE).update(update_data).eq("id", content_id).execute()
        item.update(update_data)
        return item
