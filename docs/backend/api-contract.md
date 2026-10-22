# BrandProof — API Contract

> The single source of truth for frontend–backend communication.
> All endpoints are prefixed with `/api/v1`. Authentication via `Authorization: Bearer <supabase_jwt>`.

---

## Response Envelope

All responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "cursor": "abc123",
    "has_more": true,
    "total": 42
  }
}
```

Error response:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONTENT_INVALID_TRANSITION",
    "message": "Cannot transition from 'draft' to 'approved'",
    "details": {}
  },
  "meta": null
}
```

---

## Authentication

| Header | Value |
|---|---|
| `Authorization` | `Bearer <supabase_jwt>` |

The JWT contains: `sub` (user_id), `org_id`, `role`, `email`.

---

## 1. Auth & Users

### `POST /api/v1/auth/signup`

Create a new organisation and admin user.

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | — |
| `password` | string | ✅ | Min 8 chars |
| `display_name` | string | ✅ | — |
| `org_name` | string | ✅ | — |

**Response:** `201` — `{ user, organisation, access_token }`

---

### `POST /api/v1/auth/login`

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Response:** `200` — `{ user, access_token, refresh_token }`

---

### `GET /api/v1/users`

List users in the caller's organisation.

**Query params:** `role`, `is_active`, `cursor`, `limit`

**Response:** `200` — `{ users: [...], meta }`

**Roles:** admin, brand_manager

---

### `POST /api/v1/users/invite`

Invite a user to the organisation.

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `role` | string | ✅ |
| `display_name` | string | ✅ |

**Response:** `201` — `{ user }`

**Roles:** admin

---

### `PATCH /api/v1/users/:id`

Update user role or status.

| Field | Type | Required |
|---|---|---|
| `role` | string | ❌ |
| `is_active` | boolean | ❌ |

**Response:** `200` — `{ user }`

**Roles:** admin

---

## 2. Organisation Settings

### `GET /api/v1/org/settings`

**Response:** `200` — `{ settings }`

**Roles:** admin, brand_manager

---

### `PATCH /api/v1/org/settings`

| Field | Type | Required | Notes |
|---|---|---|---|
| `rules_only_mode` | boolean | ❌ | — |
| `ai_provider` | string | ❌ | `openai`, `gemini`, `local` |
| `masking_config` | object | ❌ | `{ mask_emails, mask_phones, mask_confidential }` |

**Response:** `200` — `{ settings }`

**Roles:** admin

---

## 3. Rules (Rulebook)

### `GET /api/v1/rules`

**Query params:** `category`, `status`, `severity`, `search`, `cursor`, `limit`

**Response:** `200` — `{ rules: [...], meta }`

---

### `POST /api/v1/rules`

Create a rule manually.

| Field | Type | Required |
|---|---|---|
| `rule_code` | string | ✅ |
| `category` | string | ✅ |
| `title` | string | ✅ |
| `description` | string | ✅ |
| `severity` | string | ✅ |
| `good_example` | string | ❌ |
| `bad_example` | string | ❌ |
| `source_document` | string | ❌ |
| `source_page` | integer | ❌ |
| `source_quote` | string | ❌ |

**Response:** `201` — `{ rule }` (status = `draft`)

**Roles:** brand_manager

---

### `GET /api/v1/rules/:id`

**Response:** `200` — `{ rule }`

---

### `PUT /api/v1/rules/:id`

Full update of a rule.

**Response:** `200` — `{ rule }`

**Roles:** brand_manager

---

### `PATCH /api/v1/rules/:id/status`

| Field | Type | Required | Values |
|---|---|---|---|
| `status` | string | ✅ | `approved`, `rejected`, `needs_examples` |

**Response:** `200` — `{ rule }`

**Roles:** brand_manager

---

### `POST /api/v1/rules/compile`

Upload a guideline PDF/DOCX and get proposed rules.

| Field | Type | Required |
|---|---|---|
| `file` | binary (multipart) | ✅ |

**Response:** `200` — `{ proposed_rules: [...] }` (each with status = `draft`)

**Roles:** brand_manager

---

### `POST /api/v1/rules/bulk-import`

Import rules from CSV.

| Field | Type | Required |
|---|---|---|
| `file` | binary (multipart CSV) | ✅ |

**Response:** `201` — `{ imported_count, errors: [...] }`

**Roles:** brand_manager

---

## 4. Facts Vault

### `GET /api/v1/facts`

