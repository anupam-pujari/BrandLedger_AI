"""
Content and Version Management Pydantic Models.
"""

from typing import Optional, Literal, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

ContentType = Literal["text", "social_post", "email", "document", "image"]
ContentFormat = Literal["plain_text", "pdf", "docx", "pptx", "png", "jpg"]
ContentStatus = Literal["draft", "checking", "checked", "in_review", "changes_requested", "approved"]


class ContentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content_type: ContentType = "text"
    format: Optional[ContentFormat] = "plain_text"
    body: Optional[str] = ""
    intent_purpose: Optional[str] = None
    intent_audience: Optional[str] = None
    intent_key_message: Optional[str] = None
    rules_only_mode: bool = False


class ContentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    body: Optional[str] = None
    intent_purpose: Optional[str] = None
    intent_audience: Optional[str] = None
    intent_key_message: Optional[str] = None
    rules_only_mode: Optional[bool] = None


class ContentVersionResponse(BaseModel):
    id: str
    content_item_id: str
    version_number: int
    body: str
    extracted_text: Optional[str] = None
    diff_from_previous: Optional[Any] = None
    created_at: str
    created_by: Optional[str] = None


class ContentItemResponse(BaseModel):
    id: str
    org_id: str
    author_id: str
    title: str
    content_type: ContentType
    format: Optional[ContentFormat] = None
    status: ContentStatus
    intent_purpose: Optional[str] = None
    intent_audience: Optional[str] = None
    intent_key_message: Optional[str] = None
    rules_only_mode: bool
    current_version_id: Optional[str] = None
    file_path: Optional[str] = None
    created_at: str
    updated_at: str
    current_version: Optional[ContentVersionResponse] = None
