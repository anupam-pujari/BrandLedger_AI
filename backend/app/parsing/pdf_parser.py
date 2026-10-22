"""
PDF Document Parser (T-111).
Uses PyMuPDF (fitz) to extract text blocks, page structure, and embedded images.
"""

from typing import List
import pymupdf as fitz
from app.parsing.models import ExtractedContent, TextBlock, ExtractedImage


class PDFParser:
    @classmethod
    def parse(cls, file_bytes: bytes, filename: str = "document.pdf") -> ExtractedContent:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_blocks: List[TextBlock] = []
        extracted_images: List[ExtractedImage] = []
        full_text_parts: List[str] = []

        metadata = {
            "page_count": len(doc),
            "format": "pdf",
            "filename": filename,
            **doc.metadata
        }

        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text("text").strip()

            if page_text:
                full_text_parts.append(page_text)
                for paragraph in page_text.split("\n\n"):
                    clean_p = paragraph.strip()
                    if clean_p:
                        text_blocks.append(TextBlock(
                            text=clean_p,
                            page_number=page_num + 1,
                            block_type="paragraph"
                        ))

            # Extract embedded images
            image_list = page.get_images(full=True)
            for img_index, img_info in enumerate(image_list):
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                image_ext = base_image.get("ext", "png")
                w = base_image.get("width", 0)
                h = base_image.get("height", 0)

                extracted_images.append(ExtractedImage(
                    filename=f"page_{page_num+1}_img_{img_index+1}.{image_ext}",
                    page_number=page_num + 1,
                    width=w,
                    height=h,
                    format=image_ext
                ))

        doc.close()
        return ExtractedContent(
            full_text="\n\n".join(full_text_parts),
            text_blocks=text_blocks,
            images=extracted_images,
            metadata=metadata
        )
