"""
BrandProof Vector Similarity Search.

Provides:
  - Cosine distance and similarity math.
  - In-memory similarity search for offline testing and golden sets.
  - PostgreSQL pgvector RPC invocation via Supabase client (match_facts).
"""

import math
from typing import List, Dict, Any, Optional


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two float vectors: (A . B) / (||A|| * ||B||)."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return dot_product / (norm_a * norm_b)


def search_facts_in_memory(
    query_vector: List[float],
    facts: List[Dict[str, Any]],
    threshold: float = 0.65,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Search facts in memory by cosine similarity between query_vector and fact['embedding'].
    Returns top_k matches sorted descending by similarity.
    """
    scored = []
    for fact in facts:
        fact_vec = fact.get("embedding")
        if not fact_vec:
            continue
        sim = cosine_similarity(query_vector, fact_vec)
        if sim >= threshold:
            match = dict(fact)
            match["similarity"] = round(sim, 4)
            scored.append(match)

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return scored[:top_k]


async def search_facts_pgvector(
    supabase_client: Any,
    query_vector: List[float],
    org_id: Optional[str] = None,
    threshold: float = 0.65,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Execute pgvector cosine similarity search using the match_facts stored procedure.
    """
    params = {
        "query_embedding": query_vector,
        "match_threshold": threshold,
        "match_count": top_k,
        "filter_org_id": org_id
    }
    response = supabase_client.rpc("match_facts", params).execute()
    return response.data or []
