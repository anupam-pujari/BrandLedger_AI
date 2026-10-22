# BrandProof — Frontend Clarifications & Design Decisions

> Decisions that resolve ambiguity in the frontend requirements.

---

## FC-01 · CSS Framework: Tailwind CSS

**From:** frontend-requirements §2

**Decision:** Use **Tailwind CSS** as specified in the planning document.

**Version:** Tailwind CSS v3.x (latest stable).

**Setup:** Via Vite plugin (`@tailwindcss/vite` or `tailwindcss` + `postcss` + `autoprefixer`).

---

## FC-02 · Routing Strategy

**Decision:** Use **React Router v6** for client-side routing.

**Route structure:**

```
/                           → Redirect based on role
/login                      → Login page
/signup                     → Signup + create org

/dashboard                  → Role-based dashboard
/content                    → Content list
/content/new                → Submit new content
/content/:id                → Content detail + findings
/content/:id/review         → Review detail (reviewer view)

/rules                      → Rulebook manager
/rules/compile              → Rulebook compiler (upload PDF)
/facts                      → Facts vault
/terms                      → Terminology manager
/assets                     → Asset library

/insights                   → Insights dashboard
/insights/rule-health       → Rule health detail
/insights/recurring         → Recurring mistakes

/settings                   → Org settings (admin)
/settings/users             → User management (admin)

/notifications              → All notifications
```

---

## FC-03 · State Management

**Decision:** 
- **Server state:** Use **TanStack Query (React Query)** for all API data fetching, caching, and synchronisation.
- **Client state:** Use React's built-in `useState` + `useContext` for auth state and UI state. No Redux or Zustand needed at MVP scale.

**Key queries:**
| Query Key | Endpoint | Stale Time |
|---|---|---|
| `["rules", filters]` | `GET /rules` | 5 min |
| `["facts", filters]` | `GET /facts` | 5 min |
| `["content", filters]` | `GET /content` | 1 min |
| `["content", id]` | `GET /content/:id` | 30 sec |
| `["findings", contentId]` | `GET /content/:id/findings` | 30 sec |
| `["notifications"]` | `GET /notifications` | 30 sec |

---

## FC-04 · Auth Flow

**Decision:** Use **Supabase JS client** (`@supabase/supabase-js`) for auth.

**Flow:**
1. User logs in → Supabase returns JWT.
2. JWT stored in Supabase client's session (handles refresh automatically).
3. Every API call to the backend includes `Authorization: Bearer <access_token>`.
4. On 401 response → redirect to `/login`.
5. AuthContext provides `user`, `isAuthenticated`, `role`, `orgId` to the app.

---

## FC-05 · Role-Based UI

**Decision:** A single app with **conditional rendering** based on the user's role.

| Navigation Item | Creator | Reviewer | Brand Manager | Admin |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Submit Content | ✅ | ❌ | ✅ | ❌ |
| My Content | ✅ | ❌ | ✅ | ❌ |
| Review Queue | ❌ | ✅ | ✅ | ❌ |
| Rulebook | ❌ (view only) | ❌ (view only) | ✅ (full CRUD) | ❌ |
| Facts Vault | ❌ (view only) | ✅ (view only) | ✅ (full CRUD) | ❌ |
| Terminology | ❌ (view only) | ❌ | ✅ (full CRUD) | ❌ |
| Asset Library | ❌ (view only) | ❌ | ✅ (full CRUD) | ❌ |
| Insights | ❌ | ❌ | ✅ | ❌ |
| User Management | ❌ | ❌ | ❌ | ✅ |
| Settings | ❌ | ❌ | ❌ | ✅ |

---

## FC-06 · Form Handling

**Decision:** Use **React Hook Form** with Zod for validation.

**Rationale:** Type-safe validation, good performance, minimal re-renders.

---

## FC-07 · File Upload Strategy

**Decision:**
- Use `<input type="file">` with drag-and-drop zone.
- Files are sent as `multipart/form-data` to the backend.
- Show upload progress with a progress bar.
- Preview images immediately after selection (local blob URL).
- For PDFs and DOCX, show filename + size while backend processes.

---

## FC-08 · Notification Polling

**Decision for MVP:** Poll `GET /notifications` every 30 seconds using React Query's `refetchInterval`.

**Future (Could):** Upgrade to Supabase Realtime subscriptions for instant updates.

---

## FC-09 · Error Handling

**Decision:**
- Global error boundary for uncaught errors.
- Toast notifications for API errors (using a toast library like `react-hot-toast`).
- Error messages display the `error.message` from the API envelope.
- Network errors show "Connection lost. Retrying..." with auto-retry.

---

## FC-10 · Design System

**Decision:** Build a consistent design system using Tailwind:

| Token | Value | Usage |
|---|---|---|
| Primary | `blue-600` | Buttons, links, active states |
| Success | `green-600` | Approved states, success messages |
| Warning | `amber-500` | Warning severity, pending states |
| Danger | `red-600` | Critical severity, error states |
| Info | `sky-500` | Info severity, informational badges |
| Neutral | `slate-*` | Text, borders, backgrounds |
| Font | `Inter` (Google Fonts) | All text |
| Border radius | `rounded-lg` | Cards, buttons, inputs |
| Spacing | Tailwind default scale | — |
| Shadows | `shadow-sm` to `shadow-lg` | Cards, modals, dropdowns |

---

## FC-11 · Component Library

**Decision:** Use **Headless UI** (`@headlessui/react`) for complex unstyled components (modals, dropdowns, comboboxes, tabs) and style them with Tailwind. No heavy UI library like Material UI or Ant Design.

**Additional packages:**
| Package | Purpose |
|---|---|
| `@heroicons/react` | Icons |
| `react-hot-toast` | Toast notifications |
| `react-dropzone` | File upload zone |
| `diff-match-patch` | Client-side diff rendering |
| `recharts` | Charts for insights dashboard |
| `date-fns` | Date formatting |

---

## FC-12 · Loading & Empty States

**Decision:**
- **Loading:** Skeleton loaders (pulse animations) for content areas. Spinner for button actions.
- **Empty:** Illustration + message + CTA for empty lists (e.g. "No rules yet. Create your first rule.").
- **Error:** Retry button + error message.
