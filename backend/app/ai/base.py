"""
AI Provider Abstract Base Class (T-081).
Defines standard interface for tone analysis, claim extraction, fact verification, and intent-locked suggestions.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.engine.schemas.ai_response import (
    AIToneResponse,
    AIClaimExtractionResponse,
    AISuggestionResponse,
    AIFactValidationResponse
)


class AIService(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g., 'openai', 'gemini', 'local')."""
        pass

    @abstractmethod
    async def check_tone(
        self,
        masked_text: str,
        tone_rules: List[Dict[str, Any]]
    ) -> AIToneResponse:
        """Checks text against brand tone rules."""
        pass

    @abstractmethod
    async def extract_claims(
        self,
        masked_text: str
    ) -> AIClaimExtractionResponse:
        """Extracts factual or comparative assertions from text."""
        pass

    @abstractmethod
    async def validate_claim(
        self,
        claim: str,
        matched_facts: List[Dict[str, Any]]
    ) -> AIFactValidationResponse:
        """Validates if extracted claim is supported or contradicted by matched facts."""
        pass

    @abstractmethod
    async def generate_suggestion(
        self,
        flagged_text: str,
        issue_description: str,
        rule_or_fact_content: str,
        intent_purpose: Optional[str] = None,
        intent_audience: Optional[str] = None,
        intent_key_message: Optional[str] = None
    ) -> AISuggestionResponse:
        """Generates contextual rewrites while strictly adhering to the Intent Lock."""
        pass
