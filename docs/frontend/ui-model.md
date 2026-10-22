# BrandProof — Frontend UI Data Model

> Comprehensive TypeScript interfaces and state models for the BrandProof React application.
> Directly maps to the backend data model and API contract, specifying all client-side domain entities, form states, and UI view models.

---

## 1. Domain Entities & Core Types

### 1.1 Authentication & User Session

```typescript
export type UserRole = 'creator' | 'reviewer' | 'brand_manager' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  orgId: string;
  createdAt: string;
}

export interface AuthSession {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  rulesOnlyMode: boolean;
  aiProvider: 'claude-3-5-sonnet' | 'gpt-4o' | 'local-mistral';
  maskingEnabled: boolean;
  createdAt: string;
}
```

---

### 1.2 Source of Truth Models

#### Rulebook Entities
```typescript
export type RuleCategory = 'tone' | 'terminology' | 'messaging' | 'claims' | 'visual' | 'accessibility';
export type RuleSeverity = 'critical' | 'warning' | 'info';
export type RuleStatus = 'draft' | 'proposed' | 'approved' | 'rejected' | 'needs_examples';

export interface RuleExample {
  id: string;
  goodExample: string;
  badExample: string;
  explanation: string;
}

export interface Rule {
  id: string;
  orgId: string;
  code: string;               // e.g. "R-14"
  title: string;
  category: RuleCategory;
  severity: RuleSeverity;
  status: RuleStatus;
  description: string;
  sourceDocName?: string;
  sourcePageNumber?: number;
  sourceQuote?: string;
  examples: RuleExample[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProposedRuleFromCompiler {
  tempId: string;
  code: string;
  title: string;
  category: RuleCategory;
  severity: RuleSeverity;
  description: string;
  sourcePageNumber: number;
  sourceQuote: string;
  suggestedGoodExample?: string;
  suggestedBadExample?: string;
  confidence: number;
  selectedForApproval: boolean;
}
```

#### Facts Vault Entities
```typescript
export type FactDbStatus = 'active' | 'expired' | 'retired';
export type FactDisplayStatus = 'active' | 'expiring_soon' | 'expired';

export interface ApprovedFact {
  id: string;
  orgId: string;
  code: string;               // e.g. "F-07"
  claimStatement: string;     // maps to `content` column in DB
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  sourceDocument?: string;
  validUntil: string;         // ISO Date string
  isExpired: boolean;
  status: FactDbStatus;
  displayStatus?: FactDisplayStatus; // UI computed based on validUntil (< 30 days)
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FactImportPreviewRow {
  rowNumber: number;
  claimStatement: string;
  ownerEmail: string;
  sourceDocument: string;
  validUntil: string;
  tags: string[];
  isValid: boolean;
  validationError?: string;
}
```

#### Terminology & Assets
```typescript
export interface TerminologyItem {
  id: string;
  orgId: string;
  preferredTerm: string;
  bannedAlternatives: string[];
  notes?: string;
  caseSensitive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandColorToken {
  id: string;
  name: string;               // e.g. "Brand Primary Navy"
  hex: string;                // e.g. "#0F172A"
  category: 'primary' | 'secondary' | 'accent' | 'neutral';
  wcagContrastWhite: number;  // e.g. 14.2
  wcagContrastDark: number;   // e.g. 1.3
}

export interface BrandAsset {
  id: string;
  orgId: string;
  name: string;
  category: 'logo' | 'color_palette' | 'font' | 'image';
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  usageNotes: string;
  createdAt: string;
}
```

---

### 1.3 Content, Intent Lock & Versions

```typescript
export type ContentType = 'text' | 'social_post' | 'email' | 'document' | 'image';
export type ContentFormat = 'plain_text' | 'pdf' | 'docx' | 'pptx' | 'png' | 'jpg';
export type ContentStatus = 
  | 'draft' 
  | 'checking' 
  | 'checked' 
  | 'in_review' 
  | 'changes_requested' 
  | 'approved';

export interface IntentLock {
  purpose: string;            // e.g. "Announce v2 product launch to enterprise clients"
  targetAudience: string;     // e.g. "CTOs, VP Engineering, IT Directors"
  keyMessage: string;         // e.g. "Guarantees 99.99% uptime with 45% faster reports"
}

export interface ContentItem {
  id: string;
  orgId: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  authorId: string;
  authorName: string;
  intentLock: IntentLock;
  currentVersionNumber: number;
  findingsCount: {
    critical: number;
    warning: number;
    info: number;
    dismissed: number;
  };
  fileUrl?: string;
  rawTextExcerpt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  bodyText: string;
  fileUrl?: string;
  changesSummary?: string;
  createdBy: string;
  createdAt: string;
}
```

---

### 1.4 Review Engine, Proof & Finding Cards

