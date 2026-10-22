"""
Claim Passport Verification Engine (T-086, T-087, T-088).
Extracts factual assertions from content, matches against the Approved Facts Vault
via vector embeddings, checks expiration dates, and labels claims as Supported, Outdated,
Conflicting, or Unsupported.
"""

from typing import List, Dict, Any
from datetime import datetime, date
from app.ai.base import AIService
from app.ai.masking import MaskingService
from app.embeddings.embedder import embed_text
from app.embeddings.search import search_facts_in_memory, search_facts_pgvector
from app.engine.schemas.finding import Finding


def _is_fact_expired(fact: Dict[str, Any]) -> bool:
    """Checks whether the fact expiry date has passed."""
    if fact.get("is_expired") is True:
        return True
    valid_until = fact.get("valid_until")
    if not valid_until:
        return False
    try:
        if isinstance(valid_until, str):
            exp_date = datetime.strptime(valid_until[:10], "%Y-%m-%d").date()
        elif isinstance(valid_until, (datetime, date)):
            exp_date = valid_until.date() if isinstance(valid_until, datetime) else valid_until
        else:
            return False
        return exp_date < date.today()
    except Exception:
        return False


async def check_claims_passport(
    masked_text: str,
    original_text: str,
    masking_map: Dict[str, str],
    approved_facts: List[Dict[str, Any]],
    ai_service: AIService,
    supabase_client: Any = None,
    org_id: str = None,
    match_threshold: float = 0.50
) -> List[Finding]:
    findings: List[Finding] = []
    if not masked_text:
        return findings

    # Step 1: Extract claims from text (T-086)
    try:
        extraction_res = await ai_service.extract_claims(masked_text)
        claims = extraction_res.claims or []
    except Exception:
        claims = []

    if not claims:
        return findings

    # Ensure facts have embeddings
    for f in approved_facts:
        if not f.get("embedding") and f.get("content"):
            f["embedding"] = embed_text(f["content"])

    # Step 2 & 3: Embed each claim and match against Facts Vault (T-087)
    for masked_claim in claims:
        unmasked_claim = MaskingService.unmask(masked_claim, masking_map)
        claim_vec = embed_text(unmasked_claim)

        # Match facts (in memory first, or via pgvector if available)
        matched_facts = search_facts_in_memory(claim_vec, approved_facts, threshold=match_threshold, top_k=3)
        if not matched_facts and supabase_client:
            try:
                matched_facts = await search_facts_pgvector(
                    supabase_client=supabase_client,
                    query_vector=claim_vec,
                    org_id=org_id,
                    threshold=match_threshold,
                    top_k=3
                )
            except Exception:
                matched_facts = []

        # Step 4: Evaluate match status (Supported, Outdated, Conflicting, Unsupported)
        if not matched_facts:
            # Unsupported claim
            findings.append(Finding(
                check_type="ai_assisted",
                category="claims",
                severity="critical",
                title="Unsupported factual claim",
                description=(
                    f"The claim '{unmasked_claim}' could not be verified against any approved statement "
                    "in the Approved Facts Vault."
                ),
                flagged_text=unmasked_claim if unmasked_claim in original_text else None,
                evidence_quote=f"Claim Passport: No approved fact matches this statement (similarity < {match_threshold}).",
                suggested_fix="Verify this claim with a subject matter expert or remove the unverified statement.",
                confidence=0.88,
                needs_human_judgement=True
            ))
            continue

        best_fact = matched_facts[0]
        fact_id = best_fact.get("id") or best_fact.get("fact_code")
        fact_code = best_fact.get("fact_code", "F-FACT")
        fact_content = best_fact.get("content", "")

        # Check Expiration (T-088)
        if _is_fact_expired(best_fact):
            findings.append(Finding(
                check_type="ai_assisted",
                category="claims",
                severity="critical" if best_fact.get("is_expired") else "warning",
                fact_id=fact_id,
                title="Outdated factual claim",
                description=(
                    f"Claim matches Approved Fact {fact_code}, but the fact expired on {best_fact.get('valid_until')}. "
                    "The underlying metric or statement requires re-validation."
                ),
                flagged_text=unmasked_claim if unmasked_claim in original_text else None,
                evidence_quote=f"Fact {fact_code} (Expired {best_fact.get('valid_until')}): '{fact_content}'",
                suggested_fix="Update the claim with current data or consult the fact owner.",
                confidence=0.95,
                needs_human_judgement=False
            ))
            continue

        # Check Conflict vs Support
        try:
            val_res = await ai_service.validate_claim(unmasked_claim, matched_facts)
        except Exception:
            val_res = None

        if val_res and val_res.is_conflicting:
            findings.append(Finding(
                check_type="ai_assisted",
                category="claims",
                severity="critical",
                fact_id=fact_id,
                title="Conflicting factual claim",
                description=(
                    f"The claim '{unmasked_claim}' contradicts Approved Fact {fact_code}: '{fact_content}'. "
                    f"Reason: {val_res.explanation}"
                ),
                flagged_text=unmasked_claim if unmasked_claim in original_text else None,
                evidence_quote=f"Fact {fact_code}: '{fact_content}'",
                suggested_fix=f"Align statement directly with approved fact: '{fact_content}'.",
                confidence=val_res.confidence,
                needs_human_judgement=True
            ))

    return findings
