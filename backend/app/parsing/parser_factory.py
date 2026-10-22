"""
Parser Factory (T-110).
Routes file uploads to the appropriate parser based on extension or mime-type.
"""

from app.parsing.models import ExtractedContent, TextBlock
from app.parsing.pdf_parser import PDFParser
from app.parsing.docx_parser import DOCXParser
from app.parsing.image_parser import ImageParser


class ParserFactory:
    @classmethod
    def parse_file(cls, file_bytes: bytes, filename: str) -> ExtractedContent:
        fname_lower = filename.lower()

        if fname_lower.endswith(".pdf"):
            return PDFParser.parse(file_bytes, filename)
        elif fname_lower.endswith(".docx"):
            return DOCXParser.parse(file_bytes, filename)
        elif any(fname_lower.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"]):
            return ImageParser.parse(file_bytes, filename)
        else:
            # Fallback plain text decoder
            try:
                text = file_bytes.decode("utf-8")
            except Exception:
                text = file_bytes.decode("latin-1", errors="ignore")

            return ExtractedContent(
                full_text=text,
                text_blocks=[TextBlock(text=text, page_number=1, block_type="paragraph")],
                metadata={"format": "plain_text", "filename": filename}
            )