```typescript
export type CheckOrigin = 'rule_check' | 'ai_assisted';

export interface RuleProof {
  type: 'rule';
  ruleCode: string;
  ruleTitle: string;
  category: RuleCategory;
  sourceDocName?: string;
  sourcePageNumber?: number;
  sourceQuote: string;
}

export interface ClaimPassportProof {
  type: 'claim_passport';
  extractedClaim: string;
  matchStatus: 'supported' | 'outdated' | 'conflicting' | 'unsupported';
  matchedFactCode?: string;
  matchedFactText?: string;
  factOwnerName?: string;
  factExpiryDate?: string;
  isExpired: boolean;
}

export type ProofData = RuleProof | ClaimPassportProof;

export interface MeaningCheck {
  keyPointsBefore: string[];
  keyPointsAfter: string[];
  intentPreserved: boolean;
  divergenceNotes?: string;
}

export interface SuggestedFix {
  originalText: string;
  replacementText: string;
  explanation: string;
  meaningCheck?: MeaningCheck;
}

export interface Finding {
  id: string;
  contentId: string;
  versionNumber: number;
  severity: RuleSeverity;
  checkOrigin: CheckOrigin;
  category: RuleCategory;
  title: string;
  flaggedText: string;
  startCharIndex: number;
  endCharIndex: number;
  whyExplanation: string;
  proof: ProofData;
  confidence: number;         // 0.0 to 1.0
  needsHumanJudgement: boolean;
  suggestedFix?: SuggestedFix;
  isResolved: boolean;
  dismissalReason?: string;
  dismissedByUserId?: string;
  resolvedAt?: string;
}
```

---

### 1.5 Collaboration, Reviews & Audit Records

```typescript
export type ReviewDecision = 'approved' | 'changes_requested';

export interface ReviewComment {
  id: string;
  contentId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  targetFindingId?: string;
  targetCharRange?: [number, number];
  createdAt: string;
}

export interface AIDisclosureLog {
  id: string;
  contentId: string;
  provider: string;           // e.g. "Claude 3.5 Sonnet"
  rulesOnlyModeUsed: boolean;
  maskedTokensCount: number;
  maskedPayloadSnippet: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  invokedAt: string;
}

export interface AuditRecord {
  contentId: string;
  title: string;
  author: UserProfile;
  approvedBy: UserProfile;
  approvedAt: string;
  versions: ContentVersion[];
  findingsHistory: Finding[];
  comments: ReviewComment[];
  aiDisclosure: AIDisclosureLog[];
}
```

---

### 1.6 Insights & Rule Health Models

```typescript
export interface DisputedRuleMetric {
  ruleCode: string;
  ruleTitle: string;
  category: RuleCategory;
  triggerCount: number;
  dismissalCount: number;
  disputeRate: number;        // e.g. 0.42 (42%)
  isUnclear: boolean;
  commonDismissalReasons: string[];
  proposedAiRewrite?: {
    originalText: string;
    suggestedRewrite: string;
    clarificationReason: string;
  };
}

export interface RecurringMistakeMetric {
  category: RuleCategory;
  frequency: number;
  topViolatedRules: { code: string; title: string; count: number }[];
  breakdownByDepartment: { department: string; count: number }[];
}

export interface InsightsOverview {
  totalContentReviewed: number;
  averageApprovalTimeMinutes: number;
  firstTimePassRate: number;  // 0.0 to 1.0
  totalClaimsChecked: number;
  unsupportedClaimsBlockedCount: number;
  disputedRules: DisputedRuleMetric[];
  recurringMistakes: RecurringMistakeMetric[];
}
```

---

## 2. Form & UI State Models

### 2.1 Content Submission Form State

```typescript
export interface ContentSubmissionFormValues {
  title: string;
  contentType: ContentType;
  bodyText: string;
  attachedFile?: File | null;
  purpose: string;
  targetAudience: string;
  keyMessage: string;
  rulesOnlyModeOverride?: boolean;
}
```

### 2.2 Finding Dismissal Modal State

```typescript
export interface DismissalModalState {
  isOpen: boolean;
  finding: Finding | null;
  reason: string;
  category: 'false_positive' | 'client_exception' | 'outdated_rule' | 'other';
  isSubmitting: boolean;
  error?: string;
}
```

### 2.3 Interactive Highlight State

```typescript
export interface ActiveHighlightState {
  focusedFindingId: string | null;
  hoveredHighlightId: string | null;
  selectedTextRange: [number, number] | null;
}
```

### 2.4 Review Queue Filter State

```typescript
export interface ReviewQueueFilters {
  searchQuery: string;
  status: ContentStatus | 'all';
  contentType: ContentType | 'all';
  hasCriticalIssuesOnly: boolean;
  authorId?: string;
  sortBy: 'created_at' | 'severity' | 'title';
  sortOrder: 'asc' | 'desc';
}
```
