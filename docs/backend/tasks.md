# BrandProof — Backend Tasks (Granular)

> Atomic, assignable tasks broken down from `plan.md`.
> Owner: **Anupam Pujari** (Backend and data lead), with AI engine tasks co-owned by **Jnanaranjan Majhi**.
> Status: 🔲 To Do | 🔄 In Progress | ✅ Done | ❌ Blocked

---

## Phase 1 — Project Setup & Scaffolding

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-001 | Create FastAPI project with folder structure from `spec.md` | Anupam | 🔲 | Use `pyproject.toml` for config |
| T-002 | Set up `requirements.txt` with all dependencies | Anupam | 🔲 | See dependency list below |
| T-003 | Create `.env.example` with all required env vars | Anupam | 🔲 | — |
| T-004 | Set up Supabase project (PostgreSQL, Auth, Storage) | Anupam | 🔲 | Enable pgvector extension |
| T-005 | Write initial SQL migration (`001_initial_schema.sql`) | Anupam | 🔲 | All tables from `data-model.md` |
| T-006 | Write pgvector migration (`002_enable_pgvector.sql`) | Anupam | 🔲 | — |
| T-007 | Write RLS policies migration (`003_rls_policies.sql`) | Anupam | 🔲 | — |
| T-008 | Set up Supabase client in `db/client.py` | Anupam | 🔲 | — |
| T-009 | Create `config.py` with pydantic-settings | Anupam | 🔲 | — |
| T-010 | Set up CORS middleware | Anupam | 🔲 | — |
| T-011 | Set up global error handler middleware | Anupam | 🔲 | — |
| T-012 | Create response envelope models (`common.py`) | Anupam | 🔲 | — |

### Required Dependencies

```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
supabase>=2.0.0
python-multipart>=0.0.6
sentence-transformers>=2.2.0
spacy>=3.7.0
textstat>=0.7.3
PyMuPDF>=1.23.0
python-docx>=1.1.0
python-pptx>=0.6.21
Pillow>=10.0.0
scikit-learn>=1.3.0
pytesseract>=0.3.10
diff-match-patch>=20230430
openai>=1.6.0
google-generativeai>=0.3.0
httpx>=0.25.0
pytest>=7.4.0
pytest-asyncio>=0.21.0
```

---

## Phase 2 — Auth & User Management

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-020 | Implement JWT validation middleware (`middleware/auth.py`) | Anupam | 🔲 | Extract `user_id`, `org_id`, `role` from JWT |
| T-021 | Create `get_current_user` dependency | Anupam | 🔲 | — |
| T-022 | Create `require_role()` dependency factory | Anupam | 🔲 | — |
| T-023 | Implement `POST /auth/signup` — create org + admin user | Anupam | 🔲 | — |
| T-024 | Implement `POST /auth/login` | Anupam | 🔲 | Delegate to Supabase Auth |
| T-025 | Implement `GET /users` — list org users | Anupam | 🔲 | — |
| T-026 | Implement `POST /users/invite` — invite user | Anupam | 🔲 | — |
| T-027 | Implement `PATCH /users/:id` — update role/status | Anupam | 🔲 | — |
| T-028 | Implement `GET /org/settings` | Anupam | 🔲 | — |
| T-029 | Implement `PATCH /org/settings` | Anupam | 🔲 | — |

---

## Phase 3 — Source-of-Truth CRUD

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-030 | Create `rule_repo.py` — all rule DB operations | Anupam | 🔲 | — |
| T-031 | Implement rules CRUD endpoints (GET, POST, PUT, PATCH status) | Anupam | 🔲 | — |
| T-032 | Implement `POST /rules/bulk-import` (CSV) | Anupam | 🔲 | — |
| T-033 | Create `fact_repo.py` — all fact DB operations | Anupam | 🔲 | — |
| T-034 | Implement facts CRUD endpoints | Anupam | 🔲 | — |
| T-035 | Implement `POST /facts/bulk-import` (CSV) | Anupam | 🔲 | — |
| T-036 | Implement `GET /facts/expiring` | Anupam | 🔲 | — |
| T-037 | Create `term_repo.py` + terms CRUD endpoints | Anupam | 🔲 | — |
| T-038 | Implement `POST /terms/bulk-import` (CSV) | Anupam | 🔲 | — |
| T-039 | Create `asset_repo.py` + assets endpoints | Anupam | 🔲 | File upload to Supabase Storage |
| T-040 | Implement signed URL generation for assets | Anupam | 🔲 | — |

