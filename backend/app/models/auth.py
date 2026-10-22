"""
Authentication Pydantic Models.
"""

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str
    org_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
