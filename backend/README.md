# BrandProof Backend (FastAPI)

> **Intelligent Brand Governance & Proof Engine**  
> Round 1–3 Hackathon Architecture · Streamlined & High-Cohesion

---

## ⚡ Quickstart (No Docker Required)

You do **NOT** need Docker to develop or test BrandProof locally. The backend includes a built-in pre-seeded brand dataset (ApexCloud Technologies) and runs in seconds.

### 1. Set Up Virtual Environment

```bash
cd backend
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
# Core server & testing
pip install fastapi "uvicorn[standard]" pydantic pydantic-settings python-multipart pyjwt httpx pytest pytest-asyncio

# Or install the full dependency suite:
pip install -r requirements.txt
```

### 3. Launch Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🐳 Docker (Optional Deployment Asset)

Docker is **strictly optional** for local development. It is provided for developers who prefer running containerized services or for deployment platforms like Render / Railway.

To run with Docker:

```bash
docker compose up --build
```

---

## 🏛️ Streamlined Architecture

The backend has been consolidated from 60+ fragmented files into **high-cohesion modules**, eliminating redundant repository wrappers while retaining **100% of the 19 Must features** from `planing.txt`:

```
backend/
├── app/
│   ├── config.py           # Application settings & environment variables
│   ├── schemas.py          # Unified Pydantic models & API standard envelope
│   ├── store.py            # Unified persistence (Supabase + local pre-seeded store)
│   ├── parsers.py          # PDF / DOCX parsing & Rulebook Compiler
│   ├── engine/
│   │   ├── checks.py       # Deterministic checks (terminology, banned words, contrast, readability, links, alt-text)
│   │   ├── ai.py           # Privacy masking, Claim Passport (fact matching), Tone analysis, Intent Lock
│   │   └── orchestrator.py # Pipeline coordinator (Deterministic -> Masking -> AI -> Proof ranking)
│   ├── api/
│   │   ├── auth.py         # Login, signup, me, users, org settings
│   │   ├── knowledge.py    # Rules (+ Rulebook Compiler), Facts Vault (+ CSV), Terms, Brand Assets
│   │   ├── content.py      # Content items, review check execution, finding resolution, approval flow, diff, export
│   │   └── insights.py     # Rule Health, recurring mistakes, dashboard stats, notifications
│   └── main.py             # FastAPI app factory, CORS, exception handling
```

---

## 🎯 Feature Coverage (from `planing.txt`)

| Feature from Plan | Implementation Module | How it Works |
|---|---|---|
| **Rulebook Compiler** | `app/parsers.py` & `/rules/compile` | Extracts structured candidate rules from guideline PDFs with page & quote citations |
| **Approved Facts Vault** | `app/store.py` & `/facts` | Stores verified facts with owner, source document, and expiry date (`valid_until`) |
| **Hybrid Review Engine** | `app/engine/orchestrator.py` | Fixed checks run first (fast, explainable, free); AI handles only tone & claim validation |
| **Claim Passport** | `app/engine/ai.py` | Matches claims against facts vault; flags outdated (expired facts) or unsupported claims |
| **Intent Lock** | `app/engine/ai.py` | Suggestions generated respecting creator's purpose, audience, and key message |
| **Privacy Gate** | `app/engine/ai.py` | Masks PII (emails, phones) and confidential tags before any external AI call |
| **Rule Health Insights** | `app/api/insights.py` | Surfaces unclear rules with high override rates (>30%) and proposes clear rewrites |
| **Human in Control** | `app/api/content.py` | Creators accept/edit/dismiss findings; mandatory reason required for critical dismissals |
| **Self-Approval Guard** | `app/api/content.py` | Enforces governance: authors cannot approve their own content drafts |
| **Version History & Diff** | `app/api/content.py` | Side-by-side version comparison using standard diff operations |

---

## 🧪 Running Tests

```bash
cd backend
pytest tests/unit/ -v
```
