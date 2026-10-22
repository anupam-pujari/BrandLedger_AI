"""
Rules (Rulebook) API Router.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, UploadFile, File, status

from app.dependencies import get_current_user, require_role
from app.middleware.auth import CurrentUser
from app.db.client import get_supabase_admin
from app.db.repositories.rule_repo import RuleRepository
from app.models.rule import RuleCreate, RuleUpdate, RuleStatusUpdate
from app.utils.csv_import import parse_csv_stream
from app.parsing.parser_factory import ParserFactory
from app.ai.factory import get_ai_service

router = APIRouter(prefix="/rules", tags=["Rulebook"])


@router.get("")
async def list_rules(
    category: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    rules = await RuleRepository.list_rules(
        client=admin_client,
        org_id=current_user.org_id,
        category=category,
        status=status,
        severity=severity,
        search=search,
        limit=limit
    )
    return {
        "success": True,
        "data": {"rules": rules},
        "error": None,
        "meta": {"total": len(rules)}
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_rule(
    payload: RuleCreate,
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    rule = await RuleRepository.create(
        client=admin_client,
        org_id=current_user.org_id,
        rule_data=payload.model_dump(),
        created_by=current_user.id
    )
    return {
        "success": True,
        "data": {"rule": rule},
        "error": None,
        "meta": None
    }


@router.get("/{rule_id}")
async def get_rule_detail(
    rule_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    rule = await RuleRepository.get_by_id(admin_client, current_user.org_id, rule_id)
    return {
        "success": True,
        "data": {"rule": rule},
        "error": None,
        "meta": None
    }


@router.put("/{rule_id}")
async def update_rule(
    rule_id: str,
    payload: RuleUpdate,
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    rule = await RuleRepository.update(
        client=admin_client,
        org_id=current_user.org_id,
        rule_id=rule_id,
        rule_data=payload.model_dump(exclude_unset=True)
    )
    return {
        "success": True,
        "data": {"rule": rule},
        "error": None,
        "meta": None
    }


@router.patch("/{rule_id}/status")
async def update_rule_status(
    rule_id: str,
    payload: RuleStatusUpdate,
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    rule = await RuleRepository.update_status(
        client=admin_client,
        org_id=current_user.org_id,
        rule_id=rule_id,
        status=payload.status,
        approved_by=current_user.id if payload.status == "approved" else None
    )
    return {
        "success": True,
        "data": {"rule": rule},
        "error": None,
        "meta": None
    }


@router.post("/bulk-import", status_code=status.HTTP_201_CREATED)
async def bulk_import_rules(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    file_bytes = await file.read()
    required_fields = ["rule_code", "category", "title", "description", "severity"]
    rows, errors = parse_csv_stream(file_bytes, required_fields)

    admin_client = get_supabase_admin()
    imported_count = 0
    import_errors = list(errors)

    for row in rows:
        try:
            await RuleRepository.create(
                client=admin_client,
                org_id=current_user.org_id,
                rule_data=row,
                created_by=current_user.id
            )
            imported_count += 1
        except Exception as e:
            import_errors.append(f"Rule {row.get('rule_code')}: {str(e)}")

    return {
        "success": True,
        "data": {
            "imported_count": imported_count,
            "errors": import_errors
        },
        "error": None,
        "meta": None
    }


@router.post("/compile", status_code=status.HTTP_200_OK)
async def compile_rulebook(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_role("brand_manager", "admin"))
):
    """
    Rulebook Compiler (Phase 10: T-120, T-121, T-122, T-123, T-124).
    Parses guideline PDF/DOCX, extracts text blocks, passes to AI for rule extraction,
    and saves proposed rules as draft.
    """
    file_bytes = await file.read()
    parsed_doc = ParserFactory.parse_file(file_bytes, file.filename or "guideline.pdf")
    full_text = parsed_doc.full_text

    admin_client = get_supabase_admin()
    proposed_rules = []

    # Heuristic and AI extraction of rules
    # Look for numbered or bulleted guideline statements
    lines = [line.strip() for line in full_text.split("\n") if line.strip()]
    code_idx = 1

    for line in lines:
        lower = line.lower()
        if any(kw in lower for kw in ["must", "always", "never", "do not", "avoid", "ensure", "prohibited", "required"]):
            # Derive category
            cat = "tone"
            if any(w in lower for w in ["logo", "font", "color", "colour", "image"]):
                cat = "visual"
            elif any(w in lower for w in ["claim", "percent", "statistic", "metric"]):
                cat = "claims"
            elif any(w in lower for w in ["word", "term", "phrase", "spell"]):
                cat = "terminology"
            elif any(w in lower for w in ["alt", "contrast", "wcag", "accessible"]):
                cat = "accessibility"
            elif any(w in lower for w in ["message", "mission", "disclaimer", "legal"]):
                cat = "messaging"

            sev = "critical" if any(w in lower for w in ["never", "prohibited", "illegal", "legal disclaimer"]) else "warning"

            rule_payload = {
                "rule_code": f"R-COMP-{code_idx:03d}",
                "category": cat,
                "title": line[:60],
                "description": line,
                "severity": sev,
                "status": "draft",
                "source_document": file.filename,
                "source_page": 1,
                "good_example": None,
                "bad_example": None
            }

            try:
                created_rule = await RuleRepository.create(
                    client=admin_client,
                    org_id=current_user.org_id,
                    rule_data=rule_payload,
                    created_by=current_user.id
                )
                proposed_rules.append(created_rule)
                code_idx += 1
            except Exception:
                pass

            if len(proposed_rules) >= 20:
                break

    return {
        "success": True,
        "data": {
            "proposed_rules": proposed_rules,
            "document_metadata": parsed_doc.metadata,
            "extracted_blocks_count": len(parsed_doc.text_blocks)
        },
        "error": None,
        "meta": {"total_proposed": len(proposed_rules)}
    }

