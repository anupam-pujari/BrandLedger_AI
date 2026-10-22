"""
Terminology Pydantic Models.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class TermBase(BaseModel):
    preferred_term: str
    banned_alternatives: List[str] = []
    notes: Optional[str] = None
    case_sensitive: bool = False


class TermCreate(TermBase):
    pass


class TermUpdate(BaseModel):
    preferred_term: Optional[str] = None
    banned_alternatives: Optional[List[str]] = None
    notes: Optional[str] = None
    case_sensitive: Optional[bool] = None


class TermInDB(TermBase):
    id: str
    org_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
