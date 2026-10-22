# BrandProof — Backend Constitution (Non-Negotiable Principles)

> Rules the backend must never violate, regardless of feature pressure or time constraints.
> Every PR review should check against this list.

---

## 1. Human Authority

- **C1.1** — The backend must **never** auto-approve, auto-publish, or auto-edit content. Every mutation to content state that moves toward publication requires a human-initiated API call.
- **C1.2** — Every AI suggestion is stored as a **proposal**. Only a human action (accept / edit / dismiss) can apply it.
- **C1.3** — No user can approve content they authored. The backend must enforce `author_id ≠ approver_id` at the service layer **and** database constraint level.

---

## 2. Explainability

- **C2.1** — Every finding returned by the review engine must include a valid `rule_id` or `fact_id`. Findings without a valid reference are **discarded silently** and logged for debugging.
- **C2.2** — Every quoted piece of evidence must appear **word for word** in either the draft or the source document. If the verbatim match fails, the finding is discarded.
- **C2.3** — When AI confidence is below the configured threshold, the finding must carry the label `"needs_human_judgement": true`. It must never be presented as a definitive fact.

---

## 3. Privacy by Design

- **C3.1** — All organisation data is isolated by **row-level security**. No API endpoint may bypass RLS for cross-org data access, except a dedicated super-admin diagnostics endpoint (if built) that is never exposed publicly.
- **C3.2** — Before any external AI API call, all text must pass through the `MaskingService`. Unmasked text must **never** be sent externally.
- **C3.3** — Every AI call must produce an `ai_disclosure` record: provider name, timestamp, the exact masked text sent, and the response received.
- **C3.4** — Secret keys (API keys, database credentials, JWT secrets) must **never** appear in API responses, frontend bundles, or client-accessible storage.
- **C3.5** — Uploaded files are served only via **signed URLs with expiry**. Direct public URLs are forbidden.

---

## 4. Data Integrity

- **C4.1** — Every rule used in a review must have `status = 'approved'`. Draft or rejected rules are never used in live reviews.
- **C4.2** — Content state transitions must follow the defined state machine (see `clarifications.md` C-05). Invalid transitions return `409 Conflict`.
- **C4.3** — High-severity finding dismissals require a non-empty `reason` string. The backend must reject dismissals without a reason for Critical and Warning findings.
- **C4.4** — All state-changing operations are logged in the `audit_log` table with: actor, action, timestamp, old state, new state, and metadata.

---

## 5. AI Safety

- **C5.1** — Every AI response must be validated against its Pydantic schema before any data is stored or returned. Malformed responses are discarded and logged.
- **C5.2** — The system must function fully in **"rules only" mode** with zero external AI calls. This is not a degraded mode — it is a first-class operating mode.
- **C5.3** — AI provider can be changed per-organisation without code changes. The `AIService` interface must remain provider-agnostic.
- **C5.4** — AI calls must have **timeout** and **retry** limits. A stuck or failed AI call must not block the review pipeline; fixed-check results are returned regardless.

---

## 6. Testing & Reliability

- **C6.1** — Every review engine check (fixed or AI) must have at least one positive-match and one negative-match unit test.
- **C6.2** — The golden test set must run in CI. A regression (detection rate dropping below the previous run by more than 5%) must fail the build.
- **C6.3** — All API endpoints must have integration tests covering: success, authentication failure, authorisation failure, and validation failure.

---

## 7. API Contract Stability

- **C7.1** — The API contract (see `api-contract.md`) is the source of truth for frontend–backend communication. Changes require updating the contract document first.
- **C7.2** — All API responses follow a consistent envelope format. Error responses include a machine-readable `error_code` and a human-readable `message`.
- **C7.3** — Pagination uses cursor-based pagination for list endpoints (not offset-based) to handle concurrent writes safely.
