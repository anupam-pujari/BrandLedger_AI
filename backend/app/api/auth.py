"""
BrandProof Authentication, Users & Organization Settings API Router.

Implements:
  - POST /auth/login
  - POST /auth/signup
  - GET /auth/me
  - GET /users, POST /users/invite, PATCH /users/:id
  - GET /org/settings, PATCH /org/settings
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from app.config import get_settings
from app.schemas import (
    ApiResponse,
    LoginRequest,
    LoginResponse,
    OrgSettingsUpdate,
    Organization,
    SignupRequest,
    UserInviteRequest,
    UserProfile,
    UserUpdateRequest,
)
from app.store import store

settings = get_settings()
router = APIRouter(tags=["Auth & Organization"])


def create_access_token(user_id: str, email: str, role: str, org_id: str) -> str:
    """Generate signed HS256 JWT access token."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "org_id": org_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=7)).timestamp()),
    }
    return jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")


def get_current_user_from_header(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Helper to extract active user from Authorization header or default to creator."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()

        # 1. Attempt standard JWT decode
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            user_id = str(payload.get("sub") or payload.get("id") or "usr-01")
            org_id = str(payload.get("org_id") or "00000000-0000-0000-0000-000000000001")
            role = str(payload.get("role") or "creator")
            email = str(payload.get("email") or "")
            display_name = str(payload.get("display_name") or email or "User")

            if user_id in store.users:
                # Update role/org if specified in JWT
                store.users[user_id]["role"] = role
                store.users[user_id]["org_id"] = org_id
                return store.users[user_id]

            user_dict = {
                "id": user_id,
                "org_id": org_id,
                "role": role,
                "email": email,
                "display_name": display_name,
                "is_active": True,
            }
            store.users[user_id] = user_dict
            return user_dict
        except Exception:
            pass

        # 2. Support demo token format (e.g., demo-token-<id>)
        clean_token = token
        if clean_token.startswith("demo-token-"):
            clean_token = clean_token.replace("demo-token-", "")

        if clean_token in store.users:
            return store.users[clean_token]

        for u in store.users.values():
            if u["id"] == clean_token or u["email"] == clean_token or clean_token.startswith(u["role"]):
                return u

    # Default to creator user for dev/mock convenience
    return store.users.get("usr-01", {
        "id": "usr-01",
        "org_id": "00000000-0000-0000-0000-000000000001",
        "email": "creator@apexcloud.io",
        "display_name": "Maya Lin (Content Creator)",
        "role": "creator",
    })


@router.post("/auth/login", response_model=ApiResponse[LoginResponse])
async def login(payload: LoginRequest):
    user = store.get_user_by_email(payload.email)
    if not user:
        user = store.users.get("usr-01")

    org = store.organisations.get(user["org_id"], list(store.organisations.values())[0])
    access_token = create_access_token(user["id"], user["email"], user["role"], user["org_id"])

    return ApiResponse(
        data=LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserProfile(**user),
            organisation=Organization(**org),
        )
    )


@router.post("/auth/signup", response_model=ApiResponse[LoginResponse], status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest):
    org_id = f"org-{len(store.organisations)+1:02d}"
    store.organisations[org_id] = {
        "id": org_id,
        "name": payload.org_name,
        "slug": payload.org_name.lower().replace(" ", "-"),
        "settings": {"rules_only_mode": False, "ai_provider": "openai"},
    }

    user = store.invite_user(
        org_id=org_id,
        email=payload.email,
        role="admin",
        display_name=payload.display_name,
    )
    access_token = create_access_token(user["id"], user["email"], user["role"], org_id)

    return ApiResponse(
        data=LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserProfile(**user),
            organisation=Organization(**store.organisations[org_id]),
        )
    )


@router.get("/auth/me", response_model=ApiResponse[Dict[str, Any]])
async def get_me(user: Dict[str, Any] = Depends(get_current_user_from_header)):
    org = store.organisations.get(user["org_id"], list(store.organisations.values())[0])
    return ApiResponse(data={
        "user": UserProfile(**user),
        "organisation": Organization(**org),
    })


@router.get("/users", response_model=ApiResponse[Dict[str, Any]])
async def list_users(
    role: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    users = store.list_users(org_id=user["org_id"], role=role)
    return ApiResponse(data={"users": [UserProfile(**u) for u in users]})


@router.post("/users/invite", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def invite_user(
    payload: UserInviteRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    new_user = store.invite_user(
        org_id=user["org_id"],
        email=payload.email,
        role=payload.role,
        display_name=payload.display_name,
    )
    return ApiResponse(data={"user": UserProfile(**new_user)})


@router.patch("/users/{user_id}", response_model=ApiResponse[Dict[str, Any]])
async def update_user(user_id: str, payload: UserUpdateRequest):
    updated = store.update_user(user_id, payload.model_dump(exclude_unset=True))
    return ApiResponse(data={"user": UserProfile(**updated)})


@router.get("/org/settings", response_model=ApiResponse[Dict[str, Any]])
async def get_org_settings(user: Dict[str, Any] = Depends(get_current_user_from_header)):
    settings_data = store.get_org_settings(user["org_id"])
    return ApiResponse(data={"settings": settings_data})


@router.patch("/org/settings", response_model=ApiResponse[Dict[str, Any]])
async def update_org_settings(
    payload: OrgSettingsUpdate,
    user: Dict[str, Any] = Depends(get_current_user_from_header),
):
    updated = store.update_org_settings(user["org_id"], payload.model_dump(exclude_unset=True))
    return ApiResponse(data={"settings": updated})
