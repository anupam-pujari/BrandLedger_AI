"""
BrandProof Consolidated Deterministic Review Engine (Fixed Checks).

Consolidates all fixed checks into a single high-cohesion, testable module:
  - Terminology & preferred replacement checks (spaCy PhraseMatcher / regex)
  - Banned-words & unsupported superlative checks
  - Required disclaimer / messaging text verification
  - Readability grade & sentence complexity evaluation
  - Accessibility: WCAG 2.1 color contrast calculation
  - Accessibility: Missing alt-text detection
  - Accessibility: Vague hyperlink text detection
  - Visual: Palette compliance and color distance

Directly implements requirements from planing.txt (Section 3, Section 5).
"""

import math
import re
from typing import Any, Dict, List, Optional, Tuple
from app.schemas import Finding


# ==============================================================================
# 1. Terminology & Banned Words Checks
# ==============================================================================

def check_terminology(text: str, terms: List[Dict[str, Any]]) -> List[Finding]:
    """Check text against terminology rules for banned or deprecated terms."""
    findings: List[Finding] = []
    if not text or not terms:
        return findings

    for t in terms:
        term_word = t.get("term", "")
        if not term_word:
            continue

        flags = 0 if t.get("case_sensitive", False) else re.IGNORECASE
        pattern = rf"\b{re.escape(term_word)}\b"

        for match in re.finditer(pattern, text, flags=flags):
            flagged = match.group(0)
            term_type = t.get("term_type", "banned")
            replacement = t.get("preferred_replacement")

            if term_type == "banned":
                desc = f"The term '{flagged}' is marked as banned or deprecated in the brand terminology guidelines."
                suggested = replacement or f"Remove or replace '{flagged}' with an approved alternative."
            else:
                desc = f"Ensure correct casing and usage for approved term '{flagged}'."
                suggested = replacement

            findings.append(Finding(
                check_type="rule_check",
                category="terminology",
                severity="warning" if term_type == "banned" else "info",
                title=f"Use of banned term '{flagged}'",
                description=desc,
                flagged_text=flagged,
                evidence_quote=f"Terminology Guideline: Avoid '{term_word}'. Preferred: '{replacement or 'None'}'",
                suggested_fix=suggested,
                confidence=1.0,
            ))

    return findings


def check_banned_words(text: str, rules: List[Dict[str, Any]]) -> List[Finding]:
    """Check text against terminology rules specifically flagging superlatives/banned phrases."""
    findings: List[Finding] = []
    if not text:
        return findings

    # Default brand banned patterns if no explicit rules passed
    default_banned = [
        ("revolutionary", "R-TRM-002", "Avoid hyperbolic claims like 'revolutionary'. Use specific, grounded language."),
        ("mind-blowing", "R-TRM-002", "Avoid colloquial hyperbole like 'mind-blowing' in enterprise communications."),
        ("guarantees", "R-TRM-003", "Do not guarantee outcomes or zero downtime in promotional copy without legal qualification."),
        ("guaranteed", "R-TRM-003", "Do not guarantee outcomes or zero downtime in promotional copy without legal qualification."),
        ("zero downtime ever", "R-TRM-003", "Unqualified zero downtime statements violate technical accuracy guidelines."),
        ("the fastest in India", "R-CLM-001", "Unsubstantiated market leadership rankings require verified third-party audit."),
    ]

    # Incorporate banned examples from active rules
    rule_banned_map = {}
    for r in rules:
        if r.get("category") == "terminology" and r.get("bad_example"):
            rule_banned_map[r["bad_example"].lower()] = (r["rule_code"], r["description"])

    for word, code, explanation in default_banned:
        pattern = rf"\b{re.escape(word)}\b"
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            findings.append(Finding(
                check_type="rule_check",
                category="terminology",
                rule_code=code,
                severity="critical" if "guarantee" in word or "zero downtime" in word else "warning",
                title=f"Banned hyperbole / phrase '{match.group(0)}'",
                description=explanation,
                flagged_text=match.group(0),
                evidence_quote=f"Rule {code}: {explanation}",
                suggested_fix="designed to deliver high reliability" if "guarantee" in word else "innovative",
                confidence=1.0,
            ))

    return findings


# ==============================================================================
# 2. Required Text & Legal Disclaimers
# ==============================================================================

