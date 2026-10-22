"""
Gemini Provider (T-083).
Uses the modern Google GenAI SDK (google.genai) for tone review, claims, and suggestions.
"""

from typing import List, Dict, Any, Optional
import json
import re
from app.ai.base import AIService
from app.config import get_settings
from app.engine.schemas.ai_response import (
    AIToneResponse,
    AIClaimExtractionResponse,
    AISuggestionResponse,
    AIFactValidationResponse
)

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None


class GeminiProvider(AIService):
    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.gemini_api_key
        self.client: Any = None
        if genai and self.api_key:
            self.client = genai.Client(api_key=self.api_key)

    @property
    def provider_name(self) -> str:
        return "gemini"

    def _extract_json(self, text: str) -> dict:
        """Strip markdown fences if present and parse json."""
        clean = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.IGNORECASE)
        clean = re.sub(r"\s*```$", "", clean)
        return json.loads(clean)

    async def check_tone(
        self,
        masked_text: str,
        tone_rules: List[Dict[str, Any]]
    ) -> AIToneResponse:
        if not self.client:
            from app.ai.local_provider import LocalAIProvider
            return await LocalAIProvider().check_tone(masked_text, tone_rules)

        rules_summary = "\n".join([
            f"- Rule ID: {r.get('id')}, Code: {r.get('rule_code')}, Desc: {r.get('description')}, "
            f"Bad: '{r.get('bad_example')}', Good: '{r.get('good_example')}'"
            for r in tone_rules
        ])
        prompt = f"""
You are a brand tone auditor. Analyze the following text against the tone rules.
Respond strictly in JSON with format:
{{
  "findings": [
    {{
      "rule_id": "rule_id_from_input",
      "flagged_text": "verbatim text flagged",
      "explanation": "reason for tone mismatch",
      "severity": "critical" | "warning" | "info",
      "suggested_fix": "suggested revision",
      "confidence": 0.85
    }}
  ]
}}

RULES:
{rules_summary}

TEXT:
{masked_text}
"""
        config = types.GenerateContentConfig(response_mime_type="application/json") if types else None
        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=config
        )
        data = self._extract_json(response.text or "{}")
        return AIToneResponse(**data)

    async def extract_claims(
        self,
        masked_text: str
    ) -> AIClaimExtractionResponse:
        if not self.client:
            from app.ai.local_provider import LocalAIProvider
            return await LocalAIProvider().extract_claims(masked_text)

        prompt = f"""
Extract all factual assertions or claims from this text.
Return JSON:
{{"claims": ["claim 1", "claim 2"]}}

TEXT:
{masked_text}
"""
        config = types.GenerateContentConfig(response_mime_type="application/json") if types else None
        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=config
        )
        data = self._extract_json(response.text or "{}")
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
Does the CLAIM match the APPROVED FACTS?
Return JSON:
{{
  "claim": "{claim}",
  "is_supported": true/false,
  "is_conflicting": true/false,
  "confidence": 0.9,
  "explanation": "concise explanation"
}}

CLAIM:
{claim}

FACTS:
{facts_text}
"""
        config = types.GenerateContentConfig(response_mime_type="application/json") if types else None
        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=config
        )
        data = self._extract_json(response.text or "{}")
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
Rewrite the text to fix the brand issue without violating Intent Lock.
Return JSON:
{{"suggested_fix": "replacement", "explanation": "reasoning"}}

FLAGGED: {flagged_text}
ISSUE: {issue_description}
GUIDELINE: {rule_or_fact_content}
INTENT: Purpose={intent_purpose}, Audience={intent_audience}, KeyMessage={intent_key_message}
"""
        config = types.GenerateContentConfig(response_mime_type="application/json") if types else None
        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=config
        )
        data = self._extract_json(response.text or "{}")
        return AISuggestionResponse(**data)
