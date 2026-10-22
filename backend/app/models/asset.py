"""
Brand Asset Library Pydantic Models.
"""

from typing import Optional, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel

AssetType = Literal["logo", "colour", "font", "image"]


class AssetBase(BaseModel):
    name: str
    asset_type: AssetType
    metadata: Dict[str, Any] = {}
    usage_notes: Optional[str] = None


class AssetCreate(AssetBase):
    file_path: Optional[str] = None


class AssetInDB(AssetBase):
    id: str
    org_id: str
    file_path: Optional[str] = None
    signed_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
