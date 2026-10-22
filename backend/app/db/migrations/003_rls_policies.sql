-- ==============================================================================
-- BrandProof Migration 003: Row-Level Security (RLS) Policies
-- Enforces strict multi-tenant isolation by org_id claim in Supabase JWT
-- ==============================================================================

-- Helper function to extract user org_id from JWT
CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid,
        (current_setting('request.jwt.claim.org_id', true))::uuid
    );
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to extract user role from JWT
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb ->> 'role',
        current_setting('request.jwt.claim.role', true)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 1. Enable RLS on all tenant tables
-- ==============================================================================
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Organizations Policies
-- ==============================================================================
DROP POLICY IF EXISTS "org_select_own" ON organisations;
CREATE POLICY "org_select_own" ON organisations
    FOR SELECT USING (id = current_user_org_id());

DROP POLICY IF EXISTS "org_update_admin" ON organisations;
CREATE POLICY "org_update_admin" ON organisations
    FOR UPDATE USING (id = current_user_org_id() AND current_user_role() = 'admin');

-- ==============================================================================
-- 3. Users Profiles Policies
-- ==============================================================================
DROP POLICY IF EXISTS "users_select_same_org" ON users;
CREATE POLICY "users_select_same_org" ON users
    FOR SELECT USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS "users_update_admin_or_self" ON users;
CREATE POLICY "users_update_admin_or_self" ON users
    FOR UPDATE USING (
        org_id = current_user_org_id() AND 
        (id = auth.uid() OR current_user_role() = 'admin')
    );

-- ==============================================================================
-- 4. Rules Policies (Rulebook)
-- ==============================================================================
DROP POLICY IF EXISTS "rules_select_org" ON rules;
CREATE POLICY "rules_select_org" ON rules
    FOR SELECT USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS "rules_write_manager" ON rules;
CREATE POLICY "rules_write_manager" ON rules
    FOR ALL USING (
        org_id = current_user_org_id() AND 
        current_user_role() IN ('brand_manager', 'admin')
    );

-- ==============================================================================
-- 5. Facts Policies (Facts Vault)
-- ==============================================================================
DROP POLICY IF EXISTS "facts_select_org" ON facts;
CREATE POLICY "facts_select_org" ON facts
    FOR SELECT USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS "facts_write_manager" ON facts;
CREATE POLICY "facts_write_manager" ON facts
    FOR ALL USING (
        org_id = current_user_org_id() AND 
        current_user_role() IN ('brand_manager', 'admin')
    );

-- ==============================================================================
-- 6. Terms Policies (Terminology)
-- ==============================================================================
DROP POLICY IF EXISTS "terms_select_org" ON terms;
CREATE POLICY "terms_select_org" ON terms
    FOR SELECT USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS "terms_write_manager" ON terms;
CREATE POLICY "terms_write_manager" ON terms
    FOR ALL USING (
        org_id = current_user_org_id() AND 
        current_user_role() IN ('brand_manager', 'admin')
    );

-- ==============================================================================
-- 7. Assets Policies (Brand Asset Library)
-- ==============================================================================
DROP POLICY IF EXISTS "assets_select_org" ON assets;
CREATE POLICY "assets_select_org" ON assets
    FOR SELECT USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS "assets_write_manager" ON assets;
CREATE POLICY "assets_write_manager" ON assets
    FOR ALL USING (
        org_id = current_user_org_id() AND 
        current_user_role() IN ('brand_manager', 'admin')
    );

-- ==============================================================================
-- 8. Content Items Policies
-- ==============================================================================
DROP POLICY IF EXISTS "content_select_org" ON content_items;
CREATE POLICY "content_select_org" ON content_items
    FOR SELECT USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS "content_insert_creator_or_mgr" ON content_items;
CREATE POLICY "content_insert_creator_or_mgr" ON content_items
    FOR INSERT WITH CHECK (
        org_id = current_user_org_id() AND 
        author_id = auth.uid()
    );

