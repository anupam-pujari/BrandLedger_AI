-- ==============================================================================
-- BrandProof Migration 002: Enable pgvector & Semantic Search RPCs
-- Adds 384-dimensional vector columns and HNSW indexes for sentence-transformers
-- ==============================================================================

-- 1. Enable pgvector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add Vector Embeddings Columns to Rules & Facts
ALTER TABLE rules ADD COLUMN IF NOT EXISTS embedding vector(384);
ALTER TABLE facts ADD COLUMN IF NOT EXISTS embedding vector(384);

-- 3. Create HNSW Cosine Similarity Indexes
-- HNSW builds safely on empty tables and provides superior speed and recall compared to IVFFlat.
CREATE INDEX IF NOT EXISTS idx_facts_embedding_hnsw 
ON facts USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_rules_embedding_hnsw 
ON rules USING hnsw (embedding vector_cosine_ops);

-- 4. RPC Function: match_facts
-- Performs cosine distance search against the Facts Vault for Claim Passport validation.
CREATE OR REPLACE FUNCTION match_facts(
    query_embedding vector(384),
    match_threshold FLOAT DEFAULT 0.65,
    match_count INT DEFAULT 5,
    filter_org_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    fact_code TEXT,
    content TEXT,
    valid_until DATE,
    status TEXT,
    is_expired BOOLEAN,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.fact_code,
        f.content,
        f.valid_until,
        f.status,
        (f.valid_until < CURRENT_DATE OR f.status = 'expired') AS is_expired,
        1 - (f.embedding <=> query_embedding) AS similarity
    FROM facts f
    WHERE (filter_org_id IS NULL OR f.org_id = filter_org_id)
      AND f.embedding IS NOT NULL
      AND 1 - (f.embedding <=> query_embedding) >= match_threshold
    ORDER BY f.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 5. RPC Function: match_rules
-- Finds nearest tone, claims, or messaging rules for a given text excerpt.
CREATE OR REPLACE FUNCTION match_rules(
    query_embedding vector(384),
    match_threshold FLOAT DEFAULT 0.65,
    match_count INT DEFAULT 5,
    filter_org_id UUID DEFAULT NULL,
    filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    rule_code TEXT,
    category TEXT,
    title TEXT,
    description TEXT,
    good_example TEXT,
    bad_example TEXT,
    severity TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.rule_code,
        r.category,
        r.title,
        r.description,
        r.good_example,
        r.bad_example,
        r.severity,
        1 - (r.embedding <=> query_embedding) AS similarity
    FROM rules r
    WHERE (filter_org_id IS NULL OR r.org_id = filter_org_id)
      AND (filter_category IS NULL OR r.category = filter_category)
      AND r.status = 'approved'
      AND r.embedding IS NOT NULL
      AND 1 - (r.embedding <=> query_embedding) >= match_threshold
    ORDER BY r.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
