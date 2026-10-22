"""
OpenAI Provider (T-082).
Communicates with OpenAI API for tone review, claim extraction, and intent-locked suggestion generation.
"""

from typing import List, Dict, Any, Optional
import json
from app.ai.base import AIService
from app.config import get_settings
from app.engine.schemas.ai_response import (
    AIToneResponse,
    AIClaimExtractionResponse,
    AISuggestionResponse,
    AIFactValidationResponse
)

try:
    import openai  # pyright: ignore[reportMissingImports]
except ImportError:
    openai = None


class OpenAIProvider(AIService):
    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.openai_api_key
        self.client: Any = openai.AsyncOpenAI(api_key=self.api_key) if openai and self.api_key else None

    @property
    def provider_name(self) -> str:
        return "openai"

    async def check_tone(
        self,
        masked_text: str,
        tone_rules: List[Dict[str, Any]]
    ) -> AIToneResponse:
        if not self.client:
            from app.ai.local_provider import LocalAIProvider
            return await LocalAIProvider().check_tone(masked_text, tone_rules)

        rules_summary = "\n".join([
            f"- Rule ID: {r.get('id')}, Code: {r.get('rule_code')}, Title: {r.get('title')}, "
            f"Desc: {r.get('description')}, Bad: '{r.get('bad_example')}', Good: '{r.get('good_example')}'"
            for r in tone_rules
        ])

        prompt = f"""
You are a strict brand governance reviewer.
Analyze the following text against the provided tone rules.
Return only valid JSON matching this schema:
{{
  "findings": [
    {{
      "rule_id": "rule_id_from_input",
      "flagged_text": "exact verbatim text from the input",
      "explanation": "why this violates the tone rule",
      "severity": "critical" | "warning" | "info",
      "suggested_fix": "compliant alternative text",
      "confidence": 0.0 - 1.0
    }}
  ]
}}

TONE RULES:
{rules_summary}

TEXT TO REVIEW:
{masked_text}
"""
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content or "{}")
        return AIToneResponse(**data)

    async def extract_claims(
        self,
        masked_text: str
    ) -> AIClaimExtractionResponse:
        if not self.client:
            from app.ai.local_provider import LocalAIProvider
            return await LocalAIProvider().extract_claims(masked_text)

        prompt = f"""
Extract all factual, performance, or promotional claims from the following text.
A claim is any statement that asserts a verifiable metric, feature, capability, or comparison.
Return only JSON:
{{
  "claims": ["claim 1", "claim 2"]
}}

TEXT:
{masked_text}
"""
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content or "{}")
        return AIClaimExtractionResponse(**data)

    async def validate_claim(
        self,
        claim: str,
        matched_facts: List[Dict[str, Any]]
    ) -> AIFactValidationResponse:
        if not self.client:
            from app.ai.local_provider import LocalAIProvider
            return await LocalAIProvider().validate_claim(claim, matched_facts)

        facts_text = "\n".join([f"- Fact {f.get('fact_code')}: {f.get('content')}" for f in matched_facts])
        prompt = f"""
Verify if the CLAIM is supported or contradicted by the APPROVED FACTS.
Return JSON:
{{
  "claim": "{claim}",
  "is_supported": true/false,
  "is_conflicting": true/false,
  "confidence": 0.0-1.0,
  "explanation": "concise explanation"
}}

CLAIM:
{claim}

APPROVED FACTS:
{facts_text}
"""
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content or "{}")
        return AIFactValidationResponse(**data)

    async def generate_suggestion(
        self,
        flagged_text: str,
        issue_description: str,
        rule_or_fact_content: str,
        intent_purpose: Optional[str] = None,
        intent_audience: Optional[str] = None,
        intent_key_message: Optional[str] = None
    ) -> AISuggestionResponse:
        if not self.client:
            from app.ai.local_provider import LocalAIProvider
            return await LocalAIProvider().generate_suggestion(
                flagged_text, issue_description, rule_or_fact_content,
                intent_purpose, intent_audience, intent_key_message
            )

        prompt = f"""
Rewrite the flagged text to fix the brand issue while preserving the author's Intent Lock.
Return JSON:
{{
  "suggested_fix": "re-written text",
  "explanation": "how the fix resolves the issue while respecting intent"
}}

FLAGGED TEXT:
{flagged_text}

ISSUE:
{issue_description}

RULE / APPROVED FACT:
{rule_or_fact_content}

INTENT LOCK:
- Purpose: {intent_purpose or 'unspecified'}
- Audience: {intent_audience or 'general'}
- Key message: {intent_key_message or 'unspecified'}
"""
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content or "{}")
        return AISuggestionResponse(**data)
