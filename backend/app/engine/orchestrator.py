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
from app.schemas import Finding

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
        all_findings.extend(check_terminology(text_body, terms))
        all_findings.extend(check_banned_words(text_body, rules))
        all_findings.extend(check_required_text(text_body, rules, content_type=content_item.get("content_type", "text")))
        all_findings.extend(check_readability(text_body))
        all_findings.extend(check_link_text(text_body))
        all_findings.extend(check_alt_text(text_body))

        # Visual / Color Contrast checks from assets
        palette_swatches = []
        for asset in assets:
            if asset.get("asset_type") == "color_palette":
                meta = asset.get("metadata", {})
                colors = meta.get("colors", [])
                for c in colors:
                    if isinstance(c, dict) and "hex" in c:
                        palette_swatches.append(c["hex"])
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
