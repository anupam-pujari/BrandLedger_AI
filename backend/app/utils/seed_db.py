"""
BrandProof Database Seeding CLI (T-154).
Seeds the database with ApexCloud demo organization, users, rules, facts (with embeddings),
terms, brand palette assets, and content drafts.
"""

import sys
import asyncio
from pathlib import Path
from typing import Optional

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.client import get_supabase_admin
from app.embeddings.embedder import embed_text
from tests.sample_data.seed_demo_data import (
    load_sample_rules,
    load_sample_facts,
    load_sample_terms,
    load_sample_palette,
    load_sample_drafts,
)

DEFAULT_DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001"
DEFAULT_DEMO_USER_ID = "00000000-0000-0000-0000-000000000002"


async def seed_database(org_id: str = DEFAULT_DEMO_ORG_ID) -> None:
    client = get_supabase_admin()
    print(f"[*] Starting BrandProof database seeding for Org ID: {org_id}...")

    # 1. Organization
    org_data = {
        "id": org_id,
        "name": "ApexCloud Technologies",
        "slug": "apexcloud",
        "settings": {
            "rules_only_mode": False,
            "ai_provider": "openai",
            "enforce_tone": True,
            "masking_config": {
                "mask_emails": True,
                "mask_phones": True,
                "mask_confidential": True
            }
        }
    }
    client.table("organizations").upsert(org_data).execute()
    print("  [+] Organization 'ApexCloud Technologies' seeded.")

    # 2. Demo Users
    users_data = [
        {
            "id": DEFAULT_DEMO_USER_ID,
            "org_id": org_id,
            "email": "sarah.lin@apexcloud.io",
            "name": "Sarah Lin",
            "role": "brand_manager"
        },
        {
            "id": "00000000-0000-0000-0000-000000000003",
            "org_id": org_id,
            "email": "marcus.vance@apexcloud.io",
            "name": "Marcus Vance",
            "role": "creator"
        },
        {
            "id": "00000000-0000-0000-0000-000000000004",
            "org_id": org_id,
            "email": "elena.rostova@apexcloud.io",
            "name": "Elena Rostova",
            "role": "reviewer"
        }
    ]
    for u in users_data:
        client.table("users").upsert(u).execute()
    print(f"  [+] {len(users_data)} Demo Users seeded.")

    # 3. Rules
    sample_rules = load_sample_rules()
    for rule in sample_rules:
        rule_row = dict(rule)
        rule_row["org_id"] = org_id
        client.table("rules").insert(rule_row).execute()
    print(f"  [+] {len(sample_rules)} Brand Rules seeded.")

    # 4. Facts Vault with Embeddings
    sample_facts = load_sample_facts()
    for fact in sample_facts:
        fact_row = dict(fact)
        fact_row["org_id"] = org_id
        if not fact_row.get("embedding"):
            fact_row["embedding"] = embed_text(fact_row.get("content", ""))
        client.table("facts").insert(fact_row).execute()
    print(f"  [+] {len(sample_facts)} Facts Vault entries seeded (with 384-d vector embeddings).")

    # 5. Terms
    sample_terms = load_sample_terms()
    for term in sample_terms:
        term_row = dict(term)
        term_row["org_id"] = org_id
        client.table("terms").insert(term_row).execute()
    print(f"  [+] {len(sample_terms)} Terminology definitions seeded.")

    # 6. Brand Palette Assets
    sample_palette = load_sample_palette()
    for color in sample_palette.get("colors", []):
        asset_row = {
            "org_id": org_id,
            "name": color.get("name"),
            "asset_type": "color",
            "metadata": {
                "hex": color.get("hex"),
                "role": color.get("role"),
                "usage": color.get("usage")
            }
        }
        client.table("assets").insert(asset_row).execute()
    print(f"  [+] {len(sample_palette.get('colors', []))} Brand Palette assets seeded.")

    # 7. Content Drafts
    sample_drafts = load_sample_drafts()
    for draft in sample_drafts:
        content_row = {
            "id": draft.get("id"),
            "org_id": org_id,
            "author_id": DEFAULT_DEMO_USER_ID,
            "title": draft.get("title", draft.get("name", "Untitled Draft")),
            "content_type": draft.get("content_type", "text"),
            "status": "draft",
            "intent_purpose": (draft.get("intent_lock") or {}).get("purpose"),
            "intent_audience": (draft.get("intent_lock") or {}).get("target_audience"),
            "intent_key_message": (draft.get("intent_lock") or {}).get("key_message"),
            "image_metadata": draft.get("image_metadata")
        }
        client.table("content_items").insert(content_row).execute()

        version_row = {
            "id": f"{draft.get('id')}_v1",
            "content_item_id": draft.get("id"),
            "org_id": org_id,
            "version_number": 1,
            "body": draft.get("body", "")
        }
        client.table("content_versions").insert(version_row).execute()

    print(f"  [+] {len(sample_drafts)} Demo Content Items & Versions seeded.")
    print("==================================================================")
    print("SUCCESS: BrandProof demo data seeding completed successfully!")
    print("==================================================================")


if __name__ == "__main__":
    asyncio.run(seed_database())
