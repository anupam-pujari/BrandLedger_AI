"""
BrandProof Standard API Response Envelope & Error Models.

Enforces consistent {success, data, error, meta} envelope across all endpoints
as specified in docs/backend/api-contract.md.
"""

from typing import Any, Dict, Generic, Optional, TypeVar
from dataclasses import dataclass, field

try:
    from pydantic import BaseModel, Field

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

except ImportError:
    # Fallback dataclass implementations
    @dataclass
    class MetaInfo:
        cursor: Optional[str] = None
        has_more: bool = False
        total: Optional[int] = None

    @dataclass
    class ErrorInfo:
        code: str
        message: str
        details: Dict[str, Any] = field(default_factory=dict)

    @dataclass
    class ApiResponse:
        success: bool = True
        data: Any = None
        error: Optional[ErrorInfo] = None
        meta: Optional[MetaInfo] = None


# ==============================================================================
# Domain & Service Exceptions
# ==============================================================================

class BrandProofException(Exception):
    """Base application exception."""
    status_code: int = 400
    error_code: str = "BAD_REQUEST"

    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        status_code: Optional[int] = None,
        error_code: Optional[str] = None
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


class AiServiceUnavailableError(BrandProofException):
    status_code = 503
    error_code = "AI_SERVICE_UNAVAILABLE"


class AuthTokenInvalidError(BrandProofException):
    status_code = 401
    error_code = "AUTH_INVALID_TOKEN"


class InsufficientRoleError(BrandProofException):
    status_code = 403
    error_code = "AUTH_INSUFFICIENT_ROLE"
