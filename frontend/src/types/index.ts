export type UserRole = 'creator' | 'reviewer' | 'brand_manager' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  orgId: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  rulesOnlyMode: boolean;
  aiProvider: string;
  maskingEnabled: boolean;
}

export type RuleCategory = 'tone' | 'terminology' | 'messaging' | 'claims' | 'visual' | 'accessibility';
export type RuleSeverity = 'critical' | 'warning' | 'info';
export type RuleStatus = 'draft' | 'proposed' | 'approved' | 'rejected' | 'needs_examples';

export interface Rule {
  id: string;
  org_id: string;
  rule_code: string;
  title: string;
  category: RuleCategory;
  severity: RuleSeverity;
  status: RuleStatus;
  description: string;
  bad_example?: string;
  good_example?: string;
  explanation?: string;
  source_document?: string;
  source_page?: number;
  source_quote?: string;
  is_active?: boolean;
}

export type FactStatus = 'active' | 'expired' | 'unverified';

export interface Fact {
  id: string;
  org_id: string;
  fact_code: string;
  category?: string;
  content: string;
  owner_name: string;
  owner_email: string;
  source_document?: string;
  valid_until: string;
  status: FactStatus;
  tags?: string[];
  is_expired?: boolean;
  embedding?: number[];
}

export interface Term {
  id: string;
  org_id: string;
  term_type: 'preferred' | 'banned';
  term: string;
  replacement?: string;
  case_sensitive: boolean;
  whole_word: boolean;
  reason?: string;
}

export interface BrandAsset {
  id: string;
  org_id: string;
  name: string;
  asset_type: 'color' | 'logo' | 'font' | 'image';
  file_url?: string;
  metadata?: {
    hex?: string;
    role?: string;
    usage?: string;
    min_contrast_ratio?: number;
    min_width_px?: number;
    clearance_ratio?: number;
  };
}

export type ContentStatus = 'draft' | 'checking' | 'checked' | 'in_review' | 'changes_requested' | 'approved';

export interface ContentItem {
  id: string;
  org_id: string;
  author_id: string;
  title: string;
  content_type: 'text' | 'document' | 'image' | 'social';
  status: ContentStatus;
  intent_purpose?: string;
  intent_audience?: string;
  intent_key_message?: string;
  rules_only_mode?: boolean;
  current_version_id?: string;
  current_version?: {
    id: string;
    version_number: number;
    body: string;
    diff_from_previous?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export type FindingSeverity = 'critical' | 'warning' | 'info';
export type FindingStatus = 'open' | 'accepted' | 'dismissed' | 'edited';
export type ClaimStatus = 'supported' | 'outdated' | 'conflicting' | 'unsupported';

export interface FindingProof {
  rule_id?: string;
  rule_code?: string;
  fact_id?: string;
  fact_code?: string;
  source_document?: string;
  source_page?: number;
  source_quote?: string;
  claim_status?: ClaimStatus;
  matched_fact_owner?: string;
  matched_fact_expiry?: string;
}

export interface Finding {
  id: string;
  org_id?: string;
  content_item_id: string;
  content_version_id?: string;
  rule_id?: string;
  fact_id?: string;
  check_type: 'rule' | 'ai';
  category: RuleCategory;
  severity: FindingSeverity;
  status: FindingStatus;
  title: string;
  description: string;
  flagged_text: string;
  character_start?: number;
  character_end?: number;
  proof: FindingProof;
  suggested_fix?: string;
  dismiss_reason?: string;
  confidence?: number;
  created_at?: string;
}

export interface AIDisclosure {
  id: string;
  model_name: string;
  called_at: string;
  latency_ms: number;
  masked_tokens_count?: number;
  masking_map?: Record<string, string>;
  raw_prompt_excerpt?: string;
}

export interface RuleHealthStat {
  rule_id: string;
  rule_code: string;
  title: string;
  category: string;
  trigger_count: number;
  accept_rate: number;
  dismiss_rate: number;
  is_unclear: boolean;
  suggested_rewrite?: string;
}

export interface RecurringMistake {
  group: string;
  total_violations: number;
  top_issues: Array<{ title: string; count: number }>;
}

export interface DashboardStats {
  total_content_items: number;
  approved_content_items: number;
  approval_rate: number;
  total_findings_detected: number;
  critical_findings: number;
  warning_findings: number;
  active_rules_count: number;
  active_facts_count: number;
  review_engine_health: string;
}