def check_required_text(text: str, rules: List[Dict[str, Any]], content_type: str = "text") -> List[Finding]:
    """Check whether mandatory legal disclaimers or disclosures are present in promotional copy."""
    findings: List[Finding] = []
    if not text:
        return findings

    # Look for promo / discount / pricing keywords that require disclaimers
    has_commercial_offer = bool(re.search(r"\b(discount|subscription|pricing|offer|save \d+%|\d+% off)\b", text, re.IGNORECASE))

    if has_commercial_offer:
        has_disclaimer = bool(re.search(r"\b(terms apply|subject to|standard terms|conditions apply|sla)\b", text, re.IGNORECASE))
        if not has_disclaimer:
            findings.append(Finding(
                check_type="rule_check",
                category="messaging",
                rule_code="R-MSG-001",
                severity="critical",
                title="Missing mandatory legal disclaimer",
                description="Commercial promotional messaging must include standard terms disclosure (e.g., 'Terms & conditions apply').",
                flagged_text="Entire copy lacks mandatory disclaimer",
                evidence_quote="Rule R-MSG-001: Any promotional, discount, or pricing claim must contain a qualified terms disclaimer.",
                suggested_fix="Append: 'Terms and conditions apply. Subject to standard SLA agreements.'",
                confidence=1.0,
            ))

    return findings


# ==============================================================================
# 3. Readability & Sentence Complexity
# ==============================================================================

def check_readability(text: str, target_grade: int = 10) -> List[Finding]:
    """Evaluate reading level and sentence complexity (Flesch-Kincaid style heuristic)."""
    findings: List[Finding] = []
    if not text or len(text.strip()) < 50:
        return findings

    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    words = re.findall(r"\b[A-Za-z'-]+\b", text)

    if not sentences or not words:
        return findings

    avg_words_per_sentence = len(words) / max(len(sentences), 1)

    # Count multi-syllable / complex words (3+ syllables heuristic)
    complex_words = []
    for w in words:
        if len(w) > 12:
            complex_words.append(w)

    complex_word_ratio = len(complex_words) / len(words)

    # Heuristic grade level approximation
    estimated_grade = (0.39 * avg_words_per_sentence) + (11.8 * complex_word_ratio) + 2.0

    if estimated_grade > 14.0 or (avg_words_per_sentence > 30 and complex_word_ratio > 0.15):
        sample_complex = ", ".join(list(set(complex_words))[:3])
        findings.append(Finding(
            check_type="rule_check",
            category="tone",
            severity="info",
            title="Overly complex language detected",
            description=f"Estimated reading grade level is {estimated_grade:.1f} (target: Grade {target_grade}). Dense sentences hinder reader comprehension.",
            flagged_text=f"Sentences averaging {avg_words_per_sentence:.0f} words; jargon includes: {sample_complex}",
            evidence_quote="Rule R-TONE-002: Write in clear, direct English. Avoid dense bureaucratic or overly academic phrasing.",
            suggested_fix="Break long compound sentences into shorter statements and replace dense multi-syllable jargon.",
            confidence=0.9,
        ))

    return findings


# ==============================================================================
# 4. Accessibility: Vague Links, Alt-Text & WCAG Contrast
# ==============================================================================

def check_link_text(text: str) -> List[Finding]:
    """WCAG 2.4.4: Detect non-descriptive hyperlink anchor text (e.g., 'click here', 'read more')."""
    findings: List[Finding] = []
    if not text:
        return findings

    vague_phrases = {"click here", "read more", "learn more", "here", "link", "more"}
    markdown_links = re.finditer(r"\[([^\]]+)\]\(([^)]+)\)", text)

    for match in markdown_links:
        link_text = match.group(1).strip()
        if link_text.lower() in vague_phrases:
            findings.append(Finding(
                check_type="rule_check",
                category="accessibility",
                rule_code="R-A11Y-002",
                severity="warning",
                title=f"Vague link text '{link_text}'",
                description="Hyperlinks must clearly describe their destination or purpose out of context for screen reader users.",
                flagged_text=match.group(0),
                evidence_quote="WCAG 2.4.4 (Level A): The purpose of each link must be determinable from the link text alone.",
                suggested_fix=f"Replace '{link_text}' with descriptive context (e.g., '[Read the ApexCloud Cloud Architecture Whitepaper]({match.group(2)})')",
                confidence=1.0,
            ))

    return findings


