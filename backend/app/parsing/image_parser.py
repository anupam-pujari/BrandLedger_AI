"""
Image Parser (T-113).
Extracts image dimensions, format, dominant colors, and metadata via Pillow.
"""

import io
from typing import List, Tuple
from PIL import Image
from app.parsing.models import ExtractedContent, ExtractedImage, TextBlock


class ImageParser:
    @classmethod
    def parse(cls, file_bytes: bytes, filename: str = "image.png") -> ExtractedContent:
        img = Image.open(io.BytesIO(file_bytes))
        w, h = img.size
        img_format = (img.format or "PNG").lower()

        # Extract dominant colors (simple histogram / palette sampling)
        dominant_hexes: List[str] = []
        try:
            rgb_img = img.convert("RGB")
            # Resize for quick palette estimation
            small = rgb_img.resize((50, 50))
            colors = small.getcolors(maxcolors=2500)
            if colors:
                # Sort by count descending
                colors.sort(key=lambda x: x[0], reverse=True)
                for count, rgb in colors[:5]:
                    hex_val = f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
                    dominant_hexes.append(hex_val)
        except Exception:
            pass

        extracted_img = ExtractedImage(
            filename=filename,
            page_number=1,
            width=w,
            height=h,
            format=img_format,
            ocr_text=""
        )

        metadata = {
            "format": img_format,
            "width": w,
            "height": h,
            "filename": filename,
            "dominant_hex_colors": dominant_hexes
        }

        return ExtractedContent(
            full_text="",
            text_blocks=[],
            images=[extracted_img],
            metadata=metadata
        )
