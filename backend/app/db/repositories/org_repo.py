"""
Organisation Repository (Database operations for organisations table).
"""

from typing import Dict, Any
from datetime import datetime, timezone
from app.models.common import EntityNotFoundError


class OrgRepository:
    TABLE_NAME = "organisations"

    @classmethod
    async def get_settings(cls, client: Any, org_id: str) -> Dict[str, Any]:
        response = (
            client.table(cls.TABLE_NAME)
            .select("id, name, slug, settings, created_at, updated_at")
            .eq("id", org_id)
            .execute()
        )
        default_settings = {
            "rules_only_mode": False,
            "ai_provider": "openai",
            "masking_config": {
                "mask_emails": True,
                "mask_phones": True,
                "mask_confidential": True
            }
        }
        if not response.data:
            return default_settings
        org = response.data[0]
        return org.get("settings") or default_settings

    @classmethod
    async def update_settings(
        cls,
        client: Any,
        org_id: str,
        settings_update: Dict[str, Any]
    ) -> Dict[str, Any]:
        current_settings = await cls.get_settings(client, org_id)
        updated_settings = {**current_settings, **{k: v for k, v in settings_update.items() if v is not None}}
        
        data = {
            "settings": updated_settings,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        client.table(cls.TABLE_NAME).update(data).eq("id", org_id).execute()
        return updated_settings
