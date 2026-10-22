# BrandProof — Frontend Implementation Tasks

> Granular, sequenced task list for implementing the React + Vite + Tailwind CSS frontend.
> Every task maps to requirements in `frontend-requirements.md` and rules in `constitution.md`.

---

## Phase 1: Project Foundation & Environment Setup

- [ ] **T1.1** Initialize project using `vite` with React + TypeScript template.
- [ ] **T1.2** Install runtime dependencies:
  ```bash
  npm install @supabase/supabase-js @tanstack/react-query react-router-dom lucide-react clsx tailwind-merge diff-match-patch
  ```
- [ ] **T1.3** Configure Tailwind CSS with custom brand palette, typography, and contrast tokens.
- [ ] **T1.4** Configure environment variables in `.env.example`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.
- [ ] **T1.5** Set up directory structure:
  ```
  src/
  ├── api/          # Axios instance and API service calls
  ├── assets/       # Static assets, demo logos
  ├── components/   # UI components (atoms, molecules, organisms)
  │   ├── common/   # Buttons, badges, modals, spinners
  │   ├── content/  # FindingCard, IntentLock, AIDisclosure
  │   ├── review/   # DiffViewer, Comments, ReviewActions
  │   └── layout/   # Sidebar, Topbar, AppShell
  ├── context/      # AuthContext, NotificationContext
  ├── hooks/        # React Query hooks and custom utilities
  ├── pages/        # Route page components
  ├── types/        # TypeScript interfaces (from ui-model.md)
  └── utils/        # Formatters, diffing helpers, contrast math
  ```

---

## Phase 2: Design System & Core Primitives

- [ ] **T2.1** Build `<Button />` supporting variants: `primary`, `secondary`, `destructive`, `outline`, `ghost`, and loading spinner states.
- [ ] **T2.2** Build `<Badge />` component supporting semantic severity types:
  - Critical (Red, `OctagonAlert`)
  - Warning (Amber, `TriangleAlert`)
  - Info (Blue, `Info`)
  - Rule Check (Purple) vs. AI-Assisted (Cyan)
- [ ] **T2.3** Build accessible `<Modal />` with focus trapping, backdrop blur, `Escape` key dismiss, and ARIA attributes (WCAG FC4.4).
- [ ] **T2.4** Build form input primitives: `<TextInput />`, `<TextArea />`, `<Select />`, `<FileUploadZone />`.
- [ ] **T2.5** Build `<Toast />` notification provider for success, warning, and error alerts.
- [ ] **T2.6** Build skeleton loaders for cards, tables, and detail screens.

---

## Phase 3: Auth & Application Shell

- [ ] **T3.1** Implement `AuthContext` with Supabase session listener, token refresh, and user profile cache.
- [ ] **T3.2** Build `LoginPage` (`/login`) with email/password authentication and validation.
- [ ] **T3.3** Build `SignupPage` (`/signup`) with organization registration.
- [ ] **T3.4** Build `<ProtectedRoute />` guarding unauthorized routes and enforcing role permissions.
- [ ] **T3.5** Build `AppShell` layout:
  - Left navigation sidebar with active link highlights and role-based link filtering.
  - Topbar with organization title, active "Rules-Only" mode indicator, notifications bell, and user avatar.
- [ ] **T3.6** Add Demo Role Switcher in developer menu to toggle between Creator, Reviewer, Manager, and Admin roles for hackathon evaluation.

---

## Phase 4: Source of Truth Setup Screens

- [ ] **T4.1** **Rulebook Manager (`/source-of-truth/rules`)**:
  - Filterable table of rules (by category, severity, status).
  - Expandable row showing source citation (document, page, quote) and good/bad examples.
  - Active/Inactive toggle switch.
- [ ] **T4.2** **Rulebook Compiler Tab (`/source-of-truth/rules/compile`)**:
  - PDF/DOCX file dropzone with upload progress.
  - Proposed rules staging table with editable fields and "Approve Selected" batch action.
- [ ] **T4.3** **Facts Vault (`/source-of-truth/facts`)**:
  - Searchable table displaying claim statement, owner, source, and expiry date.
  - Expiry status pill: Active (Green), Expiring Soon (Amber), Expired (Red).
  - "Add Fact" modal with form validation.
  - CSV bulk import modal with preview table.
- [ ] **T4.4** **Terminology Manager (`/source-of-truth/terms`)**:
  - Preferred and Banned terms tabbed interface.
  - Inline term creation with case-sensitive and whole-word toggles.
- [ ] **T4.5** **Asset Library (`/source-of-truth/assets`)**:
  - Brand color palette swatches with live calculated WCAG contrast ratios.
  - Approved logo visual gallery with dimensions, clearance, and usage notes.

---

## Phase 5: Content Submission & Intent Lock

