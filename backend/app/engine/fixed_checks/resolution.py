"""
Image Resolution Check (T-078).
Verifies that uploaded images meet minimum resolution specifications.
"""

from typing import List, Dict, Any
from app.engine.schemas.finding import Finding


def check_image_resolution(
    images: List[Dict[str, Any]],
    min_web_width: int = 300,
    min_web_height: int = 300,
    target_channel: str = "web"
) -> List[Finding]:
    findings: List[Finding] = []
    if not images:
        return findings

    min_w = 1200 if target_channel == "social" else min_web_width
    min_h = 630 if target_channel == "social" else min_web_height

    for img in images:
        w = img.get("width", 0)
        h = img.get("height", 0)
        filename = img.get("filename", "image")

        if w > 0 and h > 0 and (w < min_w or h < min_h):
            findings.append(Finding(
                check_type="rule_check",
                category="visual",
                severity="warning",
                title=f"Low image resolution ({w}x{h} px)",
                description=(
                    f"Image '{filename}' has dimensions {w}x{h} px, which is below the recommended minimum "
                    f"of {min_w}x{min_h} px for {target_channel} publishing."
                ),
                flagged_text=f"{w}x{h}",
                evidence_quote=f"Brand Visual Guidelines: Images must be at least {min_w}x{min_h} px.",
                suggested_fix=f"Provide a higher resolution version of the asset (minimum {min_w}x{min_h} px).",
                confidence=1.0,
                needs_human_judgement=False
            ))

    return findings
