"""
Required-Text Check (T-073).
Ensures mandatory statements, disclosures, and legal notices are included.
"""

from typing import List, Dict, Any
from app.engine.schemas.finding import Finding


def check_required_text(
    text: str,
    rules: List[Dict[str, Any]],
    content_type: str = "text"
) -> List[Finding]:
    findings: List[Finding] = []
    if not text or not rules:
        return findings

    for rule in rules:
        good_example = rule.get("good_example")
        title_lower = rule.get("title", "").lower()
        desc_lower = rule.get("description", "").lower()

        # If rule specifically targets promotional emails, only check when content_type is email
        if "email" in desc_lower and content_type != "email":
            continue

        is_requirement = (
            rule.get("category") == "messaging" and
            ("must include" in desc_lower or "disclaimer" in title_lower or "mandatory" in desc_lower) and
            good_example
        )

        if is_requirement:
            if "unsubscribe" in desc_lower or "unsubscribing" in desc_lower or "opt-out" in desc_lower:
                has_disclaimer = ("unsubscribe" in text.lower() or "opt-out" in text.lower())
            else:
                has_disclaimer = good_example.strip().lower() in text.lower()

            if not has_disclaimer:
                findings.append(Finding(
                    check_type="rule_check",
                    category="messaging",
                    severity=rule.get("severity", "critical"),
                    rule_id=rule.get("id"),
                    title="Required disclaimer or mandatory statement missing",
                    description=rule.get("description", "Content must include required brand disclaimer."),
                    flagged_text=None,
                    evidence_quote=f"Rule {rule.get('rule_code', 'R-REQ')}: {rule.get('description', '')}",
                    suggested_fix=rule.get("good_example"),
                    confidence=1.0,
                    needs_human_judgement=False
                ))

    return findings