- [ ] **T5.1** Build `ContentSubmissionPage` (`/content/new`):
  - Radio toggle for content type: Plain Text, Social Post, Document, Image.
  - Rich text or markdown input area with live character and word counters.
  - Image uploader with preview for social posts.
  - Document file dropzone (PDF, DOCX) with client-side 20MB limit validation.
- [ ] **T5.2** Build `<IntentLockForm />` capturing Purpose, Target Audience, and Key Message.
- [ ] **T5.3** Wire submission mutation (`useCreateContent`) and route creator to Pre-Check workspace upon completion.

---

## Phase 6: Pre-Check & Interactive Finding Cards

- [ ] **T6.1** Build Split-View Workspace (`/content/:id`):
  - Left canvas: Document text renderer with interactive `<HighlightSegment />` elements.
  - Right rail: Sticky header with findings counts and filter tabs.
- [ ] **T6.2** Build `<FindingCard />`:
  - Severity badge, check type badge, flagged text quote.
  - Explanation and Proof section (rule quote or Claim Passport status).
  - Dimmed styling and "Needs human judgement" label for confidence < 0.75 (FC2.3).
  - Action buttons: `Accept Fix`, `Edit Fix`, `Dismiss`.
- [ ] **T6.3** Implement `<DismissalReasonModal />`:
  - Triggered on Dismiss click for Critical and Warning findings (FC1.2).
  - Predefined reason categories + mandatory justification textarea.
- [ ] **T6.4** Implement `<MeaningCheckDrawer />`:
  - 2-column comparison showing key message takeaways before vs. after applying a suggested fix.
- [ ] **T6.5** Implement `<AIDisclosurePanel />`:
  - Visible on every review (FC3.2).
  - Displays AI provider name, masked tokens report, and raw masked payload excerpt.
  - Displays "Rules-Only mode: No AI invoked" badge when active.
- [ ] **T6.6** Implement synchronized hover and click focus between text highlights and finding cards.

---

## Phase 7: Review Collaboration & Approvals

- [ ] **T7.1** Build `ReviewQueuePage` (`/review/queue`):
  - Table of drafts in `in_review` status.
  - Columns: Title, Author, Findings breakdown by severity, Submission date.
- [ ] **T7.2** Build `ReviewerWorkspacePage` (`/review/:id`):
  - Reviewer inspection layout showing unresolved issues and creator dismissals.
  - `<InlineComments />` thread component pinned to findings or paragraphs.
- [ ] **T7.3** Implement Decision Actions:
  - `Approve for Publication` button (strictly hidden if reviewer === author, FC1.3).
  - `Request Changes` button opening feedback modal.
- [ ] **T7.4** Build `<VersionDiffView />`:
  - Side-by-side or inline visual diff using `diff-match-patch`.
  - Additions in light green (`#DCFCE7`), deletions in light red (`#FEE2E2`).
  - Version comparison dropdown selector.

---

## Phase 8: Insights & Rule Health Dashboards

- [ ] **T8.1** Build `InsightsOverviewPage` (`/insights`):
  - KPI metric cards: Total Content Checked, First-Time Pass Rate, Avg Review Time, Unsupported Claims Blocked.
- [ ] **T8.2** Build `RuleHealthPage` (`/insights/rule-health`):
  - Disputed Rules table ordered by dispute rate (`dismissal_count / trigger_count`).
  - "Unclear Rule" warning indicators.
  - `<AiRewriteModal />` presenting suggested rule rewrites with "Adopt Rewrite" one-click updater.
- [ ] **T8.3** Build `RecurringMistakesPage` (`/insights/recurring`):
  - Visual breakdown by department, rule category, and weekly frequency trends.

---

## Phase 9: Export & Audit Record

- [ ] **T9.1** Build `<AuditRecordPreview />`:
  - Comprehensive view of document lifecycle: original text, all revisions, findings history, creator justifications, reviewer approvals, and AI disclosures.
- [ ] **T9.2** Wire `useExportPDF` hook to trigger client-side binary PDF download from backend.
- [ ] **T9.3** Provide printable CSS stylesheet (`@media print`) for browser-native printing fallback.

---

## Phase 10: Accessibility (WCAG AA), Quality & Golden Set Verification

- [ ] **T10.1** Keyboard shortcut navigation: Implement `J`/`K` (next/prev card), `A` (accept), `D` (dismiss), and `Escape` (close modal).
- [ ] **T10.2** Run automated accessibility audit with `@axe-core/react` across all key views; resolve any contrast, missing aria-label, or focus trap violations.
- [ ] **T10.3** Load mock brand dataset ("ApexCloud") into UI for instant offline/demo reliability.
- [ ] **T10.4** Validate UI presentation against 40-50 golden sample test drafts.
- [ ] **T10.5** Build and test production bundle with `vite build` and verify deployment to Vercel.