---

## Phase 4 — Embedding Service

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-050 | Implement `embedder.py` — load model, generate embeddings | Jnanaranjan | 🔲 | `all-MiniLM-L6-v2` |
| T-051 | Generate and store embedding on rule create/update | Anupam | 🔲 | — |
| T-052 | Generate and store embedding on fact create/update | Anupam | 🔲 | — |
| T-053 | Implement `search.py` — pgvector cosine similarity query | Jnanaranjan | 🔲 | — |
| T-054 | Test: embed 10 sample facts, query with 5 claims, verify top matches | Jnanaranjan | 🔲 | PoC test |

---

## Phase 5 — Content & Version Management

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-060 | Create `content_repo.py` | Anupam | 🔲 | — |
| T-061 | Implement `POST /content` — create draft | Anupam | 🔲 | — |
| T-062 | Implement `GET /content` — list with filters | Anupam | 🔲 | — |
| T-063 | Implement `GET /content/:id` — detail view | Anupam | 🔲 | — |
| T-064 | Implement `PUT /content/:id` — update (creates new version) | Anupam | 🔲 | — |
| T-065 | Implement `GET /content/:id/versions` | Anupam | 🔲 | — |
| T-066 | Implement `GET /content/:id/versions/:v1/diff/:v2` | Anupam | 🔲 | diff-match-patch |
| T-067 | Implement content state machine transitions | Anupam | 🔲 | See `clarifications.md` C-05 |
| T-068 | Enforce self-approval check | Anupam | 🔲 | author_id ≠ approver_id |

---

## Phase 6 — Review Engine (Fixed Checks)

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-070 | Implement `orchestrator.py` — run checks, collect findings | Jnanaranjan | 🔲 | — |
| T-071 | Implement terminology check (spaCy PhraseMatcher) | Jnanaranjan | 🔲 | — |
| T-072 | Implement banned-word check | Jnanaranjan | 🔲 | — |
| T-073 | Implement required-text check | Jnanaranjan | 🔲 | — |
| T-074 | Implement readability check (textstat) | Jnanaranjan | 🔲 | — |
| T-075 | Implement colour palette check (Pillow + sklearn) | Jnanaranjan | 🔲 | — |
| T-076 | Implement WCAG contrast check | Jnanaranjan | 🔲 | — |
| T-077 | Implement alt-text check | Jnanaranjan | 🔲 | — |
| T-078 | Implement image resolution check | Jnanaranjan | 🔲 | — |
| T-079 | Implement link text check | Jnanaranjan | 🔲 | — |

---

## Phase 7 — Review Engine (AI Checks)

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-080 | Implement `masking.py` — MaskingService | Jnanaranjan | 🔲 | — |
| T-081 | Implement `base.py` — AIService ABC | Jnanaranjan | 🔲 | — |
| T-082 | Implement `openai_provider.py` | Jnanaranjan | 🔲 | — |
| T-083 | Implement `gemini_provider.py` | Jnanaranjan | 🔲 | — |
| T-084 | Implement AI response Pydantic schemas (`ai_response.py`) | Jnanaranjan | 🔲 | — |
| T-085 | Implement tone check (AI) | Jnanaranjan | 🔲 | — |
| T-086 | Implement Claim Passport — claim extraction | Jnanaranjan | 🔲 | — |
| T-087 | Implement Claim Passport — fact matching via embeddings | Jnanaranjan | 🔲 | — |
| T-088 | Implement Claim Passport — expiry check | Jnanaranjan | 🔲 | — |
| T-089 | Implement suggestion generation with Intent Lock | Jnanaranjan | 🔲 | — |
| T-090 | Implement AI disclosure record creation | Anupam | 🔲 | — |
| T-091 | Implement `POST /content/:id/check` endpoint | Anupam | 🔲 | Triggers orchestrator |
| T-092 | Implement `GET /content/:id/check-status` endpoint | Anupam | 🔲 | — |

