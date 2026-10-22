"""
Terminology API Router.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, status

from app.dependencies import get_current_user, require_role
from app.middleware.auth import CurrentUser
from app.db.client import get_supabase_admin
from app.db.repositories.term_repo import TermRepository
from app.models.term import TermCreate, TermUpdate
from app.utils.csv_import import parse_csv_stream

router = APIRouter(prefix="/terms", tags=["Terminology"])


@router.get("")
async def list_terms(
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=200),
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    terms = await TermRepository.list_terms(admin_client, current_user.org_id, search, limit)
    return {
        "success": True,
        "data": {"terms": terms},
        "error": None,
        "meta": {"total": len(terms)}
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_term(
    payload: TermCreate,
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    term = await TermRepository.create(admin_client, current_user.org_id, payload.model_dump())
    return {
        "success": True,
        "data": {"term": term},
        "error": None,
        "meta": None
    }


@router.put("/{term_id}")
async def update_term(
    term_id: str,
    payload: TermUpdate,
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    term = await TermRepository.update(
        admin_client, current_user.org_id, term_id, payload.model_dump(exclude_unset=True)
    )
    return {
        "success": True,
        "data": {"term": term},
        "error": None,
        "meta": None
    }


@router.delete("/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_term(
    term_id: str,
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    await TermRepository.delete(admin_client, current_user.org_id, term_id)
    return None


@router.post("/bulk-import", status_code=status.HTTP_201_CREATED)
async def bulk_import_terms(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    file_bytes = await file.read()
    required_fields = ["preferred_term"]
    rows, errors = parse_csv_stream(file_bytes, required_fields)

    admin_client = get_supabase_admin()
    imported_count = 0
    import_errors = list(errors)

    for row in rows:
        try:
            banned_raw = row.get("banned_alternatives", "")
            banned_list = [b.strip() for b in banned_raw.split(";") if b.strip()] if isinstance(banned_raw, str) else []
            term_dict = {
                "preferred_term": row["preferred_term"],
                "banned_alternatives": banned_list,
                "notes": row.get("notes"),
                "case_sensitive": str(row.get("case_sensitive", "")).lower() in ("true", "1")
            }
            await TermRepository.create(admin_client, current_user.org_id, term_dict)
            imported_count += 1
        except Exception as e:
            import_errors.append(f"Term {row.get('preferred_term')}: {str(e)}")

    return {
        "success": True,
        "data": {
            "imported_count": imported_count,
            "errors": import_errors
        },
        "error": None,
        "meta": None
    }
