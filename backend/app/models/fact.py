"""
Approved Facts Vault Pydantic Models.
"""

from typing import Optional, List, Literal
from datetime import date, datetime
from pydantic import BaseModel

FactStatus = Literal["active", "expired", "retired"]


class FactBase(BaseModel):
    fact_code: str
    content: str
    owner_id: str
    source_document: Optional[str] = None
    valid_until: date
    tags: List[str] = []


class FactCreate(FactBase):
    pass


class FactUpdate(BaseModel):
    content: Optional[str] = None
    owner_id: Optional[str] = None
    source_document: Optional[str] = None
    valid_until: Optional[date] = None
    status: Optional[FactStatus] = None
    tags: Optional[List[str]] = None


class FactInDB(FactBase):
    id: str
    org_id: str
    status: FactStatus = "active"
    is_expired: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
