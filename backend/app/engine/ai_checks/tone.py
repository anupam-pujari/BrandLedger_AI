"""
AI Tone Check (T-085).
Evaluates text against brand tone rules with verbatim match validation and unmasking.
"""

from typing import List, Dict, Any
from app.ai.base import AIService
from app.ai.masking import MaskingService
from app.engine.schemas.finding import Finding


async def check_tone_ai(
    masked_text: str,
    original_text: str,
    masking_map: Dict[str, str],
    tone_rules: List[Dict[str, Any]],
    ai_service: AIService
) -> List[Finding]:
    findings: List[Finding] = []
    if not masked_text or not tone_rules:
        return findings

    try:
        response = await ai_service.check_tone(masked_text, tone_rules)
    except Exception:
        return findings

    rules_by_id = {r["id"]: r for r in tone_rules if "id" in r}

    for ai_finding in response.findings:
        # Confidence threshold check (review-engine.md §6)
        if ai_finding.confidence < 0.40:
            continue

        # Verbatim match check (review-engine.md §1)
        if ai_finding.flagged_text not in masked_text:
            continue

        # Unmask text for presentation
        unmasked_flagged = MaskingService.unmask(ai_finding.flagged_text, masking_map)
        unmasked_fix = MaskingService.unmask(ai_finding.suggested_fix or "", masking_map) if ai_finding.suggested_fix else None
        unmasked_explanation = MaskingService.unmask(ai_finding.explanation, masking_map)

        rule = rules_by_id.get(ai_finding.rule_id, {})
        evidence = rule.get("good_example") or f"Rule {rule.get('rule_code', '')}: {rule.get('description', '')}"

        needs_human = ai_finding.confidence < 0.85

        findings.append(Finding(
            check_type="ai_assisted",
            category="tone",
            severity=ai_finding.severity,
            rule_id=ai_finding.rule_id,
            title="Tone mismatch detected",
            description=unmasked_explanation,
            flagged_text=unmasked_flagged,
            evidence_quote=evidence,
            suggested_fix=unmasked_fix,
            confidence=ai_finding.confidence,
            needs_human_judgement=needs_human
        ))

    return findings
