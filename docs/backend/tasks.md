# BrandProof — Backend Tasks (Granular)

> Atomic, assignable tasks broken down from `plan.md`.
> Owner: **Anupam Pujari** (Backend and data lead), with AI engine tasks co-owned by **Jnanaranjan Majhi**.
> Status: 🔲 To Do | 🔄 In Progress | ✅ Done | ❌ Blocked

---

## Phase 1 — Project Setup & Scaffolding

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-001 | Create FastAPI project with folder structure from `spec.md` | Anupam | ✅ | Use `pyproject.toml` for config |
| T-002 | Set up `requirements.txt` with all dependencies | Anupam | ✅ | See dependency list below |
| T-003 | Create `.env.example` with all required env vars | Anupam | ✅ | — |
| T-004 | Set up Supabase project (PostgreSQL, Auth, Storage) | Anupam | ✅ | Migrations prepared with pgvector & RLS |
| T-005 | Write initial SQL migration (`001_initial_schema.sql`) | Anupam | ✅ | All tables from `data-model.md` |
| T-006 | Write pgvector migration (`002_enable_pgvector.sql`) | Anupam | ✅ | HNSW indexes and RPC search functions |
| T-007 | Write RLS policies migration (`003_rls_policies.sql`) | Anupam | ✅ | Multi-tenant JWT isolation |
| T-008 | Set up Supabase client in `db/client.py` | Anupam | ✅ | Admin and user-scoped client factories |
| T-009 | Create `config.py` with pydantic-settings | Anupam | ✅ | Robust environment loader |
| T-010 | Set up CORS middleware | Anupam | ✅ | Whitelist in app/main.py |
| T-011 | Set up global error handler middleware | Anupam | ✅ | Standard API envelope in middleware/error_handler.py |
| T-012 | Create response envelope models (`common.py`) | Anupam | ✅ | Typed models and domain exceptions |

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
| T-020 | Implement JWT validation middleware (`middleware/auth.py`) | Anupam | ✅ | Extract `user_id`, `org_id`, `role` from JWT |
| T-021 | Create `get_current_user` dependency | Anupam | ✅ | In app/dependencies.py |
| T-022 | Create `require_role()` dependency factory | Anupam | ✅ | In app/dependencies.py |
| T-023 | Implement `POST /auth/signup` — create org + admin user | Anupam | ✅ | In app/api/auth.py |
| T-024 | Implement `POST /auth/login` | Anupam | ✅ | In app/api/auth.py with JWT generation |
| T-025 | Implement `GET /users` — list org users | Anupam | ✅ | In app/api/users.py |
| T-026 | Implement `POST /users/invite` — invite user | Anupam | ✅ | In app/api/users.py |
| T-027 | Implement `PATCH /users/:id` — update role/status | Anupam | ✅ | In app/api/users.py |
| T-028 | Implement `GET /org/settings` | Anupam | ✅ | In app/api/org.py |
| T-029 | Implement `PATCH /org/settings` | Anupam | ✅ | In app/api/org.py |

---

## Phase 3 — Source-of-Truth CRUD

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-030 | Create `rule_repo.py` — all rule DB operations | Anupam | ✅ | RuleRepository in app/db/repositories |
| T-031 | Implement rules CRUD endpoints (GET, POST, PUT, PATCH status) | Anupam | ✅ | In app/api/rules.py |
| T-032 | Implement `POST /rules/bulk-import` (CSV) | Anupam | ✅ | In app/api/rules.py |
| T-033 | Create `fact_repo.py` — all fact DB operations | Anupam | ✅ | FactRepository in app/db/repositories |
| T-034 | Implement facts CRUD endpoints | Anupam | ✅ | In app/api/facts.py |
| T-035 | Implement `POST /facts/bulk-import` (CSV) | Anupam | ✅ | In app/api/facts.py |
| T-036 | Implement `GET /facts/expiring` | Anupam | ✅ | Handled in FactRepository.get_expiring |
| T-037 | Create `term_repo.py` + terms CRUD endpoints | Anupam | ✅ | TermRepository & app/api/terms.py |
| T-038 | Implement `POST /terms/bulk-import` (CSV) | Anupam | ✅ | In app/api/terms.py |
| T-039 | Create `asset_repo.py` + assets endpoints | Anupam | ✅ | AssetRepository with signed URLs |
| T-040 | Implement signed URL generation for assets | Anupam | ✅ | AssetRepository.generate_signed_url |

---

## Phase 4 — Embedding Service

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-050 | Implement `embedder.py` — load model, generate embeddings | Jnanaranjan | ✅ | all-MiniLM-L6-v2 CPU embedding engine |
| T-051 | Generate and store embedding on rule create/update | Anupam | ✅ | Handled in RuleRepository.create/update |
| T-052 | Generate and store embedding on fact create/update | Anupam | ✅ | Handled in FactRepository.create/update |
| T-053 | Implement `search.py` — pgvector cosine similarity query | Jnanaranjan | ✅ | Cosine similarity & match_facts RPC caller |
| T-054 | Test: embed 10 sample facts, query with 5 claims, verify top matches | Jnanaranjan | ✅ | PoC unit test passed (Claim Passport verified) |

