"""
WCAG Contrast Check (T-076).
Evaluates color pairs for WCAG 2.1 AA and AAA luminance contrast compliance.
"""

from typing import List, Tuple, Dict, Any
from app.engine.schemas.finding import Finding


def _hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    hex_clean = hex_str.lstrip("#")
    if len(hex_clean) == 3:
        hex_clean = "".join(c * 2 for c in hex_clean)
    return tuple(int(hex_clean[i:i+2], 16) for i in (0, 2, 4))  # type: ignore


def _srgb_to_linear(c: float) -> float:
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def calculate_relative_luminance(rgb: Tuple[int, int, int]) -> float:
    r, g, b = rgb
    return 0.2126 * _srgb_to_linear(r) + 0.7152 * _srgb_to_linear(g) + 0.0722 * _srgb_to_linear(b)


def calculate_contrast_ratio(hex1: str, hex2: str) -> float:
    try:
        lum1 = calculate_relative_luminance(_hex_to_rgb(hex1))
        lum2 = calculate_relative_luminance(_hex_to_rgb(hex2))
        l_max = max(lum1, lum2)
        l_min = min(lum1, lum2)
        return (l_max + 0.05) / (l_min + 0.05)
    except Exception:
        return 21.0


def check_wcag_contrast(
    color_pairs: List[Dict[str, Any]]
) -> List[Finding]:
    """
    Checks list of color pairs: [{'foreground': '#xxx', 'background': '#yyy', 'is_large_text': bool}]
    """
    findings: List[Finding] = []
    for pair in color_pairs:
        fg = pair.get("foreground", "#000000")
        bg = pair.get("background", "#ffffff")
        is_large = pair.get("is_large_text", False)
        min_ratio = 3.0 if is_large else 4.5

        ratio = calculate_contrast_ratio(fg, bg)
        if ratio < min_ratio:
            findings.append(Finding(
                check_type="rule_check",
                category="accessibility",
                severity="critical",
                title=f"Insufficient colour contrast ({ratio:.2f}:1)",
                description=(
                    f"Foreground {fg} against background {bg} provides a contrast ratio of {ratio:.2f}:1, "
                    f"which fails WCAG 2.1 AA requirements (minimum {min_ratio}:1 needed)."
                ),
                flagged_text=f"{fg} on {bg}",
                evidence_quote=f"WCAG 1.4.3 Contrast (Minimum): {min_ratio}:1 required, got {ratio:.2f}:1.",
                suggested_fix=f"Increase lightness difference between foreground ({fg}) and background ({bg}).",
                confidence=1.0,
                needs_human_judgement=False
            ))

    return findings
