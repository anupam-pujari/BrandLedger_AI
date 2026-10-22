"""
Masking Service (T-080).
Protects confidential text, email addresses, and phone numbers before dispatching to external LLMs.
Maintains bidirectional mapping to reconstruct original text in findings and disclosures.
"""

from typing import Tuple, Dict, List
import re


class MaskingService:
    EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
    # General international and local telephone patterns
    PHONE_REGEX = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b")
    CONFIDENTIAL_TAG_REGEX = re.compile(r"\[confidential:\s*([^\]]+)\]", re.IGNORECASE)

    @classmethod
    def mask(
        cls,
        text: str,
        mask_emails: bool = True,
        mask_phones: bool = True,
        mask_confidential: bool = True
    ) -> Tuple[str, Dict[str, str]]:
        """
        Masks sensitive PII and confidential spans in text.
        Returns:
            (masked_text, mapping_dict) where mapping_dict maps placeholder -> original_text
        """
        mapping: Dict[str, str] = {}
        masked_text = text

        # 1. Mask Confidential Tags: [confidential: Secret Project X] -> [CONFIDENTIAL_1]
        if mask_confidential:
            conf_counter = 1
            for match in cls.CONFIDENTIAL_TAG_REGEX.finditer(text):
                original = match.group(0)
                secret_content = match.group(1).strip()
                placeholder = f"[CONFIDENTIAL_{conf_counter}]"
                mapping[placeholder] = secret_content
                masked_text = masked_text.replace(original, placeholder, 1)
                conf_counter += 1

        # 2. Mask Emails
        if mask_emails:
            email_counter = 1
            for match in cls.EMAIL_REGEX.finditer(masked_text):
                original = match.group(0)
                placeholder = f"[EMAIL_{email_counter}]"
                mapping[placeholder] = original
                masked_text = masked_text.replace(original, placeholder, 1)
                email_counter += 1

        # 3. Mask Phones
        if mask_phones:
            phone_counter = 1
            for match in cls.PHONE_REGEX.finditer(masked_text):
                original = match.group(0).strip()
                # Basic sanity length check to avoid single 3-digit numbers
                if len(re.sub(r"\D", "", original)) >= 7:
                    placeholder = f"[PHONE_{phone_counter}]"
                    mapping[placeholder] = original
                    masked_text = masked_text.replace(original, placeholder, 1)
                    phone_counter += 1

        return masked_text, mapping

    @classmethod
    def unmask(cls, text: str, mapping: Dict[str, str]) -> str:
        """Restores original text values from placeholder mappings."""
        if not text or not mapping:
            return text
        unmasked = text
        for placeholder, original in mapping.items():
            unmasked = unmasked.replace(placeholder, original)
        return unmasked