**Query params:** `status`, `owner_id`, `is_expired`, `search`, `cursor`, `limit`

**Response:** `200` — `{ facts: [...], meta }`

---

### `POST /api/v1/facts`

| Field | Type | Required |
|---|---|---|
| `fact_code` | string | ✅ |
| `content` | string | ✅ |
| `owner_id` | uuid | ✅ |
| `source_document` | string | ❌ |
| `valid_until` | date | ✅ |

**Response:** `201` — `{ fact }`

**Roles:** brand_manager

---

### `PUT /api/v1/facts/:id`

**Response:** `200` — `{ fact }`

**Roles:** brand_manager

---

### `POST /api/v1/facts/bulk-import`

Import facts from CSV.

**Response:** `201` — `{ imported_count, errors: [...] }`

**Roles:** brand_manager

---

### `GET /api/v1/facts/expiring`

Get facts expiring within N days.

**Query params:** `days` (default 30)

**Response:** `200` — `{ facts: [...] }`

**Roles:** brand_manager, reviewer

---

## 5. Terminology

### `GET /api/v1/terms`

**Query params:** `search`, `cursor`, `limit`

**Response:** `200` — `{ terms: [...], meta }`

---

### `POST /api/v1/terms`

| Field | Type | Required |
|---|---|---|
| `preferred_term` | string | ✅ |
| `banned_alternatives` | string[] | ❌ |
| `notes` | string | ❌ |
| `case_sensitive` | boolean | ❌ |

**Response:** `201` — `{ term }`

**Roles:** brand_manager

---

### `PUT /api/v1/terms/:id`

**Response:** `200` — `{ term }`

**Roles:** brand_manager

---

### `DELETE /api/v1/terms/:id`

**Response:** `204`

**Roles:** brand_manager

---

### `POST /api/v1/terms/bulk-import`

**Response:** `201` — `{ imported_count, errors: [...] }`

**Roles:** brand_manager

---

## 6. Assets

### `GET /api/v1/assets`

**Query params:** `asset_type`, `cursor`, `limit`

**Response:** `200` — `{ assets: [...], meta }`

---

### `POST /api/v1/assets`

Upload an asset (multipart form).

| Field | Type | Required |
|---|---|---|
| `file` | binary | ✅ (for logo/image/font) |
| `name` | string | ✅ |
| `asset_type` | string | ✅ |
| `metadata` | json string | ❌ |
| `usage_notes` | string | ❌ |

**Response:** `201` — `{ asset }`

**Roles:** brand_manager

---

### `DELETE /api/v1/assets/:id`

**Response:** `204`

**Roles:** brand_manager

---

## 7. Content Items

### `POST /api/v1/content`

Create a new content item (draft).

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | — |
| `content_type` | string | ✅ | `text`, `social_post`, `email`, `document`, `image` |
| `body` | string | ✅ (for text types) | Raw text content |
| `file` | binary | ✅ (for document/image) | Uploaded file |
| `intent_purpose` | string | ❌ | Intent Lock |
| `intent_audience` | string | ❌ | Intent Lock |
| `intent_key_message` | string | ❌ | Intent Lock |
| `rules_only_mode` | boolean | ❌ | Override org setting |

**Response:** `201` — `{ content_item, version }`

**Roles:** creator, brand_manager

---

### `GET /api/v1/content`

List content items.

**Query params:** `status`, `author_id`, `content_type`, `cursor`, `limit`

**Response:** `200` — `{ content_items: [...], meta }`

---

### `GET /api/v1/content/:id`

**Response:** `200` — `{ content_item, current_version, findings_summary }`

---

### `PUT /api/v1/content/:id`

Update draft content (creates a new version).

| Field | Type | Required |
|---|---|---|
| `body` | string | ❌ |
| `file` | binary | ❌ |
| `intent_purpose` | string | ❌ |
| `intent_audience` | string | ❌ |
| `intent_key_message` | string | ❌ |

**Response:** `200` — `{ content_item, version }`

**Roles:** author only (own content)

---

### `GET /api/v1/content/:id/versions`

**Response:** `200` — `{ versions: [...] }`

---

### `GET /api/v1/content/:id/versions/:v1/diff/:v2`

Side-by-side diff between two versions.

**Response:** `200` — `{ diff, version_a, version_b }`

---

### `POST /api/v1/content/:id/check`

Trigger the review engine on the current version.

**Response:** `202` — `{ check_id, status: "checking" }`

Transitions content to `checking`. When complete, transitions to `checked`.

