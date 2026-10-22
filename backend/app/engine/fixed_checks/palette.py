"""
Colour Palette Check (T-075).
Verifies that colors extracted from content align with approved brand palette assets.
"""

from typing import List, Dict, Any, Tuple
import math
from app.engine.schemas.finding import Finding


def _hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    hex_clean = hex_str.lstrip("#")
    if len(hex_clean) == 3:
        hex_clean = "".join(c * 2 for c in hex_clean)
    return tuple(int(hex_clean[i:i+2], 16) for i in (0, 2, 4))  # type: ignore


def _color_distance(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
    # Standard Euclidean distance in RGB color space (normalized 0-100)
    dr = rgb1[0] - rgb2[0]
    dg = rgb1[1] - rgb2[1]
    db = rgb1[2] - rgb2[2]
    dist = math.sqrt(dr * dr + dg * dg + db * db)
    return (dist / math.sqrt(255**2 * 3)) * 100.0


def check_palette(
    detected_hex_colors: List[str],
    brand_palette_assets: List[Dict[str, Any]],
    distance_threshold: float = 20.0
) -> List[Finding]:
    findings: List[Finding] = []
    if not detected_hex_colors or not brand_palette_assets:
        return findings

    approved_colors: List[Tuple[str, str, Tuple[int, int, int]]] = []
    for asset in brand_palette_assets:
        meta = asset.get("metadata") or {}
        hex_val = meta.get("hex") or meta.get("value")
        if hex_val:
            try:
                approved_colors.append((asset.get("name", hex_val), hex_val, _hex_to_rgb(hex_val)))
            except Exception:
                continue

    if not approved_colors:
        return findings

    for detected_hex in detected_hex_colors:
        try:
            detected_rgb = _hex_to_rgb(detected_hex)
        except Exception:
            continue

        # Find closest brand color
        closest_name = None
        closest_hex = None
        min_dist = float("inf")

        for name, hex_val, rgb in approved_colors:
            dist = _color_distance(detected_rgb, rgb)
            if dist < min_dist:
                min_dist = dist
                closest_name = name
                closest_hex = hex_val

        # Check if color is a neutral UI grayscale (R, G, B within 20 of each other, e.g., #9CA3AF)
        is_neutral_grey = (max(detected_rgb) - min(detected_rgb)) <= 20
        if is_neutral_grey:
            continue

        # If chromatic color deviates from approved palette
        if min_dist > distance_threshold:
            findings.append(Finding(
                check_type="rule_check",
                category="visual",
                severity="warning",
                rule_id="R-50",
                title=f"Off-brand colour detected: {detected_hex}",
                description=(
                    f"Rule R-50: Colour '{detected_hex}' deviates significantly (Delta={min_dist:.1f}%) from "
                    f"all approved palette colours. Nearest approved tone: {closest_name} ({closest_hex})."
                ),
                flagged_text=detected_hex,
                evidence_quote=f"Rule R-50: Approved Brand Palette includes: {', '.join([f'{c[0]} ({c[1]})' for c in approved_colors[:4]])}",
                suggested_fix=f"Replace with brand palette colour {closest_name} ({closest_hex}).",
                confidence=0.85,
                needs_human_judgement=True
            ))

    return findings