DROP POLICY IF EXISTS "content_update_author_or_mgr" ON content_items;
CREATE POLICY "content_update_author_or_mgr" ON content_items
    FOR UPDATE USING (
        org_id = current_user_org_id() AND 
        (author_id = auth.uid() OR current_user_role() IN ('brand_manager', 'admin'))
    );

-- ==============================================================================
-- 9. Content Versions Policies
-- ==============================================================================
DROP POLICY IF EXISTS "versions_select_org" ON content_versions;
CREATE POLICY "versions_select_org" ON content_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM content_items ci 
            WHERE ci.id = content_versions.content_item_id 
              AND ci.org_id = current_user_org_id()
        )
    );

DROP POLICY IF EXISTS "versions_insert_author" ON content_versions;
CREATE POLICY "versions_insert_author" ON content_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM content_items ci 
            WHERE ci.id = content_versions.content_item_id 
              AND ci.org_id = current_user_org_id()
              AND (ci.author_id = auth.uid() OR current_user_role() IN ('brand_manager', 'admin'))
        )
    );

-- ==============================================================================
-- 10. Findings Policies
-- ==============================================================================
DROP POLICY IF EXISTS "findings_select_org" ON findings;
CREATE POLICY "findings_select_org" ON findings
    FOR SELECT USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS "findings_update_org_members" ON findings;
CREATE POLICY "findings_update_org_members" ON findings
    FOR UPDATE USING (org_id = current_user_org_id());

-- ==============================================================================
-- 11. Reviews Policies
-- ==============================================================================
DROP POLICY IF EXISTS "reviews_select_org" ON reviews;
CREATE POLICY "reviews_select_org" ON reviews
    FOR SELECT USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS "reviews_insert_reviewer" ON reviews;
CREATE POLICY "reviews_insert_reviewer" ON reviews
    FOR INSERT WITH CHECK (
        org_id = current_user_org_id() AND 
        reviewer_id = auth.uid() AND 
        current_user_role() IN ('reviewer', 'brand_manager', 'admin')
    );

-- ==============================================================================
-- 12. Comments Policies
-- ==============================================================================
DROP POLICY IF EXISTS "comments_select_org" ON comments;
CREATE POLICY "comments_select_org" ON comments
    FOR SELECT USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS "comments_insert_author" ON comments;
CREATE POLICY "comments_insert_author" ON comments
    FOR INSERT WITH CHECK (
        org_id = current_user_org_id() AND 
        author_id = auth.uid()
    );

-- ==============================================================================
-- 13. AI Disclosures Policies
-- ==============================================================================
DROP POLICY IF EXISTS "ai_disclosures_select_org" ON ai_disclosures;
CREATE POLICY "ai_disclosures_select_org" ON ai_disclosures
    FOR SELECT USING (org_id = current_user_org_id());

-- ==============================================================================
-- 14. Audit Log Policies
-- ==============================================================================
DROP POLICY IF EXISTS "audit_select_manager" ON audit_log;
CREATE POLICY "audit_select_manager" ON audit_log
    FOR SELECT USING (
        org_id = current_user_org_id() AND 
        current_user_role() IN ('brand_manager', 'admin')
    );

-- ==============================================================================
-- 15. Rule Health Events Policies
-- ==============================================================================
DROP POLICY IF EXISTS "rule_health_select_manager" ON rule_health_events;
CREATE POLICY "rule_health_select_manager" ON rule_health_events
    FOR SELECT USING (
        org_id = current_user_org_id() AND 
        current_user_role() IN ('brand_manager', 'admin')
    );

-- ==============================================================================
-- 16. Notifications Policies
-- ==============================================================================
DROP POLICY IF EXISTS "notifications_select_recipient" ON notifications;
CREATE POLICY "notifications_select_recipient" ON notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_recipient" ON notifications;
CREATE POLICY "notifications_update_recipient" ON notifications
    FOR UPDATE USING (user_id = auth.uid());
