"""
BrandProof Source of Truth API Router (Knowledge Layer).

Consolidates:
  - Rules & Rulebook Compiler (/rules, /rules/compile)
  - Approved Facts Vault (/facts, /facts/import-csv)
  - Terminology Manager (/terms, /terms/import-csv)
  - Brand Assets Library (/assets)
"""

import csv
import io
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile, status

from app.api.auth import get_current_user_from_header
from app.parsers import RulebookCompiler
from app.schemas import (
    ApiResponse,
    AssetCreateRequest,
    BrandAsset,
    Fact,
    FactCreateRequest,
    FactUpdateRequest,
    Rule,
    RuleCreateRequest,
    RuleUpdateRequest,
    Term,
    TermCreateRequest,
)
from app.store import store

router = APIRouter(tags=["Source of Truth (Knowledge)"])


# ==============================================================================
# Rules & Rulebook Compiler (planing.txt Line 6, Line 44, Line 88)
# ==============================================================================

@router.get("/rules", response_model=ApiResponse[Dict[str, Any]])
async def list_rules(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    rules = store.list_rules(org_id=user["org_id"], category=category, status=status)
    return ApiResponse(data={"rules": [Rule(**r) for r in rules]})


@router.post("/rules", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def create_rule(
    payload: RuleCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    new_rule = store.create_rule(org_id=user["org_id"], data=payload.model_dump(), user_id=user["id"])
    return ApiResponse(data={"rule": Rule(**new_rule)})


@router.get("/rules/{rule_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_rule(rule_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    rule = store.get_rule(org_id=user["org_id"], rule_id=rule_id)
    return ApiResponse(data={"rule": Rule(**rule)})


@router.put("/rules/{rule_id}", response_model=ApiResponse[Dict[str, Any]])
async def update_rule(
    rule_id: str,
    payload: RuleUpdateRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    updated = store.update_rule(org_id=user["org_id"], rule_id=rule_id, updates=payload.model_dump(exclude_unset=True))
    return ApiResponse(data={"rule": Rule(**updated)})


@router.delete("/rules/{rule_id}", response_model=ApiResponse[Dict[str, Any]])
async def delete_rule(rule_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    store.delete_rule(org_id=user["org_id"], rule_id=rule_id)
    return ApiResponse(data={"deleted": True})


@router.post("/rules/compile", response_model=ApiResponse[Dict[str, Any]])
async def compile_rules_from_pdf(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    """
    Rulebook Compiler:
    Upload a brand guideline PDF and extract structured candidate rules
    linked to exact source pages and quotes for manager review.
    """
    file_bytes = await file.read()
    filename = file.filename or "brand_guidelines.pdf"

    candidates = RulebookCompiler.compile_pdf(file_bytes=file_bytes, filename=filename)

    # Save candidates in draft status into the store
    saved_candidates = []
    for c in candidates:
        c["org_id"] = user["org_id"]
        c["status"] = "draft"
        store.rules[c["id"]] = c
        saved_candidates.append(c)

    return ApiResponse(data={"proposed_rules": [Rule(**r) for r in saved_candidates]})


# ==============================================================================
# Approved Facts Vault (planing.txt Line 8, Line 40, Line 89)
# ==============================================================================

@router.get("/facts", response_model=ApiResponse[Dict[str, Any]])
async def list_facts(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    facts = store.list_facts(org_id=user["org_id"], search=search, status=status)
    return ApiResponse(data={"facts": [Fact(**f) for f in facts]})


@router.post("/facts", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def create_fact(
    payload: FactCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    new_fact = store.create_fact(org_id=user["org_id"], data=payload.model_dump())
    return ApiResponse(data={"fact": Fact(**new_fact)})


@router.get("/facts/{fact_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_fact(fact_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    fact = store.get_fact(org_id=user["org_id"], fact_id=fact_id)
    return ApiResponse(data={"fact": Fact(**fact)})


@router.put("/facts/{fact_id}", response_model=ApiResponse[Dict[str, Any]])
async def update_fact(
    fact_id: str,
    payload: FactUpdateRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    updated = store.update_fact(org_id=user["org_id"], fact_id=fact_id, updates=payload.model_dump(exclude_unset=True))
    return ApiResponse(data={"fact": Fact(**updated)})


@router.delete("/facts/{fact_id}", response_model=ApiResponse[Dict[str, Any]])
async def delete_fact(fact_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    store.delete_fact(org_id=user["org_id"], fact_id=fact_id)
    return ApiResponse(data={"deleted": True})


@router.post("/facts/import-csv", response_model=ApiResponse[Dict[str, Any]])
async def import_facts_csv(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    contents = (await file.read()).decode("utf-8")
    reader = csv.DictReader(io.StringIO(contents))
    imported = []
    for row in reader:
        fact_data = {
            "fact_code": row.get("fact_code"),
            "claim_text": row.get("claim_text") or row.get("fact", ""),
            "supporting_quote": row.get("supporting_quote"),
            "source_document": row.get("source_document"),
            "owner_name": row.get("owner_name", "Fact Owner"),
            "owner_email": row.get("owner_email"),
            "valid_until": row.get("valid_until"),
        }
        if fact_data["claim_text"]:
            f = store.create_fact(user["org_id"], fact_data)
            imported.append(f)

    return ApiResponse(data={"imported_count": len(imported), "facts": [Fact(**f) for f in imported]})


# ==============================================================================
# Terminology Manager (planing.txt Line 41, Line 90)
# ==============================================================================

@router.get("/terms", response_model=ApiResponse[Dict[str, Any]])
async def list_terms(
    term_type: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    terms = store.list_terms(org_id=user["org_id"], term_type=term_type)
    return ApiResponse(data={"terms": [Term(**t) for t in terms]})


@router.post("/terms", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def create_term(
    payload: TermCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    new_term = store.create_term(org_id=user["org_id"], data=payload.model_dump())
    return ApiResponse(data={"term": Term(**new_term)})


@router.delete("/terms/{term_id}", response_model=ApiResponse[Dict[str, Any]])
async def delete_term(term_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    store.delete_term(org_id=user["org_id"], term_id=term_id)
    return ApiResponse(data={"deleted": True})


@router.post("/terms/import-csv", response_model=ApiResponse[Dict[str, Any]])
async def import_terms_csv(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    contents = (await file.read()).decode("utf-8")
    reader = csv.DictReader(io.StringIO(contents))
    imported = []
    for row in reader:
        term_data = {
            "term": row.get("term", ""),
            "term_type": row.get("term_type", "banned"),
            "preferred_replacement": row.get("preferred_replacement"),
            "case_sensitive": row.get("case_sensitive", "false").lower() == "true",
            "notes": row.get("notes"),
        }
        if term_data["term"]:
            t = store.create_term(user["org_id"], term_data)
            imported.append(t)

    return ApiResponse(data={"imported_count": len(imported), "terms": [Term(**t) for t in imported]})


# ==============================================================================
# Brand Assets Library (planing.txt Line 42, Line 91)
# ==============================================================================

@router.get("/assets", response_model=ApiResponse[Dict[str, Any]])
async def list_assets(
    asset_type: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    assets = store.list_assets(org_id=user["org_id"], asset_type=asset_type)
    return ApiResponse(data={"assets": [BrandAsset(**a) for a in assets]})


@router.post("/assets", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def create_asset(
    payload: AssetCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    new_asset = store.create_asset(org_id=user["org_id"], data=payload.model_dump())
    return ApiResponse(data={"asset": BrandAsset(**new_asset)})


@router.delete("/assets/{asset_id}", response_model=ApiResponse[Dict[str, Any]])
async def delete_asset(asset_id: str, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    store.delete_asset(org_id=user["org_id"], asset_id=asset_id)
    return ApiResponse(data={"deleted": True})
