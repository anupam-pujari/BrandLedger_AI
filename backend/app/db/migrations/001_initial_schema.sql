-- ==============================================================================
-- BrandProof Migration 001: Initial Core Relational Schema
-- Supports multi-tenant brand governance, content lifecycle, and audit logs.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    settings JSONB NOT NULL DEFAULT '{"rules_only_mode": false, "ai_provider": "openai", "masking_config": {"mask_emails": true, "mask_phones": true, "mask_confidential": true}}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- matches auth.users.id
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('creator', 'reviewer', 'brand_manager', 'admin')),
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. Rules Table (Rulebook)
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    rule_code TEXT NOT NULL, -- e.g. R-21
    category TEXT NOT NULL CHECK (category IN ('tone', 'terminology', 'messaging', 'visual', 'accessibility', 'claims')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    good_example TEXT,
    bad_example TEXT,
    source_document TEXT,
    source_page INTEGER,
    source_quote TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'needs_examples')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_rule_code UNIQUE (org_id, rule_code)
);

CREATE INDEX IF NOT EXISTS idx_rules_org_status ON rules(org_id, status);
CREATE INDEX IF NOT EXISTS idx_rules_category ON rules(org_id, category);

-- 5. Facts Table (Approved Facts Vault)
CREATE TABLE IF NOT EXISTS facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    fact_code TEXT NOT NULL, -- e.g. F-07
    content TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    source_document TEXT,
    valid_until DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'retired')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_fact_code UNIQUE (org_id, fact_code)
);

CREATE INDEX IF NOT EXISTS idx_facts_org_status ON facts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_facts_valid_until ON facts(valid_until);

-- Dynamic View for Facts with Computed Expiry
CREATE OR REPLACE VIEW v_facts AS
SELECT 
    f.*,
    (f.valid_until < CURRENT_DATE OR f.status = 'expired') AS is_expired
FROM facts f;

-- 6. Terminology Table
CREATE TABLE IF NOT EXISTS terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    preferred_term TEXT NOT NULL,
    banned_alternatives TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT,
    case_sensitive BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terms_org ON terms(org_id);

-- 7. Assets Table (Brand Asset Library)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'colour', 'font', 'image')),
    file_path TEXT, -- Storage bucket path
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    usage_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_org_type ON assets(org_id, asset_type);

-- 8. Content Items Table (Drafts & Published Content)
CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'social_post', 'email', 'document', 'image')),
    format TEXT CHECK (format IN ('plain_text', 'pdf', 'docx', 'pptx', 'png', 'jpg')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'checking', 'checked', 'in_review', 'changes_requested', 'approved')),
    intent_purpose TEXT,
    intent_audience TEXT,
    intent_key_message TEXT,
    rules_only_mode BOOLEAN NOT NULL DEFAULT false,
    current_version_id UUID, -- Foreign key added below after content_versions table creation
    file_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_org_status ON content_items(org_id, status);
CREATE INDEX IF NOT EXISTS idx_content_author ON content_items(author_id);

-- 9. Content Versions Table
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    body TEXT NOT NULL,
    extracted_text TEXT,
    diff_from_previous JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_content_version UNIQUE (content_item_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_content_id ON content_versions(content_item_id);

-- Circular FK resolution: Link content_items.current_version_id -> content_versions.id
ALTER TABLE content_items 
ADD CONSTRAINT fk_content_current_version 
FOREIGN KEY (current_version_id) REFERENCES content_versions(id) 
ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

-- 10. Findings Table (Issues Flagged by Review Engine)
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    content_version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL CHECK (check_type IN ('rule_check', 'ai_assisted')),
    category TEXT NOT NULL CHECK (category IN ('tone', 'terminology', 'messaging', 'visual', 'accessibility', 'claims')),
    rule_id UUID REFERENCES rules(id) ON DELETE SET NULL,
    fact_id UUID REFERENCES facts(id) ON DELETE SET NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    flagged_text TEXT,
    evidence_quote TEXT,
    suggested_fix TEXT,
    confidence FLOAT CHECK (confidence >= 0.0 AND confidence <= 1.0),
    needs_human_judgement BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'edited', 'dismissed')),
    dismiss_reason TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_findings_content_status ON findings(content_item_id, status);
CREATE INDEX IF NOT EXISTS idx_findings_org_id ON findings(org_id);

-- 11. Reviews Table (Decisions & Assignment)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decision TEXT CHECK (decision IN ('approved', 'changes_requested')),
    notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_content ON reviews(content_item_id);

-- Self-Approval Guard: Reviewer cannot approve content they authored
CREATE OR REPLACE FUNCTION check_self_approval_guard()
RETURNS TRIGGER AS $$
DECLARE
    item_author_id UUID;
BEGIN
    SELECT author_id INTO item_author_id 
    FROM content_items 
    WHERE id = NEW.content_item_id;

    IF NEW.reviewer_id = item_author_id AND NEW.decision = 'approved' THEN
        RAISE EXCEPTION 'Constitution Rule C1.3 Violation: Author cannot approve their own content (author_id = %)', item_author_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_self_approval ON reviews;
CREATE TRIGGER trg_reviews_self_approval
BEFORE INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION check_self_approval_guard();

-- 12. Comments Table (Threaded Feedback)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_item_id);
CREATE INDEX IF NOT EXISTS idx_comments_finding ON comments(finding_id);

-- 13. AI Disclosures Table (Transparency & Audit)
CREATE TABLE IF NOT EXISTS ai_disclosures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    content_version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    masked_input TEXT NOT NULL,
    raw_response JSONB NOT NULL,
    masking_map JSONB NOT NULL DEFAULT '{}'::jsonb,
    called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latency_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ai_disclosures_content ON ai_disclosures(content_item_id);

-- 14. Audit Log Table (Immutable Ledger)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_state JSONB,
    new_state JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_time ON audit_log(org_id, created_at DESC);

-- Disallow UPDATE and DELETE on audit_log (Immutable)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Constitution Rule C4.4: audit_log records are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_immutable ON audit_log;
CREATE TRIGGER trg_audit_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- 15. Rule Health Events Table (Insights & Learning Loop)
CREATE TABLE IF NOT EXISTS rule_health_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('triggered', 'accepted', 'dismissed', 'overridden')),
    content_item_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rule_health_rule ON rule_health_events(rule_id, event_type);

-- 16. Notifications Table (In-App Alerts)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- review_submitted, changes_requested, approved, fact_expiring
    title TEXT NOT NULL,
    body TEXT,
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
