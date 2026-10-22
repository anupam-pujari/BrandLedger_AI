"""
Generic CSV Import Utility.

Parses multipart CSV files into clean dictionaries with row-level validation.
"""

import csv
import io
from typing import List, Dict, Any, Tuple


def parse_csv_stream(file_bytes: bytes, required_fields: List[str]) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Parse CSV bytes into a list of row dicts.
    Returns (valid_rows, error_messages).
    """
    text_content = file_bytes.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text_content))

    valid_rows = []
    errors = []

    if not reader.fieldnames:
        return [], ["CSV file is empty or missing headers."]

    missing_fields = [f for f in required_fields if f not in reader.fieldnames]
    if missing_fields:
        return [], [f"CSV missing mandatory header columns: {', '.join(missing_fields)}"]

    for row_idx, row in enumerate(reader, start=2):
        cleaned = {k.strip(): (v.strip() if v else "") for k, v in row.items() if k}
        # Check required fields
        row_missing = [f for f in required_fields if not cleaned.get(f)]
        if row_missing:
            errors.append(f"Row {row_idx}: missing value for '{', '.join(row_missing)}'")
            continue

        valid_rows.append(cleaned)

    return valid_rows, errors
