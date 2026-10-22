"""
Facts (Approved Facts Vault) API Router.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, status

from app.dependencies import get_current_user, require_role
from app.middleware.auth import CurrentUser
from app.db.client import get_supabase_admin
from app.db.repositories.fact_repo import FactRepository
from app.models.fact import FactCreate, FactUpdate
from app.utils.csv_import import parse_csv_stream

router = APIRouter(prefix="/facts", tags=["Facts Vault"])


@router.get("")
async def list_facts(
    status: Optional[str] = None,
    owner_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    facts = await FactRepository.list_facts(
        client=admin_client,
        org_id=current_user.org_id,
        status=status,
        owner_id=owner_id,
        search=search,
        limit=limit
    )
    return {
        "success": True,
        "data": {"facts": facts},
        "error": None,
        "meta": {"total": len(facts)}
    }


@router.get("/expiring")
async def get_expiring_facts(
    days: int = Query(30, ge=1, le=180),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Retrieve facts expiring within N days to trigger renewal alerts (T-036)."""
    admin_client = get_supabase_admin()
    expiring = await FactRepository.get_expiring(
        client=admin_client,
        org_id=current_user.org_id,
        days=days
    )
    return {
        "success": True,
        "data": {"facts": expiring},
        "error": None,
        "meta": {"total": len(expiring)}
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_fact(
    payload: FactCreate,
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    fact = await FactRepository.create(
        client=admin_client,
        org_id=current_user.org_id,
        fact_data=payload.model_dump()
    )
    return {
        "success": True,
        "data": {"fact": fact},
        "error": None,
        "meta": None
    }


@router.get("/{fact_id}")
async def get_fact_detail(
    fact_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    fact = await FactRepository.get_by_id(admin_client, current_user.org_id, fact_id)
    return {
        "success": True,
        "data": {"fact": fact},
        "error": None,
        "meta": None
    }


@router.put("/{fact_id}")
async def update_fact(
    fact_id: str,
    payload: FactUpdate,
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    fact = await FactRepository.update(
        client=admin_client,
        org_id=current_user.org_id,
        fact_id=fact_id,
        fact_data=payload.model_dump(exclude_unset=True)
    )
    return {
        "success": True,
        "data": {"fact": fact},
        "error": None,
        "meta": None
    }


@router.post("/bulk-import", status_code=status.HTTP_201_CREATED)
async def bulk_import_facts(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    file_bytes = await file.read()
    required_fields = ["fact_code", "content", "valid_until"]
    rows, errors = parse_csv_stream(file_bytes, required_fields)

    admin_client = get_supabase_admin()
    imported_count = 0
    import_errors = list(errors)

    for row in rows:
        try:
            # Assign creator as owner if not present
            if not row.get("owner_id"):
                row["owner_id"] = current_user.id
            await FactRepository.create(
                client=admin_client,
                org_id=current_user.org_id,
                fact_data=row
            )
            imported_count += 1
        except Exception as e:
            import_errors.append(f"Fact {row.get('fact_code')}: {str(e)}")

    return {
        "success": True,
        "data": {
            "imported_count": imported_count,
            "errors": import_errors
        },
        "error": None,
        "meta": None
    }
