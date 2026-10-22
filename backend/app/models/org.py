"""
Organisation & Settings Pydantic Models.
"""

from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class MaskingConfig(BaseModel):
    mask_emails: bool = True
    mask_phones: bool = True
    mask_confidential: bool = True


class OrgSettingsUpdate(BaseModel):
    rules_only_mode: Optional[bool] = None
    ai_provider: Optional[Literal["openai", "gemini", "local"]] = None
    masking_config: Optional[MaskingConfig] = None
