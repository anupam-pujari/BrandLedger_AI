"""
Banned-Word Check (T-072).
Identifies explicitly prohibited terms, hype words, and expressions across text content.
"""

from typing import List, Dict, Any
import re
from app.engine.schemas.finding import Finding


def check_banned_words(
    text: str,
    rules: List[Dict[str, Any]]
) -> List[Finding]:
    findings: List[Finding] = []
    if not text or not rules:
        return findings

    seen_matches = set()

    for rule in rules:
        banned_phrases = []
        desc = rule.get("description", "")
        bad_example = rule.get("bad_example", "")

        # 1. Quoted terms in description (e.g. 'revolutionary', 'game-changing', 'mind-blowing')
        quoted = re.findall(r"'([^']+)'", desc)
        for q in quoted:
            q_clean = q.strip()
            if len(q_clean) > 2 and q_clean.lower() not in ["apexcloud", "customers", "teams", "customer", "team", "more", "link"]:
                banned_phrases.append(q_clean)

        # 2. Terms in bad_example
        if bad_example:
            for p in bad_example.split(","):
                clean = p.strip().strip("'\"")
                if clean and len(clean.split()) <= 4 and clean.lower() not in ["more", "link"]:
                    banned_phrases.append(clean)
                elif clean and clean.lower() in text.lower():
                    banned_phrases.append(clean)

        for phrase in banned_phrases:
            pattern = rf"\b{re.escape(phrase)}(?:s|es)?\b"
            for match in re.finditer(pattern, text, re.IGNORECASE):
                start, end = match.span()
                if (end < len(text) and text[end] in [".", "/", "@"]) or (start > 0 and text[start - 1] in [".", "/", "@"]):
                    continue
                matched_text = match.group(0)
                match_key = (matched_text.lower(), rule.get("rule_code", ""))
                if match_key in seen_matches:
                    continue
                seen_matches.add(match_key)

                findings.append(Finding(
                    check_type="rule_check",
                    category=rule.get("category", "terminology"),
                    severity=rule.get("severity", "critical"),
                    rule_id=rule.get("id") or rule.get("rule_code"),
                    title=f"Banned word or phrase detected: '{matched_text}'",
                    description=f"Rule {rule.get('rule_code', '')}: {rule.get('description', '')}",
                    flagged_text=matched_text,
                    evidence_quote=f"Rule {rule.get('rule_code', '')}: Prohibited '{phrase}'. Good example: '{rule.get('good_example', '')}'",
                    suggested_fix=rule.get("good_example"),
                    confidence=1.0,
                    needs_human_judgement=False
                ))

    return findings
