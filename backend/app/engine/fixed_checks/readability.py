"""
Readability Check (T-074).
Computes readability metrics (Flesch-Kincaid grade level, Flesch reading ease)
and flags text that exceeds target complexity.
"""

from typing import List
from app.engine.schemas.finding import Finding

try:
    import textstat
except ImportError:
    textstat = None


def check_readability(
    text: str,
    target_grade: int = 10,
    max_grade_tolerance: int = 4
) -> List[Finding]:
    findings: List[Finding] = []
    if not text or len(text.split()) < 10:
        # Minimum words needed to reliably calculate readability
        return findings

    if textstat is not None:
        try:
            grade = textstat.flesch_kincaid_grade(text)
            reading_ease = textstat.flesch_reading_ease(text)

            if grade > (target_grade + max_grade_tolerance):
                findings.append(Finding(
                    check_type="rule_check",
                    category="accessibility",
                    severity="info",
                    rule_id="R-63",
                    title="Readability exceeds target complexity",
                    description=(
                        f"Rule R-63: Text readability grade is {grade:.1f} (target is grade {target_grade} or lower). "
                        f"Reading ease score: {reading_ease:.1f}/100. "
                        "Consider breaking down long sentences and replacing complex terminology."
                    ),
                    flagged_text=None,
                    evidence_quote=f"Rule R-63: Target Grade {target_grade} (Current: Grade {grade:.1f})",
                    suggested_fix="Simplify sentence structure and reduce multi-syllable jargon.",
                    confidence=0.9,
                    needs_human_judgement=True
                ))
        except Exception:
            pass

    return findings
