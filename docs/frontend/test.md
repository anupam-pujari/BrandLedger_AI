# BrandProof — Frontend Testing Strategy & Test Plan

> Comprehensive testing specifications for the React + Vite frontend application.
> Details unit, component, integration, and accessibility test suites using Vitest, React Testing Library, and axe-core.

---

## 1. Testing Framework & Tooling

| Purpose | Tool | Configuration |
|---|---|---|
| **Test Runner** | Vitest | Fast Vite-native test execution with JSDOM environment |
| **Component Testing** | React Testing Library (RTL) | User-centric DOM testing without implementation coupling |
| **Accessibility Audit** | `@axe-core/react` / `vitest-axe` | Automated WCAG 2.1 AA compliance scans |
| **Mocking API Layer** | Mock Service Worker (MSW) | Intercepts HTTP requests at network level using `api-contract.md` specs |
| **User Event Simulation** | `@testing-library/user-event` | Real browser event simulation (focus, tab order, clicks) |

---

## 2. Testing Frontend Constitution Rules (Non-Negotiable)

Every principle in `docs/frontend/constitution.md` has an automated test:

| Constitution ID | Rule Description | Automated Test Specification |
|---|---|---|
| **FC1.1** | UI must never auto-apply suggestions | Mount `<ContentEditor />` with active findings; assert that editor content remains unchanged until an explicit `Accept` click is fired. |
| **FC1.2** | Dismissal requires justification for critical/warning | Mount `<FindingCard severity="critical" />`; click `Dismiss`; assert that `<DismissalModal />` opens and `Submit` button remains disabled until text is typed. |
| **FC1.3** | "Approve" button hidden if user is author | Mount `<ReviewActions contentAuthorId="user-123" currentUserId="user-123" />`; assert `queryByRole('button', { name: /approve/i })` is null. |
| **FC2.1** | Every finding card must cite proof | Mount `<FindingCard />`; assert presence of either Rule citation (Code, Quote, Page) or Fact citation (Code, Expiry date). |
| **FC2.2** | Distinct badges for Rule vs AI check | Mount finding with `check_origin: "rule_check"` and assert "Rule check" badge; mount with `ai_assisted` and assert "AI-assisted" badge. |
| **FC2.3** | Low confidence findings marked "Needs human judgement" | Mount AI finding with `confidence: 0.65`; assert text `"Needs human judgement"` is visible and card has dimmed border class. |
| **FC3.1** | No secret API keys exposed | Test bundle asset scanner asserting zero occurrences of `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY`. |
| **FC3.2** | AI disclosure panel visible on every review | Mount review view; assert `<AIDisclosurePanel />` is rendered in DOM without needing to open dropdown or menu. |
| **FC4.1 - 4.5** | Accessibility & WCAG 2.1 AA | Run `axe(container)` on all core page views; assert zero critical or serious accessibility violations. |
| **FC5.1** | Critical actions wait for server confirmation | Click "Approve"; assert UI remains in loading state and does not show success screen until API returns HTTP 200. |

---

## 3. Core Component Test Suites

### 3.1 `<FindingCard />` Test Suite

```typescript
describe('<FindingCard />', () => {
  const mockFinding: Finding = {
    id: 'f-1',
    contentId: 'c-1',
    versionNumber: 1,
    severity: 'critical',
    checkOrigin: 'rule_check',
    category: 'terminology',
    title: 'Banned Term Detected',
    flaggedText: 'guaranteed',
    startCharIndex: 10,
    endCharIndex: 20,
    whyExplanation: 'Rule R-21 prohibits absolute guarantees in promotional copy.',
    proof: {
      type: 'rule',
      ruleCode: 'R-21',
      ruleTitle: 'Promotional Accuracy',
      sourceQuote: 'Never promise guaranteed uptime without SLA contract.',
      sourcePageNumber: 14,
    },
    confidence: 1.0,
    needsHumanJudgement: false,
    suggestedFix: {
      originalText: 'guaranteed',
      replacementText: 'designed to support',
      explanation: 'Use realistic performance wording.'
    },
    isResolved: false
  };

  it('renders severity badge, check type, and exact flagged text', () => {
    render(<FindingCard finding={mockFinding} onAccept={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText(/rule check/i)).toBeInTheDocument();
    expect(screen.getByText('guaranteed')).toBeInTheDocument();
  });

  it('renders proof citation with page number', () => {
    render(<FindingCard finding={mockFinding} onAccept={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText(/Rule R-21/i)).toBeInTheDocument();
    expect(screen.getByText(/Page 14/i)).toBeInTheDocument();
    expect(screen.getByText(/Never promise guaranteed uptime/i)).toBeInTheDocument();
  });

  it('triggers onAccept with suggestion when Accept button clicked', async () => {
    const onAccept = vi.fn();
    render(<FindingCard finding={mockFinding} onAccept={onAccept} onDismiss={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /accept fix/i }));
    expect(onAccept).toHaveBeenCalledWith('f-1', 'designed to support');
  });

  it('opens dismissal modal instead of directly dismissing on Critical severity', async () => {
    const onDismiss = vi.fn();
    render(<FindingCard finding={mockFinding} onAccept={vi.fn()} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    // Modal should be opened; onDismiss should not be called without reason
    expect(screen.getByRole('dialog', { name: /dismiss finding/i })).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
```

