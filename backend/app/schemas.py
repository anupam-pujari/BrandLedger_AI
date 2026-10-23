"""
BrandProof Unified Pydantic Schemas & Domain Exceptions.

Single source of truth for all request/response models, findings,
AI structured outputs, and application exceptions.
Directly implements the requirements in planing.txt and docs/backend/api-contract.md.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Generic, List, Literal, Optional, TypeVar
from pydantic import BaseModel, Field


# ==============================================================================
# Standard API Response Envelopes
# ==============================================================================

class MetaInfo(BaseModel):
    cursor: Optional[str] = None
    has_more: bool = False
    total: Optional[int] = None


class ErrorInfo(BaseModel):
    code: str
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    error: Optional[ErrorInfo] = None
    meta: Optional[MetaInfo] = None


# ==============================================================================
# Domain Exceptions
# ==============================================================================

class BrandProofException(Exception):
    status_code: int = 400
    error_code: str = "BAD_REQUEST"

    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        status_code: Optional[int] = None,
        error_code: Optional[str] = None,
    ):
        super().__init__(message)
        self.message = message
        self.details = details or {}
        if status_code is not None:
            self.status_code = status_code
        if error_code is not None:
            self.error_code = error_code


class EntityNotFoundError(BrandProofException):
    status_code = 404
    error_code = "ENTITY_NOT_FOUND"


class InvalidTransitionError(BrandProofException):
    status_code = 409
    error_code = "CONTENT_INVALID_TRANSITION"


class SelfApprovalError(BrandProofException):
    status_code = 403
    error_code = "CONTENT_SELF_APPROVAL"


class FindingReasonRequiredError(BrandProofException):
    status_code = 422
    error_code = "FINDING_REASON_REQUIRED"


class AuthTokenInvalidError(BrandProofException):
    status_code = 401
    error_code = "AUTH_TOKEN_INVALID"


class InsufficientRoleError(BrandProofException):
    status_code = 403
    error_code = "INSUFFICIENT_ROLE"


# ==============================================================================
# User, Auth & Org Schemas
# ==============================================================================

UserRole = Literal["creator", "reviewer", "brand_manager", "admin"]


class UserProfile(BaseModel):
    id: str
    org_id: str
    email: str
    display_name: str
    role: UserRole = "creator"
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None


class Organization(BaseModel):
    id: str
    name: str
    slug: str
    settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    display_name: str
    org_name: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
    organisation: Organization


class UserInviteRequest(BaseModel):
    email: str
    role: UserRole
    display_name: str


class UserUpdateRequest(BaseModel):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class OrgSettingsUpdate(BaseModel):
    rules_only_mode: Optional[bool] = None
    ai_provider: Optional[str] = None
    masking_config: Optional[Dict[str, bool]] = None


# ==============================================================================
# Knowledge Schemas: Rules, Facts, Terms, Assets
# ==============================================================================

RuleCategory = Literal["tone", "terminology", "messaging", "visual", "accessibility", "claims"]
RuleSeverity = Literal["critical", "warning", "info"]
RuleStatus = Literal["draft", "approved", "rejected", "archived", "needs_examples"]


class Rule(BaseModel):
    id: str
    org_id: str
    rule_code: str
    category: RuleCategory
    title: str
    description: str
    severity: RuleSeverity = "warning"
    good_example: Optional[str] = None
    bad_example: Optional[str] = None
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_quote: Optional[str] = None
    status: RuleStatus = "approved"
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class RuleCreateRequest(BaseModel):
    rule_code: Optional[str] = None
    category: RuleCategory
    title: str
    description: str
    severity: RuleSeverity = "warning"
    good_example: Optional[str] = None
    bad_example: Optional[str] = None
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_quote: Optional[str] = None


class RuleUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[RuleSeverity] = None
    category: Optional[RuleCategory] = None
    good_example: Optional[str] = None
    bad_example: Optional[str] = None
    status: Optional[RuleStatus] = None


class Fact(BaseModel):
    id: str
    org_id: str
    fact_code: str
    claim_text: str
    supporting_quote: Optional[str] = None
    source_document: Optional[str] = None
    owner_name: str
    owner_email: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    is_expired: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class FactCreateRequest(BaseModel):
    fact_code: Optional[str] = None
    claim_text: str
    supporting_quote: Optional[str] = None
    source_document: Optional[str] = None
    owner_name: str
    owner_email: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None


class FactUpdateRequest(BaseModel):
    claim_text: Optional[str] = None
    supporting_quote: Optional[str] = None
    source_document: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    valid_until: Optional[str] = None


class Term(BaseModel):
    id: str
    org_id: str
    term: str
    term_type: Literal["preferred", "banned"]
    preferred_replacement: Optional[str] = None
    case_sensitive: bool = False
    notes: Optional[str] = None
    created_at: Optional[str] = None


class TermCreateRequest(BaseModel):
    term: str
    term_type: Literal["preferred", "banned"]
    preferred_replacement: Optional[str] = None
    case_sensitive: bool = False
    notes: Optional[str] = None


class BrandAsset(BaseModel):
    id: str
    org_id: str
    name: str
    asset_type: Literal["logo", "color_palette", "font", "image", "guideline"]
    file_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    usage_notes: Optional[str] = None
    created_at: Optional[str] = None


class AssetCreateRequest(BaseModel):
    name: str
    asset_type: Literal["logo", "color_palette", "font", "image", "guideline"]
    file_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    usage_notes: Optional[str] = None


# ==============================================================================
# Content, Findings & Review Workflow Schemas
# ==============================================================================

ContentStatus = Literal["draft", "checked", "in_review", "changes_requested", "approved", "rejected"]
ContentType = Literal["text", "social_post", "email", "document", "image", "slides"]


class IntentLock(BaseModel):
    purpose: Optional[str] = None
    audience: Optional[str] = None
    key_message: Optional[str] = None


class ContentVersion(BaseModel):
    id: str
    content_item_id: str
    version_number: int
    body: str
    title: Optional[str] = None
    extracted_text: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ContentItem(BaseModel):
    id: str
    org_id: str
    title: str
    content_type: ContentType = "text"
    status: ContentStatus = "draft"
    author_id: Optional[str] = None
    current_version: int = 1
    intent_purpose: Optional[str] = None
    intent_audience: Optional[str] = None
    intent_key_message: Optional[str] = None
    rules_only_mode: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    latest_version: Optional[ContentVersion] = None
    findings_count: int = 0


class ContentCreateRequest(BaseModel):
    title: str
    content_type: ContentType = "text"
    body: str
    intent_purpose: Optional[str] = None
    intent_audience: Optional[str] = None
    intent_key_message: Optional[str] = None
    rules_only_mode: bool = False


class ContentUpdateRequest(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    intent_purpose: Optional[str] = None
    intent_audience: Optional[str] = None
    intent_key_message: Optional[str] = None


class Finding(BaseModel):
    id: Optional[str] = None
    content_item_id: Optional[str] = None
    content_version_id: Optional[str] = None
    org_id: Optional[str] = None
    check_type: Literal["rule_check", "ai_assisted"] = "rule_check"
    category: RuleCategory
    rule_id: Optional[str] = None
    rule_code: Optional[str] = None
    fact_id: Optional[str] = None
    fact_code: Optional[str] = None
    severity: RuleSeverity
    title: str
    description: str
    flagged_text: Optional[str] = None
    evidence_quote: Optional[str] = None
    suggested_fix: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    needs_human_judgement: bool = False
    status: Literal["open", "accepted", "edited", "dismissed"] = "open"
    dismiss_reason: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[str] = None
    created_at: Optional[str] = None


class FindingResolveRequest(BaseModel):
    status: Literal["accepted", "edited", "dismissed"]
    dismiss_reason: Optional[str] = None
    edited_text: Optional[str] = None


class AIDisclosure(BaseModel):
    id: str
    content_item_id: str
    version_id: str
    provider: str
    masked_prompt: str
    check_type: str
    model_name: Optional[str] = None
    tokens_used: Optional[int] = None
    timestamp: str


class Comment(BaseModel):
    id: str
    content_item_id: str
    author_id: str
    author_name: str
    finding_id: Optional[str] = None
    text: str
    created_at: str


class CommentCreateRequest(BaseModel):
    text: str
    finding_id: Optional[str] = None


# ==============================================================================
# Insights & Dashboard Schemas
# ==============================================================================

class RuleHealthStat(BaseModel):
    rule_id: str
    rule_code: str
    title: str
    category: RuleCategory
    trigger_count: int
    accept_count: int
    dismiss_count: int
    override_rate: float
    is_unclear: bool
    suggested_rewrite: Optional[str] = None


class RecurringMistake(BaseModel):
    key: str
    category: RuleCategory
    count: int
    common_phrases: List[str]
    rule_code: Optional[str] = None


class DashboardStats(BaseModel):
    total_reviews: int
    active_rules: int
    active_facts: int
    expired_facts: int
    average_review_time_mins: float
    manual_review_time_mins: float
    time_saved_percent: float
    accuracy_rate: float
