"""
AI Service Factory.
Instantiates the configured AI provider (OpenAI, Gemini, or Local fallback).
"""

from app.config import get_settings
from app.ai.base import AIService
from app.ai.openai_provider import OpenAIProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.local_provider import LocalAIProvider


def get_ai_service(provider_preference: str = None) -> AIService:
    settings = get_settings()
    pref = (provider_preference or settings.ai_provider or "openai").lower()

    if pref == "gemini" and settings.gemini_api_key:
        return GeminiProvider()
    elif pref == "openai" and settings.openai_api_key:
        return OpenAIProvider()
    elif settings.openai_api_key:
        return OpenAIProvider()
    elif settings.gemini_api_key:
        return GeminiProvider()
    else:
        return LocalAIProvider()
