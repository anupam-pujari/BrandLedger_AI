# BrandProof — Backend Test Strategy

> Testing approach, structure, and coverage requirements for the backend.

---

## 1. Testing Pyramid

```
         /\
        /  \      Golden Tests (E2E with metrics)
       /----\     5–10 tests
      /      \
     /--------\   Integration Tests (API endpoints)
    /          \  30–50 tests
   /------------\
  /              \ Unit Tests (services, checks, utils)
 /________________\ 80–120 tests
```

---

## 2. Test Structure

```
tests/
├── conftest.py                 # Shared fixtures: test client, mock DB, mock AI
├── unit/
│   ├── engine/
│   │   ├── test_terminology.py
│   │   ├── test_banned_words.py
│   │   ├── test_required_text.py
│   │   ├── test_readability.py
│   │   ├── test_colour_check.py
│   │   ├── test_contrast_check.py
│   │   ├── test_alt_text_check.py
│   │   ├── test_resolution_check.py
│   │   ├── test_link_text_check.py
│   │   ├── test_tone_check.py
│   │   ├── test_claim_passport.py
│   │   ├── test_suggestion_gen.py
│   │   └── test_orchestrator.py
│   ├── services/
│   │   ├── test_masking.py
│   │   ├── test_content_service.py
│   │   ├── test_review_service.py
│   │   └── test_audit_service.py
│   ├── parsing/
│   │   ├── test_pdf_parser.py
│   │   ├── test_docx_parser.py
│   │   ├── test_image_parser.py
│   │   └── test_parser_factory.py
│   ├── ai/
│   │   ├── test_ai_response_validation.py
│   │   └── test_provider_abstraction.py
│   └── utils/
│       ├── test_diff.py
│       ├── test_colour.py
│       ├── test_csv_import.py
│       └── test_pagination.py
├── integration/
│   ├── test_auth_api.py
│   ├── test_users_api.py
│   ├── test_rules_api.py
│   ├── test_facts_api.py
│   ├── test_terms_api.py
│   ├── test_assets_api.py
│   ├── test_content_api.py
│   ├── test_findings_api.py
│   ├── test_reviews_api.py
│   ├── test_comments_api.py
│   ├── test_notifications_api.py
│   ├── test_insights_api.py
│   ├── test_state_machine.py
│   └── test_self_approval_guard.py
├── golden/
│   ├── fixtures/
│   │   ├── claim_outdated_001.json
│   │   ├── claim_unsupported_002.json
│   │   ├── banned_term_003.json
│   │   ├── tone_too_casual_004.json
│   │   ├── tone_too_aggressive_005.json
│   │   ├── missing_alt_text_006.json
│   │   ├── wrong_colour_007.json
│   │   ├── low_contrast_008.json
│   │   ├── readability_too_complex_009.json
│   │   ├── multiple_issues_010.json
│   │   └── ... (40–50 total)
│   └── runner.py
└── sample_data/
    ├── sample_rules.json
    ├── sample_facts.json
    ├── sample_terms.json
    └── sample_brand_palette.json
```

---

## 3. Unit Test Specifications

### 3.1 Fixed Check Tests

Each fixed check must test:

| Scenario | Expected |
|---|---|
| Text with a banned word | Finding with correct rule_id, flagged_text, severity |
| Text without any issues | No findings |
| Text with preferred term used correctly | No finding |
| Text with wrong capitalisation (case-sensitive term) | Finding |
| Multiple issues in one text | Multiple findings, one per issue |
| Empty text | No findings, no error |

**Example: `test_terminology.py`**

```python
def test_finds_banned_term():
    """When text contains a banned term, should return a finding."""
    terms = [Term(preferred="customer", banned=["client", "user"])]
    text = "We value every client relationship."
    findings = terminology_check(text, terms)
    assert len(findings) == 1
    assert findings[0].flagged_text == "client"
    assert findings[0].suggested_fix == "customer"

def test_no_findings_for_correct_text():
    """When text uses only preferred terms, should return no findings."""
    terms = [Term(preferred="customer", banned=["client"])]
    text = "We value every customer."
    findings = terminology_check(text, terms)
    assert len(findings) == 0

def test_case_sensitive_matching():
    """Case-sensitive terms should only match exact case."""
    terms = [Term(preferred="BrandProof", banned=["Brandproof", "brandproof"], case_sensitive=True)]
    text = "Use Brandproof for checking."
    findings = terminology_check(text, terms)
    assert len(findings) == 1
```

### 3.2 Masking Tests

```python
def test_masks_email_addresses():
    text = "Contact us at john@example.com for details."
    masked, mapping = masking_service.mask(text)
    assert "john@example.com" not in masked
    assert "[EMAIL_1]" in masked
    assert mapping["[EMAIL_1]"] == "john@example.com"

def test_masks_phone_numbers():
    text = "Call +91 81178 24928 today."
    masked, mapping = masking_service.mask(text)
    assert "+91 81178 24928" not in masked
    assert "[PHONE_1]" in masked

def test_masks_confidential_tags():
    text = "Our revenue is [CONFIDENTIAL]$2.5M[/CONFIDENTIAL] this quarter."
    masked, mapping = masking_service.mask(text)
    assert "$2.5M" not in masked
    assert "[CONFIDENTIAL_1]" in masked

def test_unmask_restores_original():
    text = "Contact john@example.com for revenue [CONFIDENTIAL]$2.5M[/CONFIDENTIAL]."
    masked, mapping = masking_service.mask(text)
    unmasked = masking_service.unmask(masked, mapping)
    # Should restore the readable form
    assert "john@example.com" in unmasked
```

### 3.3 AI Response Validation Tests

