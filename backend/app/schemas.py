"""
BrandProof Unified Pydantic Schemas & Domain Exceptions.

Single source of truth for all request/response models, findings,
AI structured outputs, and application exceptions.
Directly implements the requirements in planing.txt and docs/backend/api-contract.md.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Generic, List, Literal, Optional, TypeVar, Union
from pydantic import BaseModel, Field, model_validator


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
    error_code = "AUTH_INSUFFICIENT_ROLE"


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
    claim_text: str = ""
    content: Optional[str] = None
    supporting_quote: Optional[str] = None
    source_document: Optional[str] = None
    owner_name: str
    owner_email: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    is_expired: bool = False
    status: Optional[str] = "active"
    tags: Optional[List[str]] = Field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    @model_validator(mode="after")
    def sync_content_and_claim_text(self):
        if not self.claim_text and self.content:
            self.claim_text = self.content
        elif not self.content and self.claim_text:
            self.content = self.claim_text
        return self


class FactCreateRequest(BaseModel):
    fact_code: Optional[str] = None
    claim_text: Optional[str] = None
    content: Optional[str] = None
    supporting_quote: Optional[str] = None
    source_document: Optional[str] = None
    owner_name: str = "Brand Team"
    owner_email: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    status: Optional[str] = "active"
    tags: Optional[List[str]] = None

    @model_validator(mode="after")
    def validate_and_sync(self):
        if not self.claim_text and self.content:
            self.claim_text = self.content
        elif not self.content and self.claim_text:
            self.content = self.claim_text
        if not self.claim_text:
            raise ValueError("Fact requires claim_text or content.")
        return self


class FactUpdateRequest(BaseModel):
    claim_text: Optional[str] = None
    content: Optional[str] = None
    supporting_quote: Optional[str] = None
    source_document: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    valid_until: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None

    @model_validator(mode="after")
    def sync_content_and_claim_text(self):
        if not self.claim_text and self.content:
            self.claim_text = self.content
        elif not self.content and self.claim_text:
            self.content = self.claim_text
        return self


class Term(BaseModel):
    id: str
    org_id: str
    term: str
    term_type: Literal["preferred", "banned"]
    preferred_replacement: Optional[str] = None
    replacement: Optional[str] = None
    case_sensitive: bool = False
    whole_word: bool = True
    notes: Optional[str] = None
    reason: Optional[str] = None
    created_at: Optional[str] = None

    @model_validator(mode="after")
    def sync_term_fields(self):
        if not self.preferred_replacement and self.replacement:
            self.preferred_replacement = self.replacement
        elif not self.replacement and self.preferred_replacement:
            self.replacement = self.preferred_replacement
        if not self.notes and self.reason:
            self.notes = self.reason
        elif not self.reason and self.notes:
            self.reason = self.notes
        return self


class TermCreateRequest(BaseModel):
    term: str
    term_type: Literal["preferred", "banned"]
    preferred_replacement: Optional[str] = None
    replacement: Optional[str] = None
    case_sensitive: bool = False
    whole_word: bool = True
    notes: Optional[str] = None
    reason: Optional[str] = None

    @model_validator(mode="after")
    def sync_term_fields(self):
        if not self.preferred_replacement and self.replacement:
            self.preferred_replacement = self.replacement
        elif not self.replacement and self.preferred_replacement:
            self.replacement = self.preferred_replacement
        if not self.notes and self.reason:
            self.notes = self.reason
        elif not self.reason and self.notes:
            self.reason = self.notes
        return self


class BrandAsset(BaseModel):
    id: str
    org_id: str
    name: str
    asset_type: Literal["logo", "color_palette", "font", "image", "guideline", "guideline_doc"]
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    usage_notes: Optional[str] = None
    created_at: Optional[str] = None


class AssetCreateRequest(BaseModel):
    name: str
    asset_type: Literal["logo", "color_palette", "font", "image", "guideline", "guideline_doc"]
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    usage_notes: Optional[str] = None


# ==============================================================================
# Content, Findings & Review Workflow Schemas
# ==============================================================================

ContentStatus = Literal["draft", "checked", "in_review", "changes_requested", "approved", "rejected"]
ContentType = Literal["text", "social_post", "social", "email", "document", "image", "slides"]


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
    diff_from_previous: Optional[str] = None


class ContentItem(BaseModel):
    id: str
    org_id: str
    title: str
    content_type: ContentType = "text"
    status: ContentStatus = "draft"
    author_id: Optional[str] = None
    current_version: Optional[Union[ContentVersion, int, Dict[str, Any]]] = None
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
    rules_only_mode: Optional[bool] = None


class FindingProof(BaseModel):
    rule_id: Optional[str] = None
    rule_code: Optional[str] = None
    fact_id: Optional[str] = None
    fact_code: Optional[str] = None
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_quote: Optional[str] = None
    claim_status: Optional[str] = None
    matched_fact_owner: Optional[str] = None
    matched_fact_expiry: Optional[str] = None


class Finding(BaseModel):
    id: Optional[str] = None
    content_item_id: Optional[str] = None
    content_version_id: Optional[str] = None
    org_id: Optional[str] = None
    check_type: Literal["rule_check", "ai_assisted", "rule", "ai"] = "rule_check"
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
    character_start: Optional[int] = None
    character_end: Optional[int] = None
    proof: Optional[FindingProof] = None


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
    accept_count: int = 0
    dismiss_count: int = 0
    accept_rate: float = 0.0
    dismiss_rate: float = 0.0
    override_rate: float = 0.0
    is_unclear: bool = False
    suggested_rewrite: Optional[str] = None


class RecurringMistake(BaseModel):
    key: str
    group: Optional[str] = None
    category: Optional[RuleCategory] = None
    count: int = 0
    total_violations: int = 0
    common_phrases: List[str] = Field(default_factory=list)
    top_issues: List[Dict[str, Any]] = Field(default_factory=list)
    rule_code: Optional[str] = None


class DashboardStats(BaseModel):
    total_reviews: int = 0
    active_rules: int = 0
    active_facts: int = 0
    expired_facts: int = 0
    average_review_time_mins: float = 2.2
    manual_review_time_mins: float = 16.5
    time_saved_percent: float = 86.7
    accuracy_rate: float = 93.4

    # Frontend dashboard compatibility fields
    total_content_items: int = 0
    approved_content_items: int = 0
    approval_rate: float = 0.85
    total_findings_detected: int = 0
    critical_findings: int = 0
    warning_findings: int = 0
    active_rules_count: int = 0
    active_facts_count: int = 0
    review_engine_health: str = "operational"
