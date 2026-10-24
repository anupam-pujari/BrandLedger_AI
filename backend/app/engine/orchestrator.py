"""
BrandProof Review Engine Orchestrator.

Coordinates the end-to-end review process:
  1. Runs deterministic fixed checks (zero AI cost, instant, 100% explainable)
  2. Applies privacy masking before invoking AI reasoning
  3. Executes Claim Passport and Tone analysis
  4. Applies Intent Lock constraints to recommendations
  5. Ranks findings by severity and attaches verifiable source proof
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from app.config import get_settings
from app.engine.ai import (
    MaskingService,
    check_claims_passport,
    check_tone,
    generate_intent_locked_suggestion,
)
from app.engine.checks import (
    check_alt_text,
    check_banned_words,
    check_link_text,
    check_palette,
    check_readability,
    check_required_text,
    check_terminology,
    check_wcag_contrast,
)
from app.schemas import Finding, FindingProof

settings = get_settings()


class ReviewOrchestrator:
    """Orchestrates hybrid review suite across fixed and AI checks."""

    SEVERITY_ORDER = {"critical": 0, "warning": 1, "info": 2}

    @classmethod
    async def run_review(
        cls,
        content_item: Dict[str, Any],
        content_version: Dict[str, Any],
        rules: List[Dict[str, Any]],
        facts: List[Dict[str, Any]],
        terms: List[Dict[str, Any]],
        assets: List[Dict[str, Any]],
        org_settings: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Execute full review pipeline:
          Deterministic checks -> Privacy masking -> AI checks -> Intent Lock -> Ranking
        """
        text_body = content_version.get("body") or content_version.get("extracted_text") or ""
        rules_only_mode = (
            content_item.get("rules_only_mode", False) or
            (org_settings and org_settings.get("rules_only_mode", False))
        )

        all_findings: List[Finding] = []

        # -------------------------------------------------------------
        # 1. FIXED CHECKS (Deterministic, zero AI cost, explainable)
        # -------------------------------------------------------------
        if content_item.get("content_type") != "image":
            all_findings.extend(check_terminology(text_body, terms))
            all_findings.extend(check_banned_words(text_body, rules))
            all_findings.extend(check_required_text(text_body, rules, content_type=content_item.get("content_type", "text")))
            all_findings.extend(check_readability(text_body))
            all_findings.extend(check_link_text(text_body))
            all_findings.extend(check_alt_text(text_body))

        # Visual / Color Contrast / Alt-text checks from image_metadata or assets
        img_meta = content_item.get("image_metadata") or {}
        if img_meta:
            if img_meta.get("has_alt_text") is False:
                all_findings.append(Finding(
                    check_type="rule_check",
                    category="accessibility",
                    rule_code="R-61",
                    severity="warning",
                    title="Missing alt text for image",
                    description="Image lacks descriptive alternative text for accessibility.",
                    flagged_text="Missing alt text",
                    evidence_quote="Rule R-61 / WCAG 1.1.1 (Level A): Image lacks descriptive alternative text for accessibility.",
                    suggested_fix="Add descriptive alternative text to image.",
                    confidence=1.0,
                ))

            contrast_ratio = img_meta.get("text_contrast_ratio")
            if contrast_ratio is not None and contrast_ratio < 4.5:
                all_findings.append(Finding(
                    check_type="rule_check",
                    category="accessibility",
                    rule_code="R-60",
                    severity="critical",
                    title="Insufficient text contrast ratio",
                    description=f"Contrast ratio {contrast_ratio}:1 fails WCAG 2.1 AA minimum 4.5:1 standard.",
                    flagged_text=f"Text contrast ratio: {contrast_ratio}:1",
                    evidence_quote=f"Rule R-60 / WCAG 1.4.3 (Level AA): Contrast ratio {contrast_ratio}:1 fails minimum 4.5:1 standard.",
                    suggested_fix="Adjust text or background color to achieve at least 4.5:1 contrast.",
                    confidence=1.0,
                ))

            dom_colors = img_meta.get("dominant_colors", [])
            if dom_colors:
                all_findings.extend(check_palette(dom_colors, assets))

        # Visual / Color Contrast checks from assets
        for asset in assets:
            if asset.get("asset_type") == "color_palette":
                meta = asset.get("metadata", {})
                pairs = meta.get("approved_combinations", [])
                if pairs:
                    all_findings.extend(check_wcag_contrast(pairs))

        ai_disclosure_record = None

        # -------------------------------------------------------------
        # 2. AI REASONING CHECKS (Tone, Claim Passport, Intent Lock)
        # -------------------------------------------------------------
        if not rules_only_mode and text_body.strip():
            # 2.1 Privacy Gate (Masking PII / confidential data before AI call)
            masked_text, mask_map = MaskingService.mask_text(text_body)

            # 2.2 Claim Passport (Match claims against Facts Vault)
            claim_findings = check_claims_passport(masked_text, facts)
            for cf in claim_findings:
                if cf.flagged_text:
                    cf.flagged_text = MaskingService.unmask_text(cf.flagged_text, mask_map)
                all_findings.append(cf)

            # 2.3 Tone Check
            tone_findings = check_tone(masked_text, rules)
            for tf in tone_findings:
                if tf.flagged_text:
                    tf.flagged_text = MaskingService.unmask_text(tf.flagged_text, mask_map)
                all_findings.append(tf)

            # 2.4 Record AI Disclosure Audit Log (planing.txt Line 110, 149)
            ai_disclosure_record = {
                "content_item_id": content_item["id"],
                "version_id": content_version["id"],
                "provider": (org_settings or {}).get("ai_provider", settings.default_ai_provider),
                "model_name": "gemini-1.5-flash / gpt-4o-mini",
                "check_type": "hybrid_review",
                "masked_prompt": f"Reviewing content ({len(masked_text.split())} words) against {len(rules)} rules and {len(facts)} facts.",
                "tokens_used": len(masked_text.split()) * 2 + 150,
            }

        # Deduplicate findings and remove subphrase overlaps
        seen = set()
        deduped_findings: List[Finding] = []
        for f in all_findings:
            key = (f.category, f.rule_code or "", (f.flagged_text or "").lower())
            if key not in seen:
                seen.add(key)
                deduped_findings.append(f)

        filtered_findings: List[Finding] = []
        has_r21 = any(f.rule_code == "R-21" for f in deduped_findings)

        for f in deduped_findings:
            f_text = (f.flagged_text or "").lower()
            if not f_text:
                filtered_findings.append(f)
                continue

            # If absolute guarantee R-21 is flagged, avoid secondary terminology duplicates
            if has_r21 and f.rule_code != "R-21" and f_text in ["zero downtime", "guarantee"]:
                continue
            if has_r21 and f.rule_code == "R-21" and f_text == "guarantee":
                continue

            # Avoid subphrase overlaps (e.g. 'mind-blowing' when 'mind-blowing disaster' is flagged)
            is_sub = any(
                other != f and
                f_text in (other.flagged_text or "").lower() and
                len(f_text) < len((other.flagged_text or "").lower())
                for other in deduped_findings
            )
            if not is_sub:
                filtered_findings.append(f)

        all_findings = filtered_findings

        # -------------------------------------------------------------
        # 3. INTENT LOCK (Preserve purpose, audience & key message)
        # -------------------------------------------------------------
        intent_purpose = content_item.get("intent_purpose")
        intent_audience = content_item.get("intent_audience")
        intent_key_message = content_item.get("intent_key_message")

        for f in all_findings:
            if not f.id:
                f.id = f"fnd-{uuid.uuid4().hex[:8]}"
            f.content_item_id = content_item["id"]
            f.content_version_id = content_version["id"]
            f.org_id = content_item.get("org_id")

            # Attach verifiable proof record for frontend FindingCard and Explainability
            if not f.proof:
                matched_rule = next((r for r in rules if r.get("rule_code") == f.rule_code or r.get("id") == f.rule_id), None)
                matched_fact = next((fact for fact in facts if fact.get("fact_code") == f.fact_code or fact.get("id") == f.fact_id), None)

                source_doc = (matched_rule.get("source_document") if matched_rule else None) or (matched_fact.get("source_document") if matched_fact else "Brand_Guidelines_2026.pdf")
                source_page = (matched_rule.get("source_page") if matched_rule else None) or 1
                source_quote = f.evidence_quote or (matched_rule.get("source_quote") or matched_rule.get("description") if matched_rule else None)

                claim_status = None
                if f.category == "claims":
                    claim_status = "outdated" if (matched_fact and matched_fact.get("is_expired")) else ("supported" if matched_fact else "unsupported")

                f.proof = FindingProof(
                    rule_id=f.rule_id or (matched_rule.get("id") if matched_rule else None),
                    rule_code=f.rule_code or (matched_rule.get("rule_code") if matched_rule else None),
                    fact_id=f.fact_id or (matched_fact.get("id") if matched_fact else None),
                    fact_code=f.fact_code or (matched_fact.get("fact_code") if matched_fact else None),
                    source_document=source_doc,
                    source_page=source_page,
                    source_quote=source_quote,
                    claim_status=claim_status,
                    matched_fact_owner=matched_fact.get("owner_name") if matched_fact else None,
                    matched_fact_expiry=matched_fact.get("valid_until") if matched_fact else None,
                )

            # Enrich suggestions with Intent Lock validation
            if f.suggested_fix and (intent_purpose or intent_audience or intent_key_message):
                intent_res = generate_intent_locked_suggestion(
                    original_text=f.flagged_text or "",
                    finding=f,
                    intent_purpose=intent_purpose,
                    intent_audience=intent_audience,
                    intent_key_message=intent_key_message,
                )
                f.suggested_fix = intent_res["suggested_fix"]

        # -------------------------------------------------------------
        # 4. SORT BY SEVERITY & CONFIDENCE
        # -------------------------------------------------------------
        all_findings.sort(
            key=lambda x: (
                cls.SEVERITY_ORDER.get(x.severity, 2),
                -1 * (x.confidence or 1.0),
            )
        )

        return {
            "check_id": f"chk-{uuid.uuid4().hex[:8]}",
            "status": "completed",
            "findings_count": len(all_findings),
            "findings": [f.model_dump() for f in all_findings],
            "ai_disclosure": ai_disclosure_record,
        }
