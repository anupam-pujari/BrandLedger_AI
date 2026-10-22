"""
BrandProof Demo & Sample Data Seeder / Loader.

Provides utilities to load and inspect the synthetic brand dataset for 'ApexCloud Technologies'.
Used for:
  - Database seeding (Rules, Facts, Terms, Assets).
  - Offline unit testing without external database dependencies.
  - Golden test set validation harness.
"""

import json
from pathlib import Path
from typing import Any, Dict, List

DATA_DIR = Path(__file__).parent


def load_sample_rules() -> List[Dict[str, Any]]:
    """Load approved and draft rules for the fictional brand."""
    with open(DATA_DIR / "sample_rules.json", "r", encoding="utf-8") as f:
        return json.load(f)


def load_sample_facts() -> List[Dict[str, Any]]:
    """Load the approved facts vault (both active and deliberately expired facts)."""
    with open(DATA_DIR / "sample_facts.json", "r", encoding="utf-8") as f:
        return json.load(f)


def load_sample_terms() -> List[Dict[str, Any]]:
    """Load preferred vs banned terminology mappings."""
    with open(DATA_DIR / "sample_terms.json", "r", encoding="utf-8") as f:
        return json.load(f)


def load_sample_palette() -> Dict[str, Any]:
    """Load the brand color palette and WCAG contrast specifications."""
    with open(DATA_DIR / "sample_brand_palette.json", "r", encoding="utf-8") as f:
        return json.load(f)


def load_sample_drafts() -> List[Dict[str, Any]]:
    """Load test content drafts mapped to expected review engine findings."""
    with open(DATA_DIR / "sample_drafts.json", "r", encoding="utf-8") as f:
        return json.load(f)


def verify_dataset() -> None:
    """Validate that all sample data files exist, parse correctly, and display dataset metrics."""
    rules = load_sample_rules()
    facts = load_sample_facts()
    terms = load_sample_terms()
    palette = load_sample_palette()
    drafts = load_sample_drafts()

    active_facts = [f for f in facts if not f.get("is_expired")]
    expired_facts = [f for f in facts if f.get("is_expired")]

    clean_drafts = [d for d in drafts if len(d.get("expected_findings", [])) == 0]
    violation_drafts = [d for d in drafts if len(d.get("expected_findings", [])) > 0]

    print("==================================================================")
    print("      BRANDPROOF SYNTHETIC BRAND DATASET: APEXCLOUD")
    print("==================================================================")
    print(f"• Rules Loaded:           {len(rules)} across 6 categories (tone, terms, claims, visual, a11y, msg)")
    print(f"• Facts in Vault:         {len(facts)} ({len(active_facts)} Active, {len(expired_facts)} Deliberately Expired)")
    print(f"• Terminology Pairs:      {len(terms)} (Inclusive & Case-Sensitive rules)")
    print(f"• Brand Color Swatches:   {len(palette.get('colors', []))} (WCAG AA Contrast Mapped)")
    print(f"• Test Content Drafts:    {len(drafts)} ({len(violation_drafts)} with Controlled Errors, {len(clean_drafts)} Clean Passes)")
    print("==================================================================")
    print("Status: All sample JSON files are valid and ready for test harnesses.")


if __name__ == "__main__":
    verify_dataset()
