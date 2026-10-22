"""
Link Text Quality Check (T-079).
Flags generic, inaccessible link labels like 'click here', 'read more', 'learn more'.
"""

from typing import List
import re
from app.engine.schemas.finding import Finding

VAGUE_LINK_PATTERNS = [
    r"\bclick here\b",
    r"\bread more\b",
    r"\blearn more\b",
    r"\bcheck this link\b",
    r"\bfind out more\b",
    r"\bhere\b"
]


def check_link_text(text: str) -> List[Finding]:
    findings: List[Finding] = []
    if not text:
        return findings

    # Check for markdown links [label](url)
    md_link_regex = re.compile(r"\[([^\]]+)\]\([^\)]+\)", re.IGNORECASE)
    matched_spans = set()
    for match in md_link_regex.finditer(text):
        label = match.group(1).strip().lower()
        if any(re.search(pat, label) for pat in VAGUE_LINK_PATTERNS):
            matched_spans.add(match.span())
            findings.append(Finding(
                check_type="rule_check",
                category="accessibility",
                severity="warning",
                rule_id="R-62",
                title=f"Non-descriptive link text: '{match.group(1)}'",
                description="Rule R-62: Link text must be descriptive of the target destination to satisfy WCAG accessibility standards.",
                flagged_text=match.group(0),
                evidence_quote="Rule R-62 / WCAG 2.4.4: Link Purpose (In Context). Avoid generic labels like 'click here' or 'learn more'.",
                suggested_fix="Replace with descriptive text that names the specific resource or destination.",
                confidence=1.0,
                needs_human_judgement=False
            ))

    # Also check standalone plain text phrases like 'click here'
    for pat in [r"\bclick here\b", r"\bread more\b", r"\blearn more\b"]:
        for match in re.finditer(pat, text, re.IGNORECASE):
            if any(s <= match.start() and match.end() <= e for s, e in matched_spans):
                continue
            findings.append(Finding(
                check_type="rule_check",
                category="accessibility",
                severity="warning",
                rule_id="R-62",
                title=f"Non-descriptive link text: '{match.group(0)}'",
                description="Rule R-62: Hyperlinks and callouts must describe the specific destination rather than vague phrases like 'click here'.",
                flagged_text=match.group(0),
                evidence_quote="Rule R-62 / WCAG 2.4.4: Hyperlinks must describe the specific destination or resource.",
                suggested_fix="Download the 2026 Benchmark Report",
                confidence=1.0,
                needs_human_judgement=False
            ))

    return findings
