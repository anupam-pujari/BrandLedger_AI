# BrandProof — Backend Raw Requirements

> Extracted from **planing.txt** (Round 1 Plan).
> This file captures every backend-relevant need exactly as stated in the planning document. No interpretation has been added yet; that happens in `clarifications.md`.

---

## 1. Core Mission

BrandProof is a brand-governance platform that checks content against **approved sources** before publication, proves every finding, and leaves each final decision to a human.

---

## 2. Source-of-Truth Data the Backend Must Manage

| Data entity | Key attributes | Notes |
|---|---|---|
| **Rulebook** | Rule ID, category (tone / terminology / messaging / visual / accessibility / claims), severity, source page & quote, one good example, one bad example | Proposed by Rulebook Compiler, edited & approved by manager |
| **Approved Facts Vault** | Fact ID, content, owner, source document, "valid until" date | CSV import supported |
| **Terminology list** | Preferred terms, banned terms, spellings, capitalisation, notes | — |
| **Asset library** | Logos, colour palette (hex values), fonts, approved images, usage notes | Files stored in Supabase Storage |

---

## 3. Content Formats the Backend Must Accept

| Format | Handling | Priority |
|---|---|---|
| Plain text, social posts, emails | Direct text review; social posts pair a caption with an image | Must |
| DOCX and text-based PDF | Text and headings extracted, then reviewed as text | Must |
| Images (PNG, JPG) | OCR for text; palette, size, contrast checked; alt-text field | Must |
| PowerPoint slides | Text and images extracted slide by slide | Should |
| Video and audio | Transcript pasted as text only | Later |

---

## 4. Review Engine Requirements

### 4.1 Fixed (Code-Based) Checks

| Check | Libraries mentioned |
|---|---|
| Terminology, banned-word, required-text (e.g. legal disclaimer) | spaCy PhraseMatcher, regular expressions |
| Readability level | textstat |
| Colour palette match | scikit-learn (dominant colours), Pillow |
| WCAG colour contrast | WCAG contrast formula |
| Missing alt text | — |
| Image resolution | Pillow |
| Vague link text | — |

### 4.2 AI-Assisted Checks (via hosted LLM API)

| Check | Notes |
|---|---|
| Tone check against rulebook good/bad examples | Must follow fixed JSON output format naming a rule ID |
| Claim Passport — claim extraction, fact matching, expiry check | Each claim matched against Approved Facts Vault |
| Suggested fixes with Intent Lock constraints | Purpose, audience, key message as constraints |

### 4.3 AI Constraints

- Every AI answer must follow a **fixed JSON format** naming a rule ID or fact ID.
- Every quoted piece of evidence must appear **word for word** in the draft or source.
- Low-confidence findings are labelled **"needs human judgement"**, not stated as fact.
- A finding without a valid ID is **discarded**.

---

## 5. Claim Passport Workflow

1. Extract each factual/promotional claim from the draft.
2. Search the Approved Facts Vault (using semantic embeddings).
3. Label each claim: **supported**, **outdated** (fact expired), **conflicting**, or **unsupported**.

---

## 6. Intent Lock

- Creator states: **purpose**, **audience**, **key message** once per draft.
- Suggestions must keep that intent.
- A **meaning check** shows what would change before anything is applied.
- Uses diff-match-patch for side-by-side change view.

---

## 7. Content Lifecycle (Backend Must Support)

1. **Draft** — creator submits content + Intent Lock fields.
2. **Prepare** — extract text (including OCR), mask confidential items, show what goes to AI.
3. **Pre-check** — run fixed checks, then AI checks; return findings sorted by severity.
4. **Fix** — creator accepts/edits/dismisses findings; re-check on changes.
5. **Review** — reviewers see flagged items + changes since last version; comment/approve/request-changes.
6. **Approve** — brand manager gives final approval; content becomes "Approved for publication"; full history saved.

---

## 8. Roles & Permissions

| Role | Can do | Cannot do |
|---|---|---|
| Creator (staff or agency) | Submit content, resolve findings, comment | Approve content; change rules or facts |
| Reviewer (legal, product, etc.) | Review assigned content, approve or request changes, comment | Change rules or facts |
| Brand manager | Final approval, edit/approve rules and facts, view insights | Manage users or privacy settings |
| Admin | Manage users, roles, privacy and AI-use settings | Approve content unless also assigned as reviewer |

**Rule:** No one can approve their own content.

---

## 9. Privacy & Security Requirements

- **Workspace isolation** — each organisation's data isolated by row-level security.
- **Confidential tags** — items tagged confidential.
- **Masking** — before any external AI call, replace confidential text, emails, phone numbers with placeholders.
- **AI-use disclosure panel** — every review shows provider used, exact masked text sent, and time.
- **"Rules only" mode** — all fixed checks, no external AI call.
- **Secret keys** stay on the server, never in the browser.
- Findings are labelled **"Rule check"** or **"AI-assisted"**.
- Files in private storage with **expiring links**.

---

## 10. Rule Health & Learning Loop

- Log every finding, dismissal, override, and repeated trigger.
- Surface rules that are often disputed as **"unclear"**.
- Propose clearer wording for unclear rules.
- **Recurring-mistakes dashboard** by rule, category, and team.
- **Fact-expiry alerts** for owners.

---

## 11. Version History & Audit

- Side-by-side comparison between drafts (diff-match-patch).
- Full history: versions, comments, decisions, AI use.
- PDF approval record export.
- In-app notifications (Should), email notifications (Could).

---

## 12. Search & Embeddings

- **Sentence-transformers** embeddings (`all-MiniLM-L6-v2`, runs on CPU).
- **pgvector** in PostgreSQL for nearest-neighbour search.
- Used to find nearest rules and facts for each claim.

---

## 13. Technology Stack (as specified in planning)

| Layer | Choice |
|---|---|
| Language | Python |
| Framework | FastAPI |
| Database & Auth & Storage | Supabase (PostgreSQL, Auth, Storage) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) + pgvector |
| AI reasoning | Hosted LLM API, structured JSON output |
| Fixed text checks | spaCy PhraseMatcher, regex, textstat |
| Document parsing | PyMuPDF (PDF), python-docx (DOCX), python-pptx (slides) |
| Image processing | Pillow, scikit-learn (dominant colours), WCAG contrast formula, Tesseract OCR |
| Version comparison | diff-match-patch |
| Deployment | Render, Docker for local setup |
| Testing | pytest |

---

## 14. Deployment & Hosting

- **Render** for backend.
- **Docker** for local development setup.
- Free tiers sufficient for demo.

---

## 15. Golden Test Set

- 40–50 sample drafts with known issues.
- Measure: detection rate (≥80%), precision (≥80%), explainability (100%), review time comparison.

---

## 16. Out of Scope (Backend)

- Direct publishing to social platforms or CMS.
- Video/audio review beyond pasted transcript.
- Training a custom AI model.
- Languages other than English.
- Single sign-on.
- Mobile app API (no mobile app planned).
