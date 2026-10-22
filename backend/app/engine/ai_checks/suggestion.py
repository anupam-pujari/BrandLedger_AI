"""
Intent-Locked Suggestion Engine (T-089).
Generates alternative phrasing for findings that respects the creator's Purpose, Audience, and Key Message.
"""

from typing import Optional, Dict, Any
from app.ai.base import AIService
from app.ai.masking import MaskingService


async def generate_intent_locked_suggestion(
    flagged_text: str,
    finding_description: str,
    evidence_quote: str,
    ai_service: AIService,
    intent_purpose: Optional[str] = None,
    intent_audience: Optional[str] = None,
    intent_key_message: Optional[str] = None,
    masking_map: Dict[str, str] = None
) -> str:
    masked_flagged, local_map = MaskingService.mask(flagged_text or "")
    combined_map = {**(masking_map or {}), **local_map}

    try:
        res = await ai_service.generate_suggestion(
            flagged_text=masked_flagged,
            issue_description=finding_description,
            rule_or_fact_content=evidence_quote,
            intent_purpose=intent_purpose,
            intent_audience=intent_audience,
            intent_key_message=intent_key_message
        )
        return MaskingService.unmask(res.suggested_fix, combined_map)
    except Exception:
        # Fallback suggestion
        return f"Align with brand guidelines: {evidence_quote}"