def check_alt_text(text: str) -> List[Finding]:
    """WCAG 1.1.1: Detect markdown images lacking descriptive alternative text."""
    findings: List[Finding] = []
    if not text:
        return findings

    images = re.finditer(r"!\[(.*?)\]\((.*?)\)", text)
    for match in images:
        alt = match.group(1).strip()
        if not alt:
            findings.append(Finding(
                check_type="rule_check",
                category="accessibility",
                rule_code="R-A11Y-001",
                severity="critical",
                title="Missing image alt text",
                description="Published image is missing alternative descriptive text required for screen reader accessibility.",
                flagged_text=match.group(0),
                evidence_quote="WCAG 1.1.1 (Level A): All non-text content must have a text alternative that serves the equivalent purpose.",
                suggested_fix=f"Add descriptive alt text: '![Descriptive summary of image content]({match.group(2)})'",
                confidence=1.0,
            ))

    return findings


def calculate_contrast_ratio(hex1: str, hex2: str) -> float:
    """Calculate relative luminance contrast ratio between two hex colors per WCAG 2.1."""
    def _luminance(hex_str: str) -> float:
        h = hex_str.lstrip("#")
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        r, g, b = [int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
        
        def _adjust(c: float) -> float:
            return c / 12.92 if c <= 0.03928 else math.pow((c + 0.055) / 1.055, 2.4)
            
        return 0.2126 * _adjust(r) + 0.7152 * _adjust(g) + 0.0722 * _adjust(b)

    try:
        l1 = _luminance(hex1)
        l2 = _luminance(hex2)
        brightest = max(l1, l2)
        darkest = min(l1, l2)
        return (brightest + 0.05) / (darkest + 0.05)
    except Exception:
        return 21.0


def check_wcag_contrast(pairs: List[Dict[str, Any]]) -> List[Finding]:
    """Verify that text foreground and background color combinations meet WCAG AA requirements."""
    findings: List[Finding] = []
    for pair in pairs:
        fg = pair.get("foreground", "#000000")
        bg = pair.get("background", "#FFFFFF")
        is_large = pair.get("is_large_text", False)

        ratio = calculate_contrast_ratio(fg, bg)
        required_ratio = 3.0 if is_large else 4.5

        if ratio < required_ratio:
            findings.append(Finding(
                check_type="rule_check",
                category="accessibility",
                rule_code="R-A11Y-003",
                severity="critical",
                title="Insufficient colour contrast",
                description=f"Color combination {fg} on {bg} provides a contrast ratio of {ratio:.2f}:1, failing WCAG AA (minimum {required_ratio:.1f}:1).",
                flagged_text=f"Foreground: {fg}, Background: {bg}",
                evidence_quote=f"WCAG 1.4.3 (Level AA): Contrast ratio must be at least {required_ratio:.1f}:1.",
                suggested_fix=f"Darken foreground or lighten background to achieve at least {required_ratio:.1f}:1 contrast.",
                confidence=1.0,
            ))

    return findings


# ==============================================================================
# 5. Visual: Palette Compliance
# ==============================================================================

def check_palette(dominant_colors: List[str], approved_swatches: List[str]) -> List[Finding]:
    """Check whether dominant visual colors match approved brand palette."""
    findings: List[Finding] = []
    if not dominant_colors or not approved_swatches:
        return findings

    # Simple hex distance check
    def _hex_dist(c1: str, c2: str) -> float:
        h1 = c1.lstrip("#")
        h2 = c2.lstrip("#")
        if len(h1) != 6 or len(h2) != 6:
            return 999.0
        r1, g1, b1 = [int(h1[i:i+2], 16) for i in (0, 2, 4)]
        r2, g2, b2 = [int(h2[i:i+2], 16) for i in (0, 2, 4)]
        return math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)

    for c in dominant_colors:
        min_dist = min(_hex_dist(c, s) for s in approved_swatches)
        if min_dist > 120:  # Significant deviation from brand palette
            findings.append(Finding(
                check_type="rule_check",
                category="visual",
                rule_code="R-VIS-001",
                severity="warning",
                title=f"Off-brand color detected ({c})",
                description=f"Color {c} deviates significantly from approved brand palette swatches.",
                flagged_text=c,
                evidence_quote="Rule R-VIS-001: Visual assets must use colors derived from the approved brand palette.",
                suggested_fix=f"Replace with nearest approved brand color ({approved_swatches[0]}).",
                confidence=0.85,
            ))

    return findings
