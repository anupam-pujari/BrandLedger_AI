"""
Alt-Text Check (T-077).
Detects missing, empty, or redundant alt text attributes in markdown or HTML markup.
"""

from typing import List, Dict, Any
import re
from app.engine.schemas.finding import Finding


def check_alt_text(
    text: str,
    images: List[Dict[str, Any]] = None
) -> List[Finding]:
    findings: List[Finding] = []

    # 1. Check markdown image syntax: ![alt text](url)
    if text:
        md_img_regex = re.compile(r"!\[([^\]]*)\]\(([^\)]+)\)")
        for match in md_img_regex.finditer(text):
            alt_text = match.group(1).strip()
            img_url = match.group(2)

            if not alt_text:
                findings.append(Finding(
                    check_type="rule_check",
                    category="accessibility",
                    severity="critical",
                    title="Missing alt text for image",
                    description=f"Image '{img_url}' has empty or missing alt text.",
                    flagged_text=match.group(0),
                    evidence_quote="WCAG 1.1.1 Non-text Content: All non-text content that is presented to the user has a text alternative.",
                    suggested_fix="Add descriptive alternative text explaining the image purpose.",
                    confidence=1.0,
                    needs_human_judgement=False
                ))
            elif alt_text.lower() in ["image", "picture", "photo", "logo", "img"]:
                findings.append(Finding(
                    check_type="rule_check",
                    category="accessibility",
                    severity="warning",
                    title=f"Low-quality alt text: '{alt_text}'",
                    description="Alt text should describe the specific content and context of the image, rather than stating it is an image.",
                    flagged_text=match.group(0),
                    evidence_quote="WCAG 1.1.1: Alt text must convey the essential meaning of the visual element.",
                    suggested_fix="Describe the specific action, graphic, or information portrayed in the image.",
                    confidence=0.9,
                    needs_human_judgement=False
                ))

    # 2. Check extracted image structures
    if images:
        for idx, img in enumerate(images):
            if not img.get("alt_text"):
                findings.append(Finding(
                    check_type="rule_check",
                    category="accessibility",
                    severity="critical",
                    title=f"Image asset {idx + 1} lacks alternative text",
                    description=f"Document image '{img.get('filename', f'image_{idx+1}')}' has no alt text specified.",
                    flagged_text=img.get("filename"),
                    evidence_quote="WCAG 1.1.1: Every published image must provide meaningful alternative text.",
                    suggested_fix="Provide descriptive alt text for this visual asset.",
                    confidence=1.0,
                    needs_human_judgement=False
                ))

    return findings
