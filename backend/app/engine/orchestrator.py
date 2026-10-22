"""
Review Engine Orchestrator (T-070).
Coordinates the end-to-end review pipeline across fixed deterministic checks,
PII/confidential masking, AI tone analysis, Claim Passport, Intent Lock, and deduplication.
"""

from typing import List, Dict, Any, Optional
import time
import uuid
from datetime import datetime, timezone

from app.engine.schemas.finding import Finding
from app.engine.fixed_checks.terminology import check_terminology
from app.engine.fixed_checks.banned_words import check_banned_words
from app.engine.fixed_checks.required_text import check_required_text
from app.engine.fixed_checks.readability import check_readability
from app.engine.fixed_checks.link_text import check_link_text
from app.engine.fixed_checks.alt_text import check_alt_text
from app.engine.fixed_checks.contrast import check_wcag_contrast
from app.engine.fixed_checks.resolution import check_image_resolution
from app.engine.fixed_checks.palette import check_palette

from app.ai.masking import MaskingService
from app.ai.factory import get_ai_service
from app.engine.ai_checks.tone import check_tone_ai
from app.engine.ai_checks.claims import check_claims_passport
from app.engine.ai_checks.suggestion import generate_intent_locked_suggestion


class ReviewOrchestrator:
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
        org_settings: Dict[str, Any] = None,
        supabase_client: Any = None
    ) -> Dict[str, Any]:
        """
        Executes full review suite on content draft and returns findings and AI disclosure.
        """
        org_id = content_item["org_id"]
        content_id = content_item["id"]
        version_id = content_version["id"]
        text_body = content_version.get("body") or content_version.get("extracted_text") or ""
        rules_only_mode = (
            content_item.get("rules_only_mode", False) or
            (org_settings and org_settings.get("rules_only_mode", False))
        )

        all_findings: List[Finding] = []

        # -------------------------------------------------------------
        # 1. FIXED CHECKS (Deterministic)
        # -------------------------------------------------------------
        # 1.1 Terminology Check (T-071)
        term_findings = check_terminology(text_body, terms)
        all_findings.extend(term_findings)

        # 1.2 Banned-Word Check (T-072)
        banned_findings = check_banned_words(text_body, rules)
        all_findings.extend(banned_findings)

        # 1.3 Required-Text Check (T-073)
        req_findings = check_required_text(text_body, rules, content_type=content_item.get("content_type", "text"))
        all_findings.extend(req_findings)

        # 1.4 Readability Check (T-074)
        readability_findings = check_readability(text_body)
        all_findings.extend(readability_findings)

        # 1.5 Link Text Quality (T-079)
        link_findings = check_link_text(text_body)
        all_findings.extend(link_findings)

        # 1.6 Alt-Text Accessibility (T-077)
        alt_findings = check_alt_text(text_body)
        all_findings.extend(alt_findings)

        # 1.7 Visual / Image Metadata Checks (T-075, T-076, T-077, T-078)
        img_meta = content_item.get("image_metadata") or content_version.get("metadata", {}).get("image_metadata") or {}
        if img_meta:
            if img_meta.get("has_alt_text") is False:
                all_findings.append(Finding(
                    check_type="rule_check",
                    category="accessibility",
                    severity="warning",
                    title="Missing alt text",
                    description="Image lacks descriptive alternative text for accessibility.",
                    flagged_text="Missing alt text",
                    evidence_quote="WCAG 1.1.1: Every published image must provide meaningful alternative text.",
                    suggested_fix="Provide descriptive alt text for this visual asset.",
                    confidence=1.0
                ))
            if img_meta.get("text_contrast_ratio") and img_meta["text_contrast_ratio"] < 4.5:
                all_findings.append(Finding(
                    check_type="rule_check",
                    category="accessibility",
                    severity="critical",
                    title=f"Text contrast ratio: {img_meta['text_contrast_ratio']}:1",
                    description=f"Contrast ratio {img_meta['text_contrast_ratio']}:1 fails WCAG 2.1 AA minimum 4.5:1 standard.",
                    flagged_text=f"Text contrast ratio: {img_meta['text_contrast_ratio']}:1",
                    evidence_quote="WCAG 1.4.3 Contrast (Minimum): 4.5:1 required.",
                    suggested_fix="Adjust foreground/background colours to achieve >= 4.5:1 contrast.",
                    confidence=1.0
                ))
            if img_meta.get("dominant_colors") and assets:
                palette_findings = check_palette(img_meta["dominant_colors"], assets)
                all_findings.extend(palette_findings)

        # -------------------------------------------------------------
        # 2. AI CHECKS (T-080 to T-089)
        # -------------------------------------------------------------
        disclosure_record: Optional[Dict[str, Any]] = None

        if not rules_only_mode and text_body.strip():
            start_time = time.perf_counter()

            # 2.1 Masking Service (T-080)
            masking_cfg = (org_settings or {}).get("masking_config") or {}
            masked_text, masking_map = MaskingService.mask(
                text=text_body,
                mask_emails=masking_cfg.get("mask_emails", True),
                mask_phones=masking_cfg.get("mask_phones", True),
                mask_confidential=masking_cfg.get("mask_confidential", True)
            )

            # 2.2 Obtain AI Service
            ai_provider_name = (org_settings or {}).get("ai_provider", "openai")
            ai_service = get_ai_service(ai_provider_name)

            # 2.3 AI Tone Check (T-085)
            tone_rules = [r for r in rules if r.get("category") == "tone" and r.get("status") == "approved"]
            tone_findings = await check_tone_ai(
                masked_text=masked_text,
                original_text=text_body,
                masking_map=masking_map,
                tone_rules=tone_rules,
                ai_service=ai_service
            )

            # 2.4 Claim Passport Verification (T-086, T-087, T-088)
            claim_findings = await check_claims_passport(
                masked_text=masked_text,
                original_text=text_body,
                masking_map=masking_map,
                approved_facts=facts,
                ai_service=ai_service,
                supabase_client=supabase_client,
                org_id=org_id
            )

            # 2.5 Suggestion generation with Intent Lock (T-089)
            intent_purpose = content_item.get("intent_purpose")
            intent_audience = content_item.get("intent_audience")
            intent_key_message = content_item.get("intent_key_message")

            for f in tone_findings + claim_findings:
                if not f.suggested_fix and f.flagged_text:
                    f.suggested_fix = await generate_intent_locked_suggestion(
                        flagged_text=f.flagged_text,
                        finding_description=f.description,
                        evidence_quote=f.evidence_quote or "",
                        ai_service=ai_service,
                        intent_purpose=intent_purpose,
                        intent_audience=intent_audience,
                        intent_key_message=intent_key_message,
                        masking_map=masking_map
                    )

            # Merge AI findings with deduplication
            ai_findings = tone_findings + claim_findings
            all_findings = cls._deduplicate_findings(all_findings, ai_findings)

            elapsed_ms = int((time.perf_counter() - start_time) * 1000)

            # 2.6 Build AI Disclosure Record (T-090)
            disclosure_record = {
                "id": str(uuid.uuid4()),
                "content_item_id": content_id,
                "content_version_id": version_id,
                "org_id": org_id,
                "provider": ai_service.provider_name,
                "masked_input": masked_text,
                "raw_response": {
                    "findings_count": len(ai_findings),
                    "ai_findings": [f.model_dump() for f in ai_findings]
                },
                "masking_map": masking_map,
                "called_at": datetime.now(timezone.utc).isoformat(),
                "latency_ms": elapsed_ms
            }

        # -------------------------------------------------------------
        # 3. SORT & POPULATE METADATA
        # -------------------------------------------------------------
        now_str = datetime.now(timezone.utc).isoformat()
        final_findings_dicts: List[Dict[str, Any]] = []

        for finding in all_findings:
            finding.id = finding.id or str(uuid.uuid4())
            finding.content_item_id = content_id
            finding.content_version_id = version_id
            finding.org_id = org_id
            finding.created_at = now_str
            final_findings_dicts.append(finding.model_dump())

        # Sort: critical first, then warning, then info
        final_findings_dicts.sort(key=lambda x: cls.SEVERITY_ORDER.get(x.get("severity", "info"), 3))

        # Store in database if client provided
        if supabase_client:
            try:
                # Clear previous findings for this content version
                supabase_client.table("findings").delete().eq("content_version_id", version_id).execute()
                if final_findings_dicts:
                    supabase_client.table("findings").insert(final_findings_dicts).execute()
                if disclosure_record:
                    supabase_client.table("ai_disclosures").insert(disclosure_record).execute()
            except Exception:
                pass

        return {
            "findings": final_findings_dicts,
            "ai_disclosure": disclosure_record,
            "rules_only_mode": rules_only_mode
        }

    @classmethod
    def _deduplicate_findings(
        cls,
        fixed_findings: List[Finding],
        ai_findings: List[Finding]
    ) -> List[Finding]:
        """
        review-engine.md §5 Deduplication Rules:
        1. If fixed check and AI check flag the same text span for the same category,
           keep the fixed-check finding and discard the AI finding.
        2. If two AI findings flag overlapping spans, keep higher confidence.
        """
        retained: List[Finding] = []
        for ff in fixed_findings:
            # Deduplicate overlapping spans within fixed findings (e.g. term check + banned words check)
            is_dup = False
            for r in retained:
                if (
                    ff.category == r.category and
                    ff.flagged_text and r.flagged_text and
                    (ff.flagged_text.lower() in r.flagged_text.lower() or r.flagged_text.lower() in ff.flagged_text.lower())
                ):
                    is_dup = True
                    break
            if not is_dup:
                retained.append(ff)

        for af in ai_findings:
            # Check overlap with any retained finding on same category
            is_dup = False
            for rf in retained:
                if (
                    af.category == rf.category and
                    af.flagged_text and rf.flagged_text and
                    (af.flagged_text.lower() in rf.flagged_text.lower() or rf.flagged_text.lower() in af.flagged_text.lower())
                ):
                    is_dup = True
                    break

            if not is_dup:
                retained.append(af)

        return retained
