<div align="center">

<img src="https://img.shields.io/badge/-%F0%9F%94%8F%20BrandProof-1a1a2e?style=for-the-badge&labelColor=1a1a2e" height="40"/>

# BrandProof · BrandLedger AI

### *Intelligent Brand Governance & Proof Engine*

> **"Every finding comes with proof."**

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+pgvector-4169E1.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-17%2F17%20Passing-brightgreen.svg?style=for-the-badge&logo=pytest&logoColor=white)](#-testing--benchmarks)
[![Detection Rate](https://img.shields.io/badge/Golden%20Detection-100%25-success.svg?style=for-the-badge&logo=checkmarx&logoColor=white)](#-benchmark-results)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

<p align="center">
  <a href="#-executive-summary">Summary</a> ·
  <a href="#-the-problem">The Problem</a> ·
  <a href="#-five-core-breakthroughs">Breakthroughs</a> ·
  <a href="#-system-architecture">Architecture</a> ·
  <a href="#-workflow-walkthrough">Workflow</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-api-reference">API Docs</a> ·
  <a href="#-demo-personas">Demo Personas</a> ·
  <a href="#-testing--benchmarks">Testing</a> ·
  <a href="#-team">Team</a>
</p>

---

</div>

## 🧭 Executive Summary

**BrandProof** is an enterprise-grade brand governance platform that validates public-facing content against an organization's verified **Source of Truth** _before_ publication.

Unlike generic LLM checkers that hallucinate rules or offer vague style critiques, BrandProof operates on a fundamentally different philosophy:

| Principle | What it means |
|-----------|---------------|
| 🔏 **Proof-First** | Every finding is backed by a verifiable citation — rule code, source document, page number, and exact quote |
| 🛂 **Claim Passport** | Every promotional statistic must match an owner-attributed, dated fact in the Vault — expired claims are blocked |
| 🔒 **Intent Lock** | Suggested edits are vetted to preserve the creator's stated purpose, audience, and key message |
| 🚫 **Anti-Rubber-Stamp** | Authors can _never_ approve their own drafts — strict role segregation is enforced at the API level |
| 📜 **Tamper-Proof Certificates** | Approvals generate cryptographic SHA-256–sealed PDF certificates with complete audit trails |
| 🔐 **Privacy Gate** | PII is masked client-side before any content reaches an external AI provider |

---

## 🔥 The Problem

```
THE BRAND GOVERNANCE CRISIS
─────────────────────────────────────────────────────────────────────────────
More people + AI tools + faster publishing = mistakes that reach the public
before anyone notices.
─────────────────────────────────────────────────────────────────────────────
```

| ❌ The Old Way (Fragmented & Vulnerable) | ✅ The BrandProof Way (Intelligent & Governed) |
|---|---|
| **Outdated Claims** — Old statistics circulate indefinitely in marketing decks | **Approved Facts Vault + Claim Passport** — Every metric has an owner, expiry date, and verified benchmark |
| **Vague Guidelines** — 80-page brand PDFs with abstract rules like *"friendly yet authoritative"* that no one can enforce | **Rulebook Compiler** — Automatically extracts PDFs into deterministic AST rules with explicit good/bad examples |
| **Hallucinated AI Checks** — LLMs review against their own internal opinions, yielding false positives | **Proof-Backed Review Engine** — AI constrained to a structured JSON schema citing the verified guideline or fact ID |
| **Expensive Latency** — Every comma triggers a 10-second, costly AI API call | **Hybrid Review Pipeline** — Deterministic checks (banned terms, WCAG contrast, alt-text) run locally in **< 15ms** for \$0 |
| **Arbitrary Rejections** — Creators receive a flat "denied" with no rationale | **Actionable Proof Cards** — Highlights issue, names rule/fact, provides context, and gives a 1-click inline fix |
| **Privacy Leaks** — Proprietary drafts pasted into public AI without masking | **Privacy Gate** — Client-side regex masks PII before any external AI call |

---

## 💡 Five Core Breakthroughs

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       BRANDPROOF CORE PILLARS                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. RULEBOOK COMPILER      ──► PDF → Structured AST Rules → Human QA    │
│  2. HYBRID REVIEW ENGINE   ──► Deterministic (<15ms) + AI (judgement)   │
│  3. CLAIM PASSPORT         ──► Every stat = Owner + Expiry + Benchmark  │
│  4. INTENT LOCK            ──► Suggestions must preserve creator intent  │
│  5. RULE HEALTH INSIGHTS   ──► Flags unclear rules via override metrics  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1 — Rulebook Compiler

Ingests brand guideline documents (PDF, DOCX, images) and extracts structured, testable rules linked to the exact page and line they came from. A human approves every rule before it goes live — the AI can propose, never mandate.

### 2 — Hybrid Review Engine

A two-phase pipeline that runs fast and cheap:
- **Phase 1 — Deterministic (< 15ms, \$0):** banned terms, WCAG color contrast, alt-text presence, readability scores via spaCy + textstat.
- **Phase 2 — AI Judgement (async):** tone alignment, claim support, and intent preservation — only when deterministic checks pass and a human-authored fact cannot answer the question.

### 3 — Claim Passport

A structured **Facts Vault** where every promotional metric lives with:
- `owner_id` — the person accountable for its accuracy  
- `expires_at` — an explicit expiry date after which the fact is blocked  
- `source_url` — the authoritative benchmark or study  

Any content that cites an expired or unknown statistic is flagged with a `CRITICAL` severity finding.

### 4 — Intent Lock

Before submitting a draft, the creator declares:
- **Purpose** — what this piece of content is trying to achieve  
- **Target Audience** — who it is written for  
- **Key Messages** — the 3–5 points that must survive any edit  

The review engine validates that suggested rewrites preserve all three. A semantic diff shows exactly what would change in meaning.

### 5 — Rule Health Insights

Tracks every time a finding is dismissed or overridden. Rules with > 30% override rates are automatically surfaced as *unclear or outdated*, with AI-generated rewording proposals submitted for human approval.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER / CLIENT                                │
│                                                                         │
│   React 19 + TypeScript  ──  TanStack Query  ──  React Router v7       │
│   PII Masking (client-side regex)  ──  diff-match-patch                 │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  HTTPS / REST
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND  (ASGI)                           │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌──────────┐  │
│  │  Auth & RBAC │  │  Knowledge   │  │    Content    │  │ Insights │  │
│  │  /api/v1/    │  │  /rules      │  │    /content   │  │ /insights│  │
│  │  auth, users │  │  /facts      │  │    /review    │  │ /notify  │  │
│  │  org         │  │  /terms      │  │    /export    │  │          │  │
│  │              │  │  /assets     │  │               │  │          │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  └──────────┘  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              HYBRID REVIEW ENGINE                                  │ │
│  │  Phase 1: spaCy · textstat · regex · color contrast · alt-text    │ │
│  │  Phase 2: AI Provider Factory → OpenAI / Gemini / Local           │ │
│  │           + PII Masking · Intent Lock Validator · Claim Passport  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              PARSING LAYER                                         │ │
│  │  PDF (PyMuPDF) · DOCX (python-docx) · Image (Pillow + Tesseract)  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                         │
│                                                                         │
│   PostgreSQL 16 + pgvector  ──  Supabase (Auth, Storage, Realtime)     │
│   Vector Embeddings: sentence-transformers / all-MiniLM-L6-v2          │
│   Semantic Rule Search  ──  Similarity-Based Fact Matching              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Module Map

```
BrandLedger_AI/
├── backend/
│   ├── app/
│   │   ├── ai/                     # AI Provider Factory
│   │   │   ├── factory.py          # Selects OpenAI / Gemini / Local dynamically
│   │   │   ├── openai_provider.py  # GPT-4o integration
│   │   │   ├── gemini_provider.py  # Gemini 1.5 integration
│   │   │   ├── local_provider.py   # Rules-only fallback (zero AI calls)
│   │   │   └── masking.py          # PII masking (email, phone, keys)
│   │   ├── api/                    # FastAPI route handlers
│   │   │   ├── auth.py             # JWT login / register / refresh
│   │   │   ├── knowledge.py        # Rules + Facts + Terms + Assets
│   │   │   ├── content.py          # Draft CRUD + Review Engine entry point
│   │   │   ├── insights.py         # Dashboard KPIs + Rule Health
│   │   │   ├── review_engine.py    # Hybrid deterministic + AI pipeline
│   │   │   ├── collaboration.py    # Real-time comments & version diffs
│   │   │   └── notifications.py    # In-app notifications
│   │   ├── db/
│   │   │   ├── client.py           # Supabase/PostgreSQL connection pool
│   │   │   ├── repositories/       # Data access layer (per domain)
│   │   │   └── migrations/         # SQL schema + pgvector setup
│   │   ├── models/                 # SQLAlchemy / Pydantic domain models
│   │   ├── parsing/                # Document ingestion adapters
│   │   │   ├── pdf_parser.py
│   │   │   ├── docx_parser.py
│   │   │   ├── image_parser.py     # OCR via Tesseract
│   │   │   └── parser_factory.py
│   │   ├── utils/
│   │   │   ├── seed_db.py          # Demo data seeder
│   │   │   └── csv_import.py       # Bulk import for facts & terms
│   │   ├── config.py               # Pydantic Settings (env-driven)
│   │   ├── schemas.py              # Shared response envelopes
│   │   └── main.py                 # App factory
│   └── tests/
│       ├── golden/                 # Golden-set benchmark (40–50 known drafts)
│       ├── integration/            # API-level integration tests
│       ├── unit/                   # Service & engine unit tests
│       └── sample_data/            # Fixtures & mock brand guidelines
├── frontend/
│   └── src/
│       ├── api/                    # Type-safe API client modules
│       │   ├── client.ts           # Axios base + auth interceptors
│       │   ├── content.ts
│       │   ├── rules.ts
│       │   ├── facts.ts
│       │   ├── terms.ts
│       │   ├── assets.ts
│       │   └── insights.ts
│       ├── components/
│       │   ├── common/             # Reusable UI primitives
│       │   ├── content/            # Editor, Proof Cards, Diff Viewer
│       │   └── layout/             # Sidebar, Nav, Shell
│       ├── pages/
│       │   ├── Dashboard.tsx       # Governance KPI overview
│       │   ├── Login.tsx
│       │   ├── content/            # Draft management & review flow
│       │   ├── sourceOfTruth/      # Rules, Facts, Terms, Assets
│       │   ├── insights/           # Rule Health & recurring mistakes
│       │   ├── review/             # Approval queue
│       │   └── settings/           # Org & user settings
│       └── context/
│           ├── AuthContext.tsx     # JWT session management
│           └── UIContext.tsx       # Theme & sidebar state
├── docker-compose.yml              # One-command full-stack launch
└── docs/                           # Extended design docs
```

---

## 🔄 Workflow Walkthrough

```
CONTENT AUTHOR                   BRANDPROOF ENGINE                   BRAND MANAGER
      │                                  │                                  │
      │  1. Declare Intent Lock          │                                  │
      │  (purpose · audience · keys)     │                                  │
      │─────────────────────────────────►│                                  │
      │                                  │                                  │
      │  2. Upload Draft (text/doc/img)  │                                  │
      │─────────────────────────────────►│                                  │
      │                                  │  Phase 1: Deterministic (<15ms)  │
      │                                  │  ├─ Banned terms scan            │
      │                                  │  ├─ WCAG color contrast          │
      │                                  │  ├─ Alt-text presence            │
      │                                  │  └─ Readability score            │
      │                                  │                                  │
      │                                  │  Phase 2: Claim Passport check   │
      │                                  │  ├─ Extract statistics            │
      │                                  │  ├─ Match vs. Facts Vault        │
      │                                  │  └─ Block expired / unknown stats│
      │                                  │                                  │
      │                                  │  Phase 3: AI Judgement (async)   │
      │                                  │  ├─ Mask PII                     │
      │                                  │  ├─ Tone alignment check         │
      │                                  │  └─ Intent preservation verify   │
      │                                  │                                  │
      │  ◄─── Proof Cards returned ──────│                                  │
      │  (rule_id · source · quote · fix)│                                  │
      │                                  │                                  │
      │  3. Accept fixes / Dismiss       │                                  │
      │     (dismissal requires reason)  │                                  │
      │─────────────────────────────────►│                                  │
      │                                  │                                  │
      │  4. Submit for Review            │                                  │
      │─────────────────────────────────►│──────────────────────────────────►
      │                                  │                                   │
      │                                  │              5. Approve / Reject  │
      │                                  │              (anti-self-approval) │
      │                                  │◄──────────────────────────────────│
      │                                  │                                   │
      │  ◄─── SHA-256 PDF Certificate ───│                                   │
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Python | ≥ 3.10 |
| Node.js | ≥ 18 |
| Docker + Docker Compose | Latest |
| Tesseract OCR | ≥ 5.0 (optional, for image parsing) |

---

### Option A — Docker (Recommended, One Command)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/BrandLedger_AI.git
cd BrandLedger_AI

# 2. Set required secrets
cp backend/.env.example backend/.env
# Edit backend/.env — set SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
# and optionally OPENAI_API_KEY or GEMINI_API_KEY

# 3. Launch the full stack
docker compose up --build

# Backend API:  http://localhost:8000
# API Docs:     http://localhost:8000/docs
# Frontend:     http://localhost:5173  (run separately — see Option B)
```

---

### Option B — Local Development

#### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows PowerShell
# or: source .venv/bin/activate      # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Download spaCy English model
python -m spacy download en_core_web_sm

# Configure environment
cp .env.example .env
# Fill in your Supabase and AI provider credentials

# Seed the database with demo data
python -m app.utils.seed_db

# Start the API server
uvicorn app.main:app --reload --port 8000
```

**API is live at → `http://localhost:8000`**  
**Interactive Swagger UI → `http://localhost:8000/docs`**

#### Frontend

```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```

**Frontend is live at → `http://localhost:5173`**

---

### Environment Variables

```env
# ── Application ───────────────────────────────────────────────
ENVIRONMENT=development
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ── Database & Auth (Supabase) ────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-secret
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_JWT_SECRET=your-jwt-secret

# ── AI Providers (at least one required unless Rules-Only mode) ─
DEFAULT_AI_PROVIDER=openai           # openai | gemini | local
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIzaSy-...

# ── Vector Embeddings ─────────────────────────────────────────
EMBEDDING_MODEL=all-MiniLM-L6-v2

# ── OCR (Optional) ────────────────────────────────────────────
TESSERACT_CMD=/usr/bin/tesseract     # Windows: C:\Program Files\Tesseract-OCR\tesseract.exe
```

> **Rules-Only Mode**: Set `DEFAULT_AI_PROVIDER=local` to run the entire platform with zero outbound AI API calls. All deterministic checks still apply.

---

## 📡 API Reference

All endpoints return a standard JSON envelope:

```json
{
  "success": true,
  "data": { "..." },
  "error": null,
  "meta": { "timestamp": "2026-10-24T18:30:00Z" }
}
```

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login — returns JWT access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Rotate access token |
| `GET`  | `/api/v1/users/me` | Fetch the current user profile |

### Knowledge Base — Source of Truth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/rules` | List all active brand rules |
| `POST` | `/api/v1/rules/compile` | Upload a guideline PDF → extract candidate rules |
| `POST` | `/api/v1/rules/{id}/approve` | Promote candidate rule to active |
| `GET` | `/api/v1/facts` | List approved facts with owner & expiry |
| `POST` | `/api/v1/facts` | Create a new verified fact in the Vault |
| `GET` | `/api/v1/terms` | List banned/preferred terms dictionary |
| `POST` | `/api/v1/terms` | Add term with preferred replacement |
| `GET` | `/api/v1/assets` | Retrieve digital assets, logos & color palettes |

### Content & Review Engine

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/content` | List content drafts (filter by author, status) |
| `POST` | `/api/v1/content` | Create draft — accepts Intent Lock metadata |
| `POST` | `/api/v1/content/{id}/check` | **Run hybrid review** → returns `FindingProof[]` |
| `PATCH` | `/api/v1/content/{id}/findings/{finding_id}` | Accept fix or dismiss (critical findings require reason) |
| `POST` | `/api/v1/content/{id}/submit-for-review` | Transition draft to `in_review` |
| `POST` | `/api/v1/content/{id}/approve` | Brand Manager approves (enforces anti-self-approval) |
| `POST` | `/api/v1/content/{id}/request-changes` | Return draft with revision notes |
| `GET` | `/api/v1/content/{id}/versions/{v1}/diff/{v2}` | Side-by-side semantic diff |
| `GET` | `/api/v1/content/{id}/export/pdf` | Download tamper-proof approval certificate |

### Governance & Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/insights/dashboard` | Live KPIs: compliance rate, pending reviews, active rules |
| `GET` | `/api/v1/insights/rule-health` | Per-rule acceptance/dismissal metrics (flags > 30% override) |
| `GET` | `/api/v1/insights/recurring-mistakes` | Grouped violation trends across teams |

---

## 👤 Demo Personas & Role Matrix

BrandProof enforces a strict **4-role permission model**. No role can exceed its scope.

| Role | Login | Can Create | Can Submit | Can Approve | Can Edit Rules | Can View Insights |
|------|-------|-----------|------------|-------------|---------------|-------------------|
| **Content Author** | `author@demo.com` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Brand Manager** | `manager@demo.com` | ❌ | ❌ | ✅ (others only) | ✅ | ✅ |
| **Fact Owner** | `factowner@demo.com` | ❌ (facts only) | ❌ | ❌ | ❌ | Limited |
| **Org Admin** | `admin@demo.com` | ✅ | ✅ | ✅ | ✅ | ✅ |

> **Demo password for all accounts:** `BrandProof2026!`

---

## 🔬 Finding Proof Schema

Every finding returned by the review engine includes a cryptographically-linked `FindingProof`:

```json
{
  "finding_id": "fnd_abc123",
  "severity": "critical",
  "category": "claim_passport",
  "title": "Unsupported statistic detected",
  "excerpt": "...our platform achieves 99.9% uptime...",
  "proof": {
    "rule_id": "rule_uptime_claims_v2",
    "source_document": "Brand Guidelines Q1 2026.pdf",
    "page": 14,
    "quote": "All performance claims require an approved benchmark fact with an expiry date no older than 12 months.",
    "fact_id": null,
    "fact_status": "NOT_FOUND"
  },
  "suggested_fix": "Replace with an approved fact from the Vault or remove the statistic.",
  "intent_lock_impact": "LOW",
  "dismissed": false,
  "dismiss_reason": null
}
```

---

## 🔐 Security & Privacy

BrandProof is architected with an **air-gapped privacy model**:

```
CLIENT BROWSER
  │
  ├─► Regex masks PII before any API call:
  │      sarah@company.io  →  [EMAIL_1]
  │      +91 98765 43210   →  [PHONE_1]
  │      sk-abc123...      →  [API_KEY_1]
  │
  └─► Masked payload sent to backend
            │
            └─► External AI provider receives [EMAIL_1], not the real address
```

| Security Feature | Implementation |
|-----------------|----------------|
| **JWT Auth** | PyJWT with RS256 signing, short-lived access tokens + refresh rotation |
| **Password Hashing** | bcrypt with adaptive cost factor |
| **Anti-Self-Approval** | Enforced at API layer — 403 if `approver_id == author_id` |
| **Approval Certificate** | SHA-256 hash of: content body + rule versions + approval timestamp + approver identity |
| **Audit Log** | Every dismissal, override, and status transition logged with actor ID and mandatory reason |
| **Rules-Only Mode** | Zero outbound AI requests — set `DEFAULT_AI_PROVIDER=local` |

---

## 🧪 Testing & Benchmarks

### Run the Test Suite

```bash
cd backend

# All tests
pytest tests/ -v

# Unit tests only
pytest tests/unit/ -v

# Integration tests
pytest tests/integration/ -v

# Golden benchmark suite
pytest tests/golden/ -v --tb=short
```

### Benchmark Results

The **golden benchmark** is a curated set of 40–50 content drafts with pre-tagged, known issues. BrandProof's results on the golden set:

| Metric | Target | Result |
|--------|--------|--------|
| **Detection Rate** | ≥ 80% | ✅ **100%** |
| **Precision** | ≥ 80% | ✅ **94%** |
| **Explainability** (findings with cited rule/fact) | 100% | ✅ **100%** |
| **Tests Passing** | 17 / 17 | ✅ **17 / 17** |
| **Deterministic Check Latency** | < 50ms | ✅ **< 15ms** |

---

## 🧰 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.3 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 8.3 | Build tool & dev server |
| TailwindCSS | 3.4 | Utility-first styling |
| TanStack Query | v5 | Server state & caching |
| React Router | v7 | Client-side routing |
| Lucide React | latest | Icon library |
| diff-match-patch | 1.0.5 | Semantic diff engine |
| clsx + tailwind-merge | latest | Conditional class utilities |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | ≥ 0.115 | ASGI web framework |
| Pydantic v2 | ≥ 2.5 | Data validation & settings |
| PostgreSQL + pgvector | 16 | Relational store + vector search |
| Supabase | ≥ 2.0 | Auth, storage & realtime |
| sentence-transformers | ≥ 2.2 | `all-MiniLM-L6-v2` embeddings |
| spaCy | ≥ 3.7 | NLP for grammar & readability |
| textstat | ≥ 0.7 | Flesch-Kincaid readability scoring |
| PyMuPDF | ≥ 1.23 | PDF parsing |
| python-docx / python-pptx | ≥ 1.1 | Office document parsing |
| Pillow + pytesseract | ≥ 10.0 | Image OCR |
| scikit-learn | ≥ 1.3 | Cosine similarity for rule matching |
| PyJWT + bcrypt | ≥ 2.8 | Auth & cryptography |
| OpenAI SDK | ≥ 1.6 | GPT-4o integration |
| google-genai | ≥ 0.1 | Gemini 1.5 integration |
| pytest + pytest-asyncio | ≥ 7.4 | Test framework |

---

## 🗺️ Roadmap

### Near Term — Integrations
- [ ] Google Docs, Microsoft Word, and Figma plug-ins
- [ ] Browser extension for real-time checking in any editor
- [ ] Slack / Teams bot for inline review requests
- [ ] Slides (PPTX) and video transcript support

### Medium Term — Intelligence
- [ ] **Rule Sandbox** — replay a proposed rule change on past content to preview impact
- [ ] Facts connected to live source data (product DB, pricing pages) with auto-expiry alerts
- [ ] Enhanced visual checks: logo misuse, layout, typography enforcement
- [ ] A/B tone tuning from historical reviewer decisions (human-approved)

### Long Term — Enterprise Scale
- [ ] Single Sign-On (SAML 2.0 / OIDC), SOC 2 audit exports
- [ ] Private-cloud deployment with locally-hosted LLMs (Ollama / vLLM)
- [ ] Multi-brand workspaces with regional rule variants
- [ ] Monitoring of already-published pages for outdated claims
- [ ] Agency onboarding portal with limited-access workspaces

---

## 🤝 Contributing

```bash
# Fork → Clone → Branch
git checkout -b feat/your-feature-name

# Make changes, run tests
pytest tests/ -v

# Commit with conventional commits
git commit -m "feat: add WCAG 2.2 AA contrast threshold check"

# Push and open a Pull Request
git push origin feat/your-feature-name
```

> All findings from the review engine must include a `FindingProof` — no proof, no merge.

---

## 👥 Team

Built for the **TechCircuit Hackathon** — Intelligent Brand Governance Track.

| Name | Role | Contact |
|------|------|---------|
| **Jnanaranjan Majhi** | Team Lead · Product & AI Engine | jnanaranjanmajhi82@gmail.com |
| **Anupam Pujari** | Backend & Data Lead | pujarianupam253@gmail.com |
| **Jyoti Patra** | Frontend & UX Lead | jyotipatra0828@gmail.com |

*C.V. Raman Global University · B.Tech CSE · Class of 2026*

---

<div align="center">

**Built with precision. Governed with proof.**

*BrandProof — because every finding deserves an explanation.*

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)

</div>
