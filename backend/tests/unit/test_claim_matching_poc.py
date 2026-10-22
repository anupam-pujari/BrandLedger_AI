"""
BrandProof Round 1 Proof-of-Concept: Claim Matching Test.

Validates that sentence embeddings and cosine similarity accurately match promotional
claims against the Approved Facts Vault, and correctly detects expired facts (Claim Passport).
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.embeddings.embedder import embed_text, embed_batch
from app.embeddings.search import cosine_similarity, search_facts_in_memory
from tests.sample_data.seed_demo_data import load_sample_facts


def test_claim_passport_matching_poc():
    """Verify claim embedding matches against sample facts vault."""
    facts = load_sample_facts()
    assert len(facts) >= 10, f"Expected at least 10 facts, got {len(facts)}"

    # 1. Embed all facts in batch
    fact_texts = [f["content"] for f in facts]
    embeddings = embed_batch(fact_texts)
    for fact, emb in zip(facts, embeddings):
        fact["embedding"] = emb

    # 2. Test Claim 1: Matches Fact F-07 (Reporting Efficiency)
    claim_1 = "ApexCloud reduces end-of-month reporting compute time by up to 45%."
    emb_1 = embed_text(claim_1)
    matches_1 = search_facts_in_memory(emb_1, facts, threshold=0.60, top_k=3)

    assert len(matches_1) > 0, "No matches found for Claim 1"
    top_match_1 = matches_1[0]
    assert top_match_1["fact_code"] == "F-07", f"Expected F-07, got {top_match_1['fact_code']}"
    assert top_match_1["is_expired"] is True, "Fact F-07 should be identified as expired (Outdated Claim)!"

    # 3. Test Claim 2: Matches Fact F-03 (SOC 2 & ISO Compliance)
    claim_2 = "ApexCloud is SOC 2 Type II certified and ISO/IEC 27001 compliant across global regions."
    emb_2 = embed_text(claim_2)
    matches_2 = search_facts_in_memory(emb_2, facts, threshold=0.60, top_k=3)

    assert len(matches_2) > 0, "No matches found for Claim 2"
    top_match_2 = matches_2[0]
    assert top_match_2["fact_code"] == "F-03", f"Expected F-03, got {top_match_2['fact_code']}"
    assert top_match_2["is_expired"] is False, "Fact F-03 should be active!"

    # 4. Test Claim 3: Matches Fact F-12 (Query Speed)
    claim_3 = "Standard queries execute and return results in under 5 seconds across large datasets."
    emb_3 = embed_text(claim_3)
    matches_3 = search_facts_in_memory(emb_3, facts, threshold=0.60, top_k=3)

    assert len(matches_3) > 0, "No matches found for Claim 3"
    top_match_3 = matches_3[0]
    assert top_match_3["fact_code"] == "F-12", f"Expected F-12, got {top_match_3['fact_code']}"

    print("==================================================================")
    print("      ROUND 1 POC TEST PASSED: CLAIM PASSPORT VALIDATED")
    print("==================================================================")
    print(f"• Claim 1 matched -> Fact {top_match_1['fact_code']} (Similarity: {top_match_1['similarity']}) [OUTDATED: {top_match_1['is_expired']}]")
    print(f"• Claim 2 matched -> Fact {top_match_2['fact_code']} (Similarity: {top_match_2['similarity']}) [ACTIVE]")
    print(f"• Claim 3 matched -> Fact {top_match_3['fact_code']} (Similarity: {top_match_3['similarity']}) [ACTIVE]")
    print("==================================================================")


if __name__ == "__main__":
    test_claim_passport_matching_poc()
