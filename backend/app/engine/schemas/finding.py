"""
Standard Finding Schema across all Review Engine Checks.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field

FindingCategory = Literal["tone", "terminology", "messaging", "visual", "accessibility", "claims"]
FindingSeverity = Literal["critical", "warning", "info"]
CheckType = Literal["rule_check", "ai_assisted"]
FindingStatus = Literal["open", "accepted", "edited", "dismissed"]


class Finding(BaseModel):
    id: Optional[str] = None
    content_item_id: Optional[str] = None
    content_version_id: Optional[str] = None
    org_id: Optional[str] = None
    check_type: CheckType = "rule_check"
    category: FindingCategory
    rule_id: Optional[str] = None
    fact_id: Optional[str] = None
    severity: FindingSeverity
    title: str
    description: str
    flagged_text: Optional[str] = None
    evidence_quote: Optional[str] = None
    suggested_fix: Optional[str] = None
    confidence: Optional[float] = Field(default=1.0, ge=0.0, le=1.0)
    needs_human_judgement: bool = False
    status: FindingStatus = "open"
    dismiss_reason: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[str] = None
    created_at: Optional[str] = None


class FindingResolveRequest(BaseModel):
    status: Literal["accepted", "edited", "dismissed"]
    dismiss_reason: Optional[str] = None
    edited_text: Optional[str] = None