```python
def test_valid_ai_response_parses():
    raw = {"findings": [{"rule_id": "R-21", "flagged_text": "guaranteed", ...}]}
    result = AIToneResponse.model_validate(raw)
    assert result.findings[0].rule_id == "R-21"

def test_invalid_ai_response_rejected():
    raw = {"findings": [{"text": "something", "opinion": "bad"}]}  # missing required fields
    with pytest.raises(ValidationError):
        AIToneResponse.model_validate(raw)

def test_finding_without_rule_id_is_discarded():
    raw = {"findings": [{"flagged_text": "text", "rule_id": None}]}
    result = AIToneResponse.model_validate(raw)
    valid = [f for f in result.findings if f.rule_id]
    assert len(valid) == 0
```

### 3.4 Colour & Contrast Tests

```python
def test_wcag_contrast_passes_for_high_contrast():
    ratio = calculate_contrast("#000000", "#FFFFFF")
    assert ratio >= 7.0  # AAA level

def test_wcag_contrast_fails_for_low_contrast():
    ratio = calculate_contrast("#777777", "#888888")
    assert ratio < 4.5  # Fails AA level

def test_palette_match_exact():
    brand_palette = ["#1a73e8", "#34a853", "#fbbc04"]
    image_colours = ["#1a73e8", "#34a853"]
    result = check_palette(image_colours, brand_palette, tolerance=10)
    assert result.all_match is True

def test_palette_mismatch_detected():
    brand_palette = ["#1a73e8", "#34a853"]
    image_colours = ["#ff0000"]  # Not in palette
    result = check_palette(image_colours, brand_palette, tolerance=10)
    assert result.all_match is False
    assert "#ff0000" in result.off_brand_colours
```

---

## 4. Integration Test Patterns

Every API endpoint test must cover:

| Scenario | Expected HTTP |
|---|---|
| Success case | 200/201 |
| Missing/invalid JWT | 401 |
| Insufficient role | 403 |
| Entity not found | 404 |
| Invalid state transition | 409 |
| Validation error | 422 |

**Example: `test_content_api.py`**

```python
async def test_create_content_as_creator(client, creator_token):
    resp = await client.post("/api/v1/content", json={...}, headers=auth(creator_token))
    assert resp.status_code == 201
    assert resp.json()["data"]["content_item"]["status"] == "draft"

async def test_create_content_requires_auth(client):
    resp = await client.post("/api/v1/content", json={...})
    assert resp.status_code == 401

async def test_approve_own_content_forbidden(client, creator_token):
    # Create content as creator, then try to approve as same user
    content = create_content(client, creator_token)
    resp = await client.post(f"/api/v1/content/{content['id']}/approve", headers=auth(creator_token))
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "CONTENT_SELF_APPROVAL"

async def test_invalid_state_transition(client, creator_token):
    content = create_content(client, creator_token)  # status = draft
    # Try to approve directly (skipping check and review)
    resp = await client.post(f"/api/v1/content/{content['id']}/approve", headers=auth(manager_token))
    assert resp.status_code == 409
```

---

## 5. Golden Test Set

### 5.1 Fixture Format

```json
{
  "id": "golden-001",
  "name": "Outdated revenue claim",
  "input": {
    "text": "Our platform cuts reporting time by 60%.",
    "content_type": "text",
    "intent": {
      "purpose": "Product marketing email",
      "audience": "Enterprise CTOs",
      "key_message": "Our platform saves time"
    }
  },
  "context": {
    "facts": [
      {"fact_code": "F-07", "content": "Platform reduces reporting time by 45%", "valid_until": "2026-06-30"}
    ],
    "rules": [],
    "terms": []
  },
  "expected_findings": [
    {
      "category": "claims",
      "check_type": "ai_assisted",
      "flagged_text": "cuts reporting time by 60%",
      "fact_id": "F-07",
      "label": "outdated",
      "severity": "critical"
    }
  ]
}
```

### 5.2 Metrics Computed

| Metric | Formula | Target |
|---|---|---|
| **Detection rate** | (expected findings matched) / (total expected findings) | ≥ 80% |
| **Precision** | (valid findings) / (total findings returned) | ≥ 80% |
| **Explainability** | (findings with valid rule_id or fact_id) / (total findings) | = 100% |
| **False positive rate** | (findings with no matching expected) / (total findings) | ≤ 20% |

### 5.3 Runner Output

```
=== BrandProof Golden Test Results ===
Tests run: 48
Passed:    42
Failed:    6

Detection Rate:   87.5% ✅ (target: ≥80%)
Precision:        82.3% ✅ (target: ≥80%)
Explainability:  100.0% ✅ (target: 100%)

Failed tests:
  - golden-023: Expected "tone_too_casual" finding, got none
  - golden-031: False positive: flagged "fast" as banned (it's not)
  ...
```

---

## 6. CI Pipeline

```yaml
# .github/workflows/test.yml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r requirements.txt
      - run: python -m spacy download en_core_web_sm
      - run: pytest tests/unit/ -v --tb=short
      - run: pytest tests/integration/ -v --tb=short
      - run: python tests/golden/runner.py --fail-on-regression
```

---

## 7. Mocking Strategy

| External Dependency | Mock Strategy |
|---|---|
| Supabase Auth | Mock JWT validation; provide test tokens with known claims |
| Supabase DB | Use a test Supabase project or mock the client |
| Supabase Storage | Mock file operations; return fake signed URLs |
| OpenAI/Gemini API | Mock responses with valid JSON fixtures |
| Tesseract OCR | Mock with pre-extracted text for test images |
| sentence-transformers | Use a small test model or pre-computed embeddings |
