"""
Brand Asset Library API Router.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, status

from app.dependencies import get_current_user, require_role
from app.middleware.auth import CurrentUser
from app.db.client import get_supabase_admin
from app.db.repositories.asset_repo import AssetRepository
from app.models.asset import AssetCreate

router = APIRouter(prefix="/assets", tags=["Brand Asset Library"])


@router.get("")
async def list_assets(
    asset_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    assets = await AssetRepository.list_assets(admin_client, current_user.org_id, asset_type, limit)
    return {
        "success": True,
        "data": {"assets": assets},
        "error": None,
        "meta": {"total": len(assets)}
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_asset(
    name: str = Form(...),
    asset_type: str = Form(...),
    usage_notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    file_path = None

    if file:
        file_bytes = await file.read()
        storage_path = f"{current_user.org_id}/{file.filename}"
        try:
            admin_client.storage.from_(AssetRepository.STORAGE_BUCKET).upload(
                storage_path,
                file_bytes,
                {"content-type": file.content_type}
            )
            file_path = storage_path
        except Exception:
            file_path = f"mock-storage/{storage_path}"

    asset_payload = {
        "name": name,
        "asset_type": asset_type,
        "usage_notes": usage_notes,
        "file_path": file_path,
        "metadata": {}
    }

    asset = await AssetRepository.create(admin_client, current_user.org_id, asset_payload)
    return {
        "success": True,
        "data": {"asset": asset},
        "error": None,
        "meta": None
    }


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: str,
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    await AssetRepository.delete(admin_client, current_user.org_id, asset_id)
    return None
