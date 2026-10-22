# BrandProof — Frontend Raw Requirements

> Extracted from **planing.txt** (Round 1 Plan).
> Captures every frontend-relevant need. No interpretation — that happens in `frontend-clarifications.md`.

---

## 1. Core Mission

Build a single React app that serves all four user roles (Creator, Reviewer, Brand Manager, Admin) with role-based views. The interface should teach creators as it checks, not just reject content.

---

## 2. Technology Stack (as specified in planning)

| Choice | Reason from plan |
|---|---|
| **React** | One app serves all four roles |
| **Vite** | Fast to build |
| **Tailwind CSS** | Fast styling |

> **Note:** Tailwind is specified in the planning document. This will be used as-is.

---

## 3. User Roles & What They See

| Role | Primary Screens | Key Actions |
|---|---|---|
| **Creator** (staff or agency) | Submit content, view findings, fix issues, comment | Accept/edit/dismiss suggestions, submit for review |
| **Reviewer** (legal, product) | Review queue, flagged items, comments | Approve or request changes |
| **Brand Manager** | Setup screens, approval queue, insights dashboard | Manage rules/facts/terms/assets, final approval, view Rule Health |
| **Admin** | User management, org settings, privacy settings | Invite users, set roles, configure AI and masking |

---

## 4. Screens Required

### 4.1 Setup Screens (Brand Manager)

| Screen | Purpose |
|---|---|
| **Rulebook Manager** | View, create, edit, approve/reject rules. Filter by category, status, severity. Show source quote and examples. |
| **Rulebook Compiler** | Upload guideline PDF/DOCX → see proposed rules → edit and approve each |
| **Facts Vault** | CRUD for approved facts. Show owner, source, expiry date. CSV import. Expiry alerts. |
| **Terminology Manager** | CRUD for preferred/banned terms. CSV import. Case-sensitivity toggle. |
| **Asset Library** | Upload logos, colour palette, fonts, images. Show usage notes. Visual gallery. |

### 4.2 Content Workflow Screens (Creator → Reviewer → Manager)

| Screen | Purpose |
|---|---|
| **Submit Content** | Paste text or upload file. Select content type. Fill Intent Lock (purpose, audience, key message). |
| **Pre-check Results** | Show findings sorted by severity. Finding cards with: what, why, rule/fact, proof, severity, confidence. |
| **Fix & Resolve** | Accept, edit, or dismiss each finding. Reason required for critical/warning dismissals. Meaning check showing before/after. |
| **Review Queue** | List content awaiting review. Show status, author, finding counts. |
| **Review Detail** | Show flagged items + changes since last version. Comments on findings. Approve or request changes. |
| **Approval & History** | Version history with side-by-side diff. Full audit trail. AI disclosure panel. |

### 4.3 Insights Screens (Brand Manager)

| Screen | Purpose |
|---|---|
| **Dashboard** | Total content checked, approval rate, avg review time, top issues |
| **Rule Health** | Dispute and override rates per rule. "Unclear rule" flags. Suggested rewrites. |
| **Recurring Mistakes** | Breakdown by rule, category, team. Trends over time. |

### 4.4 Admin Screens

| Screen | Purpose |
|---|---|
| **User Management** | Invite users, assign roles, activate/deactivate |
| **Organisation Settings** | AI provider choice, masking config, rules-only mode |

---

## 5. Key UI Components

### 5.1 Finding Card

The central UI element. Must show at a glance:

| Element | Content |
|---|---|
| **Severity badge** | Critical (red), Warning (amber), Info (blue) |
| **Check type badge** | "Rule check" or "AI-assisted" |
| **Title** | Short description of the issue |
| **Flagged text** | The exact text that was flagged, highlighted |
| **Why** | Explanation of why this is an issue |
| **Proof** | The rule or fact that backs up the finding, with source reference |
| **Confidence** | For AI findings, shown as a bar or percentage |
| **Suggested fix** | Optional, with accept/edit/dismiss buttons |
| **"Needs human judgement"** | Dimmed styling for low-confidence findings |

### 5.2 Intent Lock Panel

- Three fields: purpose, audience, key message.
- Filled once per content item.
- Shown read-only during review.
- Meaning check: side-by-side key points before and after a suggested change.

### 5.3 AI Disclosure Panel

- Shown on every review.
- Shows: provider used, exact masked text sent, timestamp.
- "No external AI service was used" for rules-only mode.
- Expandable/collapsible.

### 5.4 Version Diff View

- Side-by-side comparison of any two versions.
- Additions in green, deletions in red (diff-match-patch).
- Version selector dropdown.

### 5.5 Review Queue

- Table/list of content items with status = `in_review`.
- Columns: title, author, content type, findings (count by severity), submitted date.
- Click to open review detail.

---

## 6. Content Formats Supported

| Format | Upload Method | Preview |
|---|---|---|
| Plain text | Paste into textarea | Rendered text |
| Social post | Caption textarea + image upload | Caption + image preview |
| Email | Paste or upload | Rendered text |
| PDF | File upload | Extracted text preview |
| DOCX | File upload | Extracted text preview |
| Image | File upload | Image preview + OCR text |
| PPTX (Should) | File upload | Per-slide text + image preview |

---

## 7. Accessibility Requirements

The frontend itself must pass the accessibility checks that BrandProof enforces on user content:

- WCAG 2.1 AA colour contrast.
- All images have alt text.
- Keyboard navigable.
- Screen reader friendly (semantic HTML, ARIA labels).
- Focus management on modals and overlays.

---

## 8. Notifications

| Type | Trigger | Display |
|---|---|---|
| Review submitted | Creator submits content | Notification bell + count badge |
| Changes requested | Reviewer requests changes | — |
| Content approved | Brand manager approves | — |
| Comment added | Any user comments | — |
| Fact expiring | Fact within 30 days of expiry | Alert banner + notification |

---

## 9. Deployment

- **Vercel** for frontend hosting.
- Free tier sufficient for demo.
- Environment variable: `VITE_API_URL` pointing to the Render backend.

---

## 10. Out of Scope (Frontend)

- Mobile-responsive design (nice to have, not required for demo).
- Internationalisation (English only).
- Dark mode (Could priority).
- Offline support.
- Direct publishing interface.
