"""
Rulebook Pydantic Models.
"""

from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field

RuleCategory = Literal["tone", "terminology", "messaging", "visual", "accessibility", "claims"]
RuleSeverity = Literal["critical", "warning", "info"]
RuleStatus = Literal["draft", "approved", "rejected", "needs_examples"]


class RuleBase(BaseModel):
    rule_code: str
    category: RuleCategory
    title: str
    description: str
    severity: RuleSeverity
    good_example: Optional[str] = None
    bad_example: Optional[str] = None
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_quote: Optional[str] = None


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    category: Optional[RuleCategory] = None
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[RuleSeverity] = None
    good_example: Optional[str] = None
    bad_example: Optional[str] = None
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_quote: Optional[str] = None


class RuleStatusUpdate(BaseModel):
    status: RuleStatus


class RuleInDB(RuleBase):
    id: str
    org_id: str
    status: RuleStatus = "draft"
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
