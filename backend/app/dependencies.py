"""
BrandProof Shared FastAPI Dependencies.

Provides dependency injection for:
  - User authentication via Authorization: Bearer <token>.
  - Role-based authorization guards (require_role).
  - Supabase database client injection.
"""

from typing import Callable
from app.models.common import AuthTokenInvalidError, InsufficientRoleError
from app.middleware.auth import CurrentUser, extract_current_user
from app.db.client import get_supabase_admin, get_user_scoped_client

try:
    from fastapi import Header, Depends, Security
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

    security = HTTPBearer(auto_error=False)

    async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Security(security)
    ) -> CurrentUser:
        """Extract and validate the active user from the HTTP Bearer token."""
        if not credentials or not credentials.credentials:
            raise AuthTokenInvalidError("Missing Authorization Bearer token header.")
        return extract_current_user(credentials.credentials)

    def require_role(*allowed_roles: str) -> Callable:
        """
        Dependency factory that restricts endpoint access to specified roles.
        Example: @router.post('/rules', dependencies=[Depends(require_role('brand_manager', 'admin'))])
        """
        async def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
            if not current_user.has_role(*allowed_roles):
                raise InsufficientRoleError(
                    f"Action requires one of the following roles: {list(allowed_roles)}. Your role is '{current_user.role}'."
                )
            return current_user

        return role_checker

except ImportError:
    # Stub for testing before fastapi is loaded
    async def get_current_user():
        pass

    def require_role(*allowed_roles: str):
        def _checker():
            pass
        return _checker
