# BrandProof — Backend Clarifications & Design Decisions

> Decisions and clarifications that resolve ambiguity in the raw requirements.
> Each item references the raw-requirements section it resolves.

---

## C-01 · Database Choice: PostgreSQL via Supabase

**From:** raw-requirements §13

**Decision:** Use **Supabase (PostgreSQL)** as specified in the planning document, **not** MongoDB or MySQL.

**Rationale:**
- The planning document explicitly names Supabase with PostgreSQL, Auth, Storage, and row-level security (RLS).
- **pgvector** extension is needed for semantic search — native to PostgreSQL.
- RLS provides workspace isolation per-organisation without custom middleware.
- Supabase Auth handles signup, login, JWT, and role-based access out of the box.
- Supabase Storage handles file uploads with expiring signed URLs (needed for privacy).

**Conclusion:** PostgreSQL (via Supabase) is the best and specified fit. No reason to override.

---

## C-02 · Row-Level Security Strategy

**From:** raw-requirements §8, §9

**Decision:** Every table that stores organisation-specific data includes an `org_id` column. RLS policies enforce that users can only access rows matching their JWT's `org_id` claim.

**Key rules:**
- A user belongs to exactly one organisation (MVP scope).
- The `role` claim in the JWT determines read/write permissions per table.
- Admin role cannot approve content unless also assigned the reviewer role on that content item.
- No user can approve content where they are the author (`author_id ≠ approver_id`).

---

## C-03 · AI Provider Abstraction

**From:** raw-requirements §4.2, §4.3

**Decision:** AI calls are wrapped in a single `AIService` interface with one method per check type (tone, claim support, suggestion). The provider (OpenAI, Gemini, local model, etc.) is configured per-organisation and can be swapped without changing any calling code.

**Key rules:**
- Every AI call passes through a **masking step** first.
- Every AI response is validated against a **Pydantic model** that enforces the fixed JSON schema.
- If validation fails, the finding is silently discarded (not surfaced to the user).
- A `"rules_only"` org setting bypasses all AI calls entirely.

---

## C-04 · Masking Strategy

**From:** raw-requirements §9

**Decision:** Before any external AI call, a `MaskingService` replaces:
- Text tagged as confidential → `[CONFIDENTIAL_1]`, `[CONFIDENTIAL_2]`, …
- Email addresses → `[EMAIL_1]`, `[EMAIL_2]`, …
- Phone numbers → `[PHONE_1]`, `[PHONE_2]`, …

A mapping is stored per-review so the AI response can be **unmasked** for display.

The exact masked text and mapping are saved in the `ai_disclosure` record for that review.

---

## C-05 · Content State Machine

**From:** raw-requirements §7

**Decision:** Content items follow a strict state machine:

```
DRAFT → CHECKING → CHECKED → IN_REVIEW → CHANGES_REQUESTED → CHECKING → … → APPROVED
```

| Transition | Triggered by |
|---|---|
| DRAFT → CHECKING | Creator submits for check |
| CHECKING → CHECKED | All checks complete |
| CHECKED → DRAFT | Creator wants to edit more |
| CHECKED → IN_REVIEW | Creator submits for review |
| IN_REVIEW → CHANGES_REQUESTED | Reviewer requests changes |
| CHANGES_REQUESTED → DRAFT | Creator picks it back up |
| IN_REVIEW → APPROVED | Brand manager gives final approval |

---

## C-06 · Embedding Generation & Storage

**From:** raw-requirements §12

**Decision:**
- Embeddings are generated on the backend using `sentence-transformers` (`all-MiniLM-L6-v2`), which runs on CPU.
- Embeddings are stored in a `vector(384)` column using the **pgvector** extension.
- Rules, facts, and terminology entries all have embeddings.
- At review time, each claim extracted from the draft is embedded and compared against the facts table via cosine similarity.

**Performance note:** Embedding generation is synchronous for MVP. If too slow, we'll add a background queue (Celery or similar) in Round 3.

---

## C-07 · Document Parsing Pipeline

**From:** raw-requirements §3

**Decision:** Document parsing produces a unified `ExtractedContent` model:

```python
class ExtractedContent:
    text_blocks: list[TextBlock]     # paragraphs/headings with position info
    images: list[ExtractedImage]     # image bytes + OCR text + position
    metadata: dict                    # title, author, page count, etc.
```

| Format | Library | Extraction |
|---|---|---|
| PDF | PyMuPDF (fitz) | Text + embedded images |
| DOCX | python-docx | Paragraphs, headings, inline images |
| PPTX | python-pptx | Per-slide text + images (Should priority) |
| Images | Pillow + Tesseract | OCR text + image metadata |

---

## C-08 · Finding Severity Levels

**From:** raw-requirements §4

**Decision:** Three severity levels:

| Level | Meaning | Dismissal |
|---|---|---|
| **Critical** | Factual error, banned term, accessibility failure | Must provide a written reason to dismiss |
| **Warning** | Tone mismatch, readability concern, outdated claim | Must provide a written reason to dismiss |
| **Info** | Style suggestion, minor improvement | Can dismiss without reason |

---

## C-09 · API Authentication & Authorization

**From:** raw-requirements §8

**Decision:**
- Authentication via **Supabase Auth** (JWT tokens).
- Frontend sends the JWT in the `Authorization: Bearer <token>` header.
- FastAPI middleware validates the JWT and extracts `user_id`, `org_id`, and `role`.
- Endpoint-level decorators check the required role.
- Database-level RLS provides a second layer of isolation.

---

## C-10 · File Storage Strategy

**From:** raw-requirements §9

**Decision:**
- All uploaded files (PDFs, DOCX, images, logos) are stored in **Supabase Storage**.
- Bucket structure: `{org_id}/uploads/`, `{org_id}/assets/`, `{org_id}/exports/`.
- Access via **signed URLs** with a configurable expiry (default 1 hour).
- Files are never served directly; the backend generates signed URLs on demand.

---

## C-11 · "Rules Only" Mode

**From:** raw-requirements §9

**Decision:**
- When an organisation or a specific review has `rules_only_mode = true`, the review engine skips all AI checks.
- Only fixed checks run: terminology, banned words, readability, colour, contrast, alt text, image resolution.
- The disclosure panel shows "No external AI service was used" for these reviews.
- This is a per-org setting that can be overridden per-review by the creator.

---

## C-12 · Notification Strategy (MVP)

**From:** raw-requirements §11

**Decision for MVP (Must):**
- **In-app notifications** stored in a `notifications` table, polled by the frontend.
- Notifications triggered on: review submitted, changes requested, approved, comment added, fact expiring.

**Should (Round 3):**
- PDF approval record export via backend endpoint.

**Could (post-hackathon):**
- Email notifications via a service like Resend or SendGrid.

---

## C-13 · Golden Test Set Integration

**From:** raw-requirements §15

**Decision:**
- Golden set stored as JSON fixtures in the repo under `tests/golden/`.
- Each fixture has: input content, expected findings (with rule/fact IDs), and expected labels.
- `pytest` suite runs the full review pipeline against each fixture.
- Metrics tracked: detection rate, precision, explainability score.
- Run as part of CI and before any demo.
