"""
Terminology Check (T-071).
Scans content against the organisation's approved terms and flags non-preferred alternatives.
"""

from typing import List, Dict, Any
import re
from app.engine.schemas.finding import Finding


def check_terminology(
    text: str,
    terms: List[Dict[str, Any]]
) -> List[Finding]:
    findings: List[Finding] = []
    if not text or not terms:
        return findings

    for term in terms:
        preferred = term.get("preferred_term", "")
        banned_alternatives = term.get("banned_alternatives") or []
        case_sensitive = term.get("case_sensitive", False)
        term_id = term.get("id")

        for alt in banned_alternatives:
            if not alt or not alt.strip():
                continue
            alt_clean = alt.strip()
            flags = 0 if case_sensitive else re.IGNORECASE
            pattern = rf"\b{re.escape(alt_clean)}(?:s|es)?\b"

            for match in re.finditer(pattern, text, flags):
                start, end = match.span()
                # Check if match is part of a URL, domain, or email (e.g. apexcloud.io)
                if (end < len(text) and text[end] in [".", "/", "@"]) or (start > 0 and text[start - 1] in [".", "/", "@"]):
                    continue

                matched_text = match.group(0)
                findings.append(Finding(
                    check_type="rule_check",
                    category="terminology",
                    severity="warning",
                    title="Non-preferred term used",
                    description=f"'{matched_text}' should be replaced with the approved brand term '{preferred}'.",
                    flagged_text=matched_text,
                    evidence_quote=f"Approved term: '{preferred}'. Non-preferred variants: {', '.join(banned_alternatives)}.",
                    suggested_fix=preferred,
                    confidence=1.0,
                    needs_human_judgement=False
                ))

    return findings
