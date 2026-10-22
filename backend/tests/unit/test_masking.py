"""
Unit tests for MaskingService (T-141).
Tests PII redaction (email, phone, confidential tags) and unmasking fidelity.
"""

import pytest
from app.ai.masking import MaskingService


def test_mask_emails_and_phones():
    text = "Please reach out to support@apexcloud.io or call +1-800-555-0199 for escalation."
    masked, mapping = MaskingService.mask(text)

    assert "support@apexcloud.io" not in masked
    assert "+1-800-555-0199" not in masked
    assert "[EMAIL_1]" in masked
    assert "[PHONE_1]" in masked
    assert mapping["[EMAIL_1]"] == "support@apexcloud.io"
    assert mapping["[PHONE_1]"] == "+1-800-555-0199"

    # Verify unmasking returns exact original string
    restored = MaskingService.unmask(masked, mapping)
    assert restored == text


def test_mask_confidential_tags():
    text = "We are releasing [confidential: Project Odyssey Quantum Cluster] in Q4."
    masked, mapping = MaskingService.mask(text)

    assert "Project Odyssey Quantum Cluster" not in masked
    assert "[CONFIDENTIAL_1]" in masked
    assert mapping["[CONFIDENTIAL_1]"] == "Project Odyssey Quantum Cluster"

    restored = MaskingService.unmask(masked, mapping)
    assert "Project Odyssey Quantum Cluster" in restored


def test_multiple_occurrences_masking():
    text = "Contact alice@test.com or bob@test.com on 9876543210."
    masked, mapping = MaskingService.mask(text)

    assert "[EMAIL_1]" in masked
    assert "[EMAIL_2]" in masked
    assert "[PHONE_1]" in masked
    assert len(mapping) == 3

    restored = MaskingService.unmask(masked, mapping)
    assert restored == text