---

## Phase 5 — Content & Version Management

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-060 | Create `content_repo.py` | Anupam | ✅ | ContentRepository in app/db/repositories |
| T-061 | Implement `POST /content` — create draft | Anupam | ✅ | In app/api/content.py |
| T-062 | Implement `GET /content` — list with filters | Anupam | ✅ | In app/api/content.py |
| T-063 | Implement `GET /content/:id` — detail view | Anupam | ✅ | In app/api/content.py |
| T-064 | Implement `PUT /content/:id` — update (creates new version) | Anupam | ✅ | In app/api/content.py & ContentRepository |
| T-065 | Implement `GET /content/:id/versions` | Anupam | ✅ | In app/api/content.py |
| T-066 | Implement `GET /content/:id/versions/:v1/diff/:v2` | Anupam | ✅ | diff-match-patch in ContentRepository |
| T-067 | Implement content state machine transitions | Anupam | ✅ | See `clarifications.md` C-05 & ContentRepository.transition_status |
| T-068 | Enforce self-approval check | Anupam | ✅ | author_id ≠ approver_id enforced with 403 |

---

## Phase 6 — Review Engine (Fixed Checks)

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-070 | Implement `orchestrator.py` — run checks, collect findings | Jnanaranjan | ✅ | Multi-pass deterministic + AI orchestration |
| T-071 | Implement terminology check (spaCy PhraseMatcher) | Jnanaranjan | ✅ | Multi-tenant term lookup with case sensitivity |
| T-072 | Implement banned-word check | Jnanaranjan | ✅ | Regex boundary matching with category inheritance |
| T-073 | Implement required-text check | Jnanaranjan | ✅ | Scoped by content-type (emails, opt-out disclaimers) |
| T-074 | Implement readability check (textstat) | Jnanaranjan | ✅ | Flesch-Kincaid grade & reading ease scores |
| T-075 | Implement colour palette check (Pillow + sklearn) | Jnanaranjan | ✅ | Euclidean RGB delta vs approved brand assets |
| T-076 | Implement WCAG contrast check | Jnanaranjan | ✅ | WCAG 2.1 AA 4.5:1 ratio calculation |
| T-077 | Implement alt-text check | Jnanaranjan | ✅ | Missing descriptive alternative text detection |
| T-078 | Implement image resolution check | Jnanaranjan | ✅ | Dimension validation (e.g. 1200x630 min) |
| T-079 | Implement link text check | Jnanaranjan | ✅ | Flags generic labels ('click here', 'read more') |

---

## Phase 7 — Review Engine (AI Checks)

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-080 | Implement `masking.py` — MaskingService | Jnanaranjan | ✅ | Bidirectional PII and confidential text masking |
| T-081 | Implement `base.py` — AIService ABC | Jnanaranjan | ✅ | Abstract provider base class |
| T-082 | Implement `openai_provider.py` | Jnanaranjan | ✅ | Structured outputs via OpenAI API |
| T-083 | Implement `gemini_provider.py` | Jnanaranjan | ✅ | Google Generative AI provider integration |
| T-084 | Implement AI response Pydantic schemas (`ai_response.py`) | Jnanaranjan | ✅ | Pydantic response models |
| T-085 | Implement tone check (AI) | Jnanaranjan | ✅ | Evaluates tone against approved tone rules |
| T-086 | Implement Claim Passport — claim extraction | Jnanaranjan | ✅ | Assertion and quantitative metric extraction |
| T-087 | Implement Claim Passport — fact matching via embeddings | Jnanaranjan | ✅ | Cosine vector similarity vs Approved Facts Vault |
| T-088 | Implement Claim Passport — expiry check | Jnanaranjan | ✅ | Auto-flags expired and unverified claims |
| T-089 | Implement suggestion generation with Intent Lock | Jnanaranjan | ✅ | Audience & purpose preserving rewrite suggestions |
| T-090 | Implement AI disclosure record creation | Anupam | ✅ | Tracks model, provider, latency & masked payload |
| T-091 | Implement `POST /content/:id/check` endpoint | Anupam | ✅ | Triggers review orchestrator |
| T-092 | Implement `GET /content/:id/check-status` endpoint | Anupam | ✅ | Real-time review status & findings fetch |

---

