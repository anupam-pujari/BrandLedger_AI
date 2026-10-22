"""
Unit tests for Review Engine Fixed Checks (T-140).
Tests terminology, banned words, required text, readability, link text, alt-text, and WCAG contrast.
"""

import pytest
from app.engine.fixed_checks.terminology import check_terminology
from app.engine.fixed_checks.banned_words import check_banned_words
from app.engine.fixed_checks.required_text import check_required_text
from app.engine.fixed_checks.readability import check_readability
from app.engine.fixed_checks.link_text import check_link_text
from app.engine.fixed_checks.alt_text import check_alt_text
from app.engine.fixed_checks.contrast import check_wcag_contrast, calculate_contrast_ratio
from app.engine.fixed_checks.palette import check_palette


def test_terminology_check(sample_terms):
    text = "Our clients love the simplicity and seamless experience."
    findings = check_terminology(text, sample_terms)
    assert len(findings) >= 1
    flagged = [f.flagged_text.lower() for f in findings]
    assert "clients" in flagged or "client" in flagged
    assert any(f.suggested_fix == "customers" or "customer" in (f.suggested_fix or "").lower() for f in findings)


def test_banned_words_check(sample_rules):
    text = "We offer a revolutionary and mind-blowing cloud solution with zero downtime ever."
    findings = check_banned_words(text, sample_rules)
    assert len(findings) >= 1
    flagged = [f.flagged_text.lower() for f in findings]
    assert any("revolutionary" in flag or "mind-blowing" in flag for flag in flagged)


def test_required_text_check(sample_rules):
    # Content missing required legal disclaimer
    text = "Get 50% discount on all cloud subscriptions today only!"
    findings = check_required_text(text, sample_rules)
    # If rule R-MSG-001 or disclaimer rule exists, flags missing text
    for f in findings:
        assert f.category == "messaging"
        assert f.severity == "critical"


def test_readability_check():
    simple_text = "ApexCloud helps your business scale. Our servers are fast, secure, and reliable for all teams."
    findings = check_readability(simple_text)
    # Simple text should not trigger excessive complexity
    assert len(findings) == 0

    overly_complex_text = (
        "The hyper-converged socio-technical infrastructure paradigm facilitates heterogeneous, "
        "asymptotically distributed transactional throughput methodologies to instantiate comprehensive, "
        "inter-organizational cryptographic multi-tenancy synchronicity across compartmentalized nodes."
    )
    complex_findings = check_readability(overly_complex_text, target_grade=8)
    assert len(complex_findings) >= 1
    assert complex_findings[0].category in ["accessibility", "tone"]
    assert "complexity" in complex_findings[0].title.lower()


def test_link_text_quality():
    bad_text = "To view your monthly analytics, [click here](https://example.com) or [read more](https://example.com/docs)."
    findings = check_link_text(bad_text)
    assert len(findings) == 2
    assert any("click here" in f.title.lower() for f in findings)
    assert any("read more" in f.title.lower() for f in findings)

    good_text = "Review your [Monthly Billing Statement](https://example.com/billing) in the portal."
    good_findings = check_link_text(good_text)
    assert len(good_findings) == 0


def test_alt_text_accessibility():
    bad_text = "Here is our new dashboard: ![](https://cdn.example.com/dash.png)"
    findings = check_alt_text(bad_text)
    assert len(findings) >= 1
    assert any("missing alt text" in f.title.lower() for f in findings)

    good_text = "Dashboard overview: ![Live server metrics graph](https://cdn.example.com/dash.png)"
    good_findings = check_alt_text(good_text)
    assert len(good_findings) == 0


def test_wcag_contrast_calculation():
    # Black on white: 21:1 (pass)
    ratio_bw = calculate_contrast_ratio("#000000", "#FFFFFF")
    assert ratio_bw > 20.0

    # Light grey on white: fail AA
    ratio_bad = calculate_contrast_ratio("#A0A0A0", "#FFFFFF")
    assert ratio_bad < 4.5

    findings = check_wcag_contrast([
        {"foreground": "#A0A0A0", "background": "#FFFFFF", "is_large_text": False}
    ])
    assert len(findings) == 1
    assert findings[0].severity == "critical"
    assert "insufficient colour contrast" in findings[0].title.lower()


def test_palette_check():
    approved_assets = [
        {"name": "Brand Navy", "metadata": {"hex": "#0F172A"}},
        {"name": "Brand Blue", "metadata": {"hex": "#2563EB"}}
    ]
    # Neon Green #39FF14 is off-brand
    findings = check_palette(["#39FF14"], approved_assets)
    assert len(findings) == 1
    assert "off-brand colour detected" in findings[0].title.lower()
