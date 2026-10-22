"""
Document Parsing Models (C-07, T-110).
Unified representation of parsed document content across PDF, DOCX, PPTX, and Image formats.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class TextBlock(BaseModel):
    text: str
    page_number: int = 1
    block_type: str = "paragraph"  # heading, paragraph, list_item, table_cell
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ExtractedImage(BaseModel):
    filename: str
    page_number: int = 1
    width: int = 0
    height: int = 0
    format: str = "png"
    ocr_text: Optional[str] = None
    alt_text: Optional[str] = None


class ExtractedContent(BaseModel):
    full_text: str
    text_blocks: List[TextBlock] = Field(default_factory=list)
    images: List[ExtractedImage] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