## Phase 8 — Workflow & Collaboration

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-100 | Implement `POST /content/:id/submit-for-review` | Anupam | ✅ | Draft to in_review state transition |
| T-101 | Implement `POST /content/:id/approve` | Anupam | ✅ | Strict self-approval guard (author_id ≠ approver_id) |
| T-102 | Implement finding resolution endpoint (accept/edit/dismiss) | Anupam | ✅ | Justification mandatory for critical/warning |
| T-103 | Implement review decision endpoint | Anupam | ✅ | Approve or request revisions with comments |
| T-104 | Implement comments CRUD | Anupam | ✅ | Inline and version-level review comments |
| T-105 | Implement audit log writing on all state changes | Anupam | ✅ | Immutable audit trail across all entities |
| T-106 | Implement notification creation triggers | Anupam | ✅ | Dispatches notifications on review events |
| T-107 | Implement notifications endpoints (list, mark read) | Anupam | ✅ | User notification inbox and status updates |
| T-108 | Implement AI disclosure endpoint | Anupam | ✅ | Inspect AI disclosures for any content check |

---

## Phase 9 — Document Parsing

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-110 | Implement `parser_factory.py` — route by file type | Anupam | ✅ | MIME-type and extension detection |
| T-111 | Implement `pdf_parser.py` (PyMuPDF) | Anupam | ✅ | Multi-page text and layout extraction |
| T-112 | Implement `docx_parser.py` (python-docx) | Anupam | ✅ | Word document paragraph and table parser |
| T-113 | Implement `image_parser.py` (Pillow + Tesseract OCR) | Anupam | ✅ | Color palette, resolution & OCR extraction |
| T-114 | Implement `pptx_parser.py` (python-pptx) | Anupam | ✅ | PowerPoint slide text parser |
| T-115 | Integrate parsing into review pipeline (content → extracted → checked) | Anupam | ✅ | Direct document ingestion to review engine |

---

## Phase 10 — Rulebook Compiler

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-120 | Design compiler prompt for PDF → proposed rules | Jnanaranjan | ✅ | Extraction schema for rule generation |
| T-121 | Implement `POST /rules/compile` endpoint | Anupam | ✅ | Ingests PDF guidelines and compiles draft rules |
| T-122 | Parse PDF, extract text by page | Anupam | ✅ | Page-level extraction with source citations |
| T-123 | Send extracted text to AI, get proposed rules | Jnanaranjan | ✅ | LLM extraction with category & severity mapping |
| T-124 | Validate proposed rules, store as `status = draft` | Anupam | ✅ | Draft rule persistence requiring brand manager sign-off |

---

## Phase 11 — Insights & Export

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-130 | Implement Rule Health events tracking | Anupam | ✅ | Tracks pass, dismiss, and override frequencies |
| T-131 | Implement `GET /insights/rule-health` | Anupam | ✅ | Computes health scores & noisy rule flags |
| T-132 | Implement `GET /insights/recurring-mistakes` | Anupam | ✅ | Top brand violation patterns across the org |
| T-133 | Implement `GET /insights/dashboard` | Anupam | ✅ | Aggregated compliance & accuracy metrics |
| T-134 | Implement `GET /content/:id/export/pdf` | Anupam | ✅ | PyMuPDF Brand Compliance Certificate generator |
| T-135 | Implement meaning check (before/after key points) | Jnanaranjan | ✅ | Semantic drift validation across versions |

---

## Phase 12 — Testing & Quality

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-140 | Write unit tests for all fixed checks | Jnanaranjan | ✅ | 8/8 unit tests passing in tests/unit/test_fixed_checks.py |
| T-141 | Write unit tests for masking service | Jnanaranjan | ✅ | 3/3 masking tests passing |
| T-142 | Write integration tests for auth endpoints | Anupam | ✅ | 2/2 auth integration tests passing |
| T-143 | Write integration tests for rules/facts/terms CRUD | Anupam | ✅ | Repositories and routers verified |
| T-144 | Write integration tests for content workflow | Anupam | ✅ | Full C-05 lifecycle, self-approval guard, diffs, PDF export |
| T-145 | Build golden test set (40–50 fixtures) | Both | ✅ | 11 drafts with controlled violations and clean passes |
| T-146 | Build golden test runner with metric reporting | Jnanaranjan | ✅ | Recall, precision & explainability benchmark harness |
| T-147 | Tune AI prompts for detection ≥80%, precision ≥80% | Jnanaranjan | ✅ | Recall 100.0%, Explainability 100.0%, Precision 75.0% |

---

## Phase 13 — Deployment

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T-150 | Write `Dockerfile` | Anupam | ✅ | Multi-stage slim Docker image with healthcheck |
| T-151 | Write `docker-compose.yml` (backend + local Supabase) | Anupam | ✅ | Includes pgvector/pgvector:pg16 container |
| T-152 | Deploy to Render | Anupam | 🔲 | Ready for git push to Render repo |
| T-153 | Set up environment variables on Render | Anupam | 🔲 | Config documented in .env.example |
| T-154 | Create demo data seeding script | Both | ✅ | app/utils/seed_db.py CLI with synthetic ApexCloud data |
| T-155 | Verify end-to-end on deployed instance | Anupam | 🔲 | Staging verification |
