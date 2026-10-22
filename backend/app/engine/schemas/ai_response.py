"""
Pydantic schemas for structured AI provider responses (T-084).
Enforces rigid JSON output validation to prevent hallucinations and malformed responses.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class AIToneFinding(BaseModel):
    rule_id: str
    flagged_text: str
    explanation: str
    severity: Literal["critical", "warning", "info"] = "warning"
    suggested_fix: Optional[str] = None
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)


class AIToneResponse(BaseModel):
    findings: List[AIToneFinding] = []


class AIClaimExtractionResponse(BaseModel):
    claims: List[str] = []


class AISuggestionResponse(BaseModel):
    suggested_fix: str
    explanation: str


class AIFactValidationResponse(BaseModel):
    claim: str
    is_supported: bool
    is_conflicting: bool
    confidence: float = 0.9
    explanation: str