---

### 3.2 `<DismissalReasonModal />` Test Suite

```typescript
describe('<DismissalReasonModal />', () => {
  it('disables submit button when justification is empty', () => {
    render(
      <DismissalReasonModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        severity="critical"
      />
    );
    const submitBtn = screen.getByRole('button', { name: /confirm dismissal/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button and dispatches reason payload on valid input', async () => {
    const onSubmit = vi.fn();
    render(
      <DismissalReasonModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        severity="critical"
      />
    );
    const textarea = screen.getByPlaceholderText(/enter reason for overriding/i);
    await userEvent.type(textarea, 'Approved by Legal counsel under exception #402');
    
    const submitBtn = screen.getByRole('button', { name: /confirm dismissal/i });
    expect(submitBtn).toBeEnabled();
    await userEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledWith({
      reason: 'Approved by Legal counsel under exception #402',
      category: expect.any(String)
    });
  });
});
```

---

### 3.3 `<VersionDiffView />` Test Suite

```typescript
describe('<VersionDiffView />', () => {
  it('renders green highlight for additions and red strikethrough for deletions', () => {
    const textV1 = "We guarantee 100% uptime in India.";
    const textV2 = "We design for 99.9% uptime in India.";

    render(<VersionDiffView originalText={textV1} modifiedText={textV2} />);

    const deletion = screen.getByText('guarantee 100%');
    expect(deletion).toHaveClass('diff-deletion'); // red background, strikethrough

    const addition = screen.getByText('design for 99.9%');
    expect(addition).toHaveClass('diff-addition'); // green background
  });
});
```

---

## 4. Integration & User Journey Tests

### 4.1 Creator Review Journey
1. Creator opens `/content/new` and pastes draft containing an outdated claim: `"cuts reporting time by 60%"`.
2. Fills Intent Lock: Purpose = `"Product Announcement"`, Audience = `"Enterprise"`, Key Message = `"Speed increase"`.
3. Clicks `"Run Brand Pre-Check"`.
4. MSW returns HTTP 202 followed by polling status completion.
5. Verifies UI displays Claim Passport card flagging outdated claim against Fact F-07.
6. Clicks `"Accept Fix"` -> editor text updates to `"cuts reporting time by up to 45%"`.
7. Clicks `"Submit for Review"` -> status badge transitions to `"In Review"`.

### 4.2 Reviewer Approval Journey
1. Reviewer logs in and visits `/review/queue`.
2. Clicks submitted draft to open `/review/:id`.
3. Inspects side-by-side diff between v1 and v2.
4. Adds inline comment on paragraph 2.
5. Clicks `"Approve for Publication"`.
6. Verifies content status transitions to `"Approved"` and `"Download PDF Approval Record"` button appears.

---

## 5. Accessibility Testing Matrix (WCAG 2.1 AA)

```typescript
describe('Accessibility Audits', () => {
  it('passes axe scan on Dashboard', async () => {
    const { container } = render(<DashboardPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe scan on Review Workspace with Open Findings', async () => {
    const { container } = render(<ContentReviewPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('traps focus inside Dismissal Modal when opened', async () => {
    render(<DismissalReasonModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    const firstFocusable = screen.getByRole('combobox');
    const lastFocusable = screen.getByRole('button', { name: /cancel/i });

    firstFocusable.focus();
    expect(document.activeElement).toBe(firstFocusable);

    // Tab backwards from first focusable element
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(lastFocusable);
  });
});
```

---

## 6. Golden Test Set UI Verification

The frontend test harness executes against the Golden Test Set (40-50 sample drafts) to verify:
- Zero crashes on unexpected finding shapes.
- 100% of findings display a valid cited rule code or fact code.
- Every claim match status (`supported`, `outdated`, `conflicting`, `unsupported`) renders the proper visual badge.
- Long text excerpts and multi-page guideline citations wrap properly without layout overflows.
