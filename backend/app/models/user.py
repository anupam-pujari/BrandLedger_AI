"""
User Management Pydantic Models.
"""

from typing import Optional, Literal
from pydantic import BaseModel, EmailStr


class UserInviteRequest(BaseModel):
    email: EmailStr
    role: Literal["creator", "reviewer", "brand_manager", "admin"]
    display_name: str


class UserUpdateRequest(BaseModel):
    role: Optional[Literal["creator", "reviewer", "brand_manager", "admin"]] = None
    is_active: Optional[bool] = None
