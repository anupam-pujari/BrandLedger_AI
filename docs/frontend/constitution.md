# BrandProof — Frontend Constitution (Non-Negotiable Principles)

> Rules the frontend must never violate.

---

## 1. Human Authority in the UI

- **FC1.1** — The UI must **never auto-apply** suggestions. Every suggestion requires explicit user action (Accept / Edit / Dismiss).
- **FC1.2** — Dismiss buttons for critical/warning findings must require a reason input before proceeding.
- **FC1.3** — The "Approve" button must not appear for content the current user authored. The backend enforces this too, but the UI must prevent the action from even being visible.

---

## 2. Explainability in the UI

- **FC2.1** — Every finding card must show the **rule or fact** that backs it up. If there is no proof, the finding should not be rendered.
- **FC2.2** — AI-assisted findings must be clearly labelled with an "AI-assisted" badge. Rule-check findings get a "Rule check" badge.
- **FC2.3** — Low-confidence findings must visually differ from high-confidence ones (dimmed, italic, or with a "Needs human judgement" label).

---

## 3. Privacy in the UI

- **FC3.1** — The frontend must **never** store API keys, service keys, or any secrets.
- **FC3.2** — The AI disclosure panel must be visible and accessible on every review. It must not be hidden behind a settings menu.
- **FC3.3** — File previews must use **signed URLs** from the backend, not direct storage URLs.
- **FC3.4** — When "rules only" mode is active, the UI must clearly indicate that no AI was used.

---

## 4. Accessibility

- **FC4.1** — Colour contrast must meet **WCAG 2.1 AA** (4.5:1 for normal text, 3:1 for large text).
- **FC4.2** — All interactive elements must be **keyboard accessible** with visible focus indicators.
- **FC4.3** — All images, icons, and visual indicators must have **alt text or aria-labels**.
- **FC4.4** — Modals must trap focus and restore it on close.
- **FC4.5** — Severity levels must not rely solely on colour — always include text labels and/or icons.

---

## 5. Data Integrity

- **FC5.1** — Optimistic updates are allowed only for non-critical actions (e.g. mark notification as read). State-changing actions (approve, dismiss, submit) must wait for server confirmation.
- **FC5.2** — Form submissions must be debounced or disabled during pending requests to prevent duplicate submissions.
- **FC5.3** — Stale data warnings must appear when the server version differs from the displayed version.

---

## 6. Consistency

- **FC6.1** — All pages use the shared design tokens (colours, spacing, typography) from the design system. No ad-hoc colour values.
- **FC6.2** — Navigation structure must be consistent across all pages. The sidebar or top nav must not change layout between pages.
- **FC6.3** — Loading, empty, and error states must follow a consistent pattern across all pages.
