"""
Organisation Settings API Router (T-028, T-029).
"""

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, require_role
from app.middleware.auth import CurrentUser
from app.db.client import get_supabase_admin
from app.db.repositories.org_repo import OrgRepository
from app.models.org import OrgSettingsUpdate

router = APIRouter(prefix="/org", tags=["Organisation Settings"])


@router.get("/settings")
async def get_settings(
    current_user: CurrentUser = Depends(require_role("admin", "brand_manager"))
):
    admin_client = get_supabase_admin()
    settings = await OrgRepository.get_settings(admin_client, current_user.org_id)
    return {
        "success": True,
        "data": {"settings": settings},
        "error": None,
        "meta": None
    }


@router.patch("/settings")
async def update_settings(
    payload: OrgSettingsUpdate,
    current_user: CurrentUser = Depends(require_role("admin"))
):
    admin_client = get_supabase_admin()
    settings = await OrgRepository.update_settings(
        client=admin_client,
        org_id=current_user.org_id,
        settings_update=payload.model_dump(exclude_unset=True)
    )
    return {
        "success": True,
        "data": {"settings": settings},
        "error": None,
        "meta": None
    }
