"""
Findings Repository (Database operations for findings table).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.common import EntityNotFoundError, BrandProofException


class FindingRepository:
    TABLE_NAME = "findings"

    @classmethod
    async def list_findings(
        cls,
        client: Any,
        org_id: str,
        content_id: str,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        category: Optional[str] = None,
        check_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        query = (
            client.table(cls.TABLE_NAME)
            .select("*")
            .eq("org_id", org_id)
            .eq("content_item_id", content_id)
        )
        if status:
            query = query.eq("status", status)
        if severity:
            query = query.eq("severity", severity)
        if category:
            query = query.eq("category", category)
        if check_type:
            query = query.eq("check_type", check_type)

        response = query.limit(limit).execute()
        return response.data or []

    @classmethod
    async def resolve_finding(
        cls,
        client: Any,
        org_id: str,
        finding_id: str,
        user_id: str,
        resolution_status: str,
        dismiss_reason: Optional[str] = None,
        edited_text: Optional[str] = None
    ) -> Dict[str, Any]:
        res = (
            client.table(cls.TABLE_NAME)
            .select("*")
            .eq("org_id", org_id)
            .eq("id", finding_id)
            .execute()
        )
        if not res.data:
            raise EntityNotFoundError(f"Finding '{finding_id}' not found.")

        finding = res.data[0]
        severity = finding.get("severity", "info")

        # C-08 / T-102: Must provide reason for critical or warning dismissals
        if resolution_status == "dismissed" and severity in ["critical", "warning"]:
            if not dismiss_reason or not dismiss_reason.strip():
                raise BrandProofException(
                    status_code=422,
                    error_code="FINDING_REASON_REQUIRED",
                    message=f"A written explanation is required to dismiss a '{severity}' brand finding."
                )

        now = datetime.now(timezone.utc).isoformat()
        update_data = {
            "status": resolution_status,
            "resolved_by": user_id,
            "resolved_at": now
        }
        if dismiss_reason:
            update_data["dismiss_reason"] = dismiss_reason
        if edited_text:
            update_data["suggested_fix"] = edited_text

        client.table(cls.TABLE_NAME).update(update_data).eq("id", finding_id).execute()
        finding.update(update_data)
        return finding