---

### `GET /api/v1/content/:id/check-status`

Poll check progress.

**Response:** `200` — `{ status, findings_count, progress_percent }`

---

### `POST /api/v1/content/:id/submit-for-review`

Submit checked content for human review.

**Response:** `200` — `{ content_item }` (status → `in_review`)

**Roles:** author only

---

### `POST /api/v1/content/:id/approve`

Brand manager final approval.

**Response:** `200` — `{ content_item }` (status → `approved`)

**Roles:** brand_manager (must not be author)

---

## 8. Findings

### `GET /api/v1/content/:id/findings`

**Query params:** `status`, `severity`, `category`, `check_type`, `cursor`, `limit`

**Response:** `200` — `{ findings: [...], meta }`

---

### `PATCH /api/v1/content/:id/findings/:finding_id`

Resolve a finding.

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | ✅ | `accepted`, `edited`, `dismissed` |
| `dismiss_reason` | string | conditional | Required for critical/warning dismissals |
| `edited_text` | string | conditional | Required when status = `edited` |

**Response:** `200` — `{ finding }`

**Roles:** creator (own content), reviewer

---

## 9. Reviews & Comments

### `GET /api/v1/content/:id/reviews`

**Response:** `200` — `{ reviews: [...] }`

---

### `POST /api/v1/content/:id/reviews`

Submit a review decision.

| Field | Type | Required |
|---|---|---|
| `decision` | string | ✅ | `approved`, `changes_requested` |
| `notes` | string | ❌ |

**Response:** `201` — `{ review }`

**Roles:** reviewer, brand_manager

---

### `GET /api/v1/content/:id/comments`

**Response:** `200` — `{ comments: [...] }`

---

### `POST /api/v1/content/:id/comments`

| Field | Type | Required |
|---|---|---|
| `body` | string | ✅ |
| `finding_id` | uuid | ❌ |

**Response:** `201` — `{ comment }`

---

## 10. AI Disclosure

### `GET /api/v1/content/:id/ai-disclosures`

**Response:** `200` — `{ disclosures: [...] }`

Shows what AI was used, what was sent, and when.

---

## 11. Rule Health & Insights

### `GET /api/v1/insights/rule-health`

**Query params:** `period` (7d, 30d, 90d), `category`

**Response:** `200`

```json
{
  "rules": [
    {
      "rule_id": "...",
      "rule_code": "R-21",
      "title": "...",
      "trigger_count": 45,
      "accept_rate": 0.72,
      "dismiss_rate": 0.28,
      "is_unclear": true,
      "suggested_rewrite": "..."
    }
  ]
}
```

**Roles:** brand_manager

---

### `GET /api/v1/insights/recurring-mistakes`

**Query params:** `period`, `group_by` (rule, category, team)

**Response:** `200` — `{ insights: [...] }`

**Roles:** brand_manager

---

### `GET /api/v1/insights/dashboard`

Aggregated stats: total content, approval rate, avg review time, top issues.

**Response:** `200` — `{ stats }`

**Roles:** brand_manager

---

## 12. Notifications

### `GET /api/v1/notifications`

**Query params:** `is_read`, `cursor`, `limit`

**Response:** `200` — `{ notifications: [...], unread_count, meta }`

---

### `PATCH /api/v1/notifications/:id/read`

**Response:** `200` — `{ notification }`

---

### `POST /api/v1/notifications/mark-all-read`

**Response:** `200` — `{ updated_count }`

---

## 13. Export

### `GET /api/v1/content/:id/export/pdf`

Generate a PDF approval record for approved content.

**Response:** `200` — binary PDF

**Roles:** brand_manager, reviewer

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `AUTH_INVALID_TOKEN` | 401 | JWT invalid or expired |
| `AUTH_INSUFFICIENT_ROLE` | 403 | User lacks required role |
| `ENTITY_NOT_FOUND` | 404 | Resource doesn't exist or not in user's org |
| `CONTENT_INVALID_TRANSITION` | 409 | Invalid state machine transition |
| `CONTENT_SELF_APPROVAL` | 403 | Cannot approve own content |
| `FINDING_REASON_REQUIRED` | 422 | Missing dismiss reason for critical/warning |
| `VALIDATION_ERROR` | 422 | Request body validation failure |
| `AI_SERVICE_UNAVAILABLE` | 503 | AI provider timeout or error |
| `FILE_FORMAT_UNSUPPORTED` | 415 | Uploaded file format not supported |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