---

## Phase 8 — Workflow & Collaboration

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-100 | Implement `POST /content/:id/submit-for-review` | Anupam | 🔲 | — |
| T-101 | Implement `POST /content/:id/approve` | Anupam | 🔲 | Self-approval guard |
| T-102 | Implement finding resolution endpoint (accept/edit/dismiss) | Anupam | 🔲 | Reason required for critical/warning |
| T-103 | Implement review decision endpoint | Anupam | 🔲 | — |
| T-104 | Implement comments CRUD | Anupam | 🔲 | — |
| T-105 | Implement audit log writing on all state changes | Anupam | 🔲 | — |
| T-106 | Implement notification creation triggers | Anupam | 🔲 | — |
| T-107 | Implement notifications endpoints (list, mark read) | Anupam | 🔲 | — |
| T-108 | Implement AI disclosure endpoint | Anupam | 🔲 | — |

---

## Phase 9 — Document Parsing

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-110 | Implement `parser_factory.py` — route by file type | Anupam | 🔲 | — |
| T-111 | Implement `pdf_parser.py` (PyMuPDF) | Anupam | 🔲 | — |
| T-112 | Implement `docx_parser.py` (python-docx) | Anupam | 🔲 | — |
| T-113 | Implement `image_parser.py` (Pillow + Tesseract OCR) | Anupam | 🔲 | — |
| T-114 | Implement `pptx_parser.py` (python-pptx) | Anupam | 🔲 | Should priority |
| T-115 | Integrate parsing into review pipeline (content → extracted → checked) | Anupam | 🔲 | — |

---

## Phase 10 — Rulebook Compiler

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-120 | Design compiler prompt for PDF → proposed rules | Jnanaranjan | 🔲 | — |
| T-121 | Implement `POST /rules/compile` endpoint | Anupam | 🔲 | — |
| T-122 | Parse PDF, extract text by page | Anupam | 🔲 | Reuse pdf_parser |
| T-123 | Send extracted text to AI, get proposed rules | Jnanaranjan | 🔲 | — |
| T-124 | Validate proposed rules, store as `status = draft` | Anupam | 🔲 | — |

---

## Phase 11 — Insights & Export

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-130 | Implement Rule Health events tracking | Anupam | 🔲 | Write on finding resolution |
| T-131 | Implement `GET /insights/rule-health` | Anupam | 🔲 | — |
| T-132 | Implement `GET /insights/recurring-mistakes` | Anupam | 🔲 | — |
| T-133 | Implement `GET /insights/dashboard` | Anupam | 🔲 | — |
| T-134 | Implement `GET /content/:id/export/pdf` | Anupam | 🔲 | Should priority |
| T-135 | Implement meaning check (before/after key points) | Jnanaranjan | 🔲 | — |

---

## Phase 12 — Testing & Quality

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-140 | Write unit tests for all fixed checks | Jnanaranjan | 🔲 | — |
| T-141 | Write unit tests for masking service | Jnanaranjan | 🔲 | — |
| T-142 | Write integration tests for auth endpoints | Anupam | 🔲 | — |
| T-143 | Write integration tests for rules/facts/terms CRUD | Anupam | 🔲 | — |
| T-144 | Write integration tests for content workflow | Anupam | 🔲 | — |
| T-145 | Build golden test set (40–50 fixtures) | Both | 🔲 | — |
| T-146 | Build golden test runner with metric reporting | Jnanaranjan | 🔲 | — |
| T-147 | Tune AI prompts for detection ≥80%, precision ≥80% | Jnanaranjan | 🔲 | — |

---

## Phase 13 — Deployment

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-150 | Write `Dockerfile` | Anupam | 🔲 | — |
| T-151 | Write `docker-compose.yml` (backend + local Supabase) | Anupam | 🔲 | — |
| T-152 | Deploy to Render | Anupam | 🔲 | — |
| T-153 | Set up environment variables on Render | Anupam | 🔲 | — |
| T-154 | Create demo data seeding script | Both | 🔲 | Fictional company data |
| T-155 | Verify end-to-end on deployed instance | Anupam | 🔲 | — |
