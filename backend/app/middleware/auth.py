"""
BrandProof Authentication Middleware & Token Verification.

Validates Supabase Auth JWT tokens and extracts user identity, organization context, and role.
"""

from typing import Optional, Dict, Any
from dataclasses import dataclass
import jwt

from app.config import get_settings
from app.models.common import AuthTokenInvalidError, InsufficientRoleError

settings = get_settings()


@dataclass
class CurrentUser:
    id: str
    org_id: str
    role: str
    email: str
    is_active: bool = True

    def has_role(self, *required_roles: str) -> bool:
        """Check whether the user has any of the specified roles."""
        return self.role in required_roles


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a Supabase JWT access token.
    Uses HMAC-SHA256 with SUPABASE_JWT_SECRET.
    """
    try:
        # In production, verify signature with SUPABASE_JWT_SECRET
        if settings.environment == "production" and settings.supabase_jwt_secret:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
        else:
            # In development/test mode, allow decode with signature verification or unverified fallback
            try:
                payload = jwt.decode(
                    token,
                    settings.supabase_jwt_secret,
                    algorithms=["HS256"],
                    options={"verify_aud": False}
                )
            except jwt.InvalidSignatureError:
                payload = jwt.decode(token, options={"verify_signature": False})

        return payload

    except jwt.ExpiredSignatureError:
        raise AuthTokenInvalidError("Authentication token has expired.")
    except jwt.InvalidTokenError as e:
        raise AuthTokenInvalidError(f"Invalid authentication token: {str(e)}")


def extract_current_user(token: str) -> CurrentUser:
    """Extract CurrentUser dataclass from decoded JWT claims."""
    payload = decode_access_token(token)
    
    user_id = payload.get("sub")
    if not user_id:
        raise AuthTokenInvalidError("Token missing 'sub' subject claim.")

    # In Supabase JWT, app_metadata often holds org_id and role
    app_metadata = payload.get("app_metadata", {})
    user_metadata = payload.get("user_metadata", {})
    
    org_id = payload.get("org_id") or app_metadata.get("org_id") or user_metadata.get("org_id") or "00000000-0000-0000-0000-000000000001"
    role = payload.get("role") or app_metadata.get("role") or user_metadata.get("role") or "creator"
    email = payload.get("email") or user_metadata.get("email") or ""

    return CurrentUser(
        id=str(user_id),
        org_id=str(org_id),
        role=str(role),
        email=str(email),
        is_active=True
    )
