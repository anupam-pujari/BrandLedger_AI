# BrandProof — Frontend Design System & Tokens

> Visual specifications, color tokens, typography, component aesthetics, and Tailwind CSS design tokens.
> Ensures BrandProof looks premium, modern, accessible (WCAG 2.1 AA), and embodies the brand governance quality it inspects.

---

## 1. Design Principles

1. **Proof-Centric Visuals**: The UI prioritizes clarity and credibility. Citations, fact proofs, and source quotes look authoritative and distinct from editorial comments.
2. **Accessible by Default**: Every color combination meets WCAG 2.1 AA contrast standards (minimum 4.5:1 for normal text, 3:1 for large UI components).
3. **Calm, High-Information Density**: Designed for enterprise marketing, legal, and brand review workflows. Clean borders, subtle shadows, and purposeful whitespace avoid visual clutter while packing rich detail into finding cards and diffs.
4. **Color Independence**: Severity, status, and origin are always reinforced with explicit icons and text labels, never color alone.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Core Neutral Palette (Slate/Zinc)

| Token | Hex | Usage |
|---|---|---|
| `bg-app` | `#0B0F19` (Dark) / `#F8FAFC` (Light) | Global page background |
| `surface-card` | `#111827` (Dark) / `#FFFFFF` (Light) | Card surfaces, modals, popovers |
| `surface-elevated` | `#1F2937` (Dark) / `#F1F5F9` (Light) | Table headers, code blocks, active items |
| `border-subtle` | `#374151` (Dark) / `#E2E8F0` (Light) | Card borders, dividers, table rows |
| `text-primary` | `#F9FAFB` (Dark) / `#0F172A` (Light) | Headings, primary content, titles |
| `text-secondary` | `#9CA3AF` (Dark) / `#64748B` (Light) | Captions, metadata, helper text |

---

### 2.2 Semantic Severity Colors

Tested against white and dark backgrounds to ensure WCAG 2.1 AA compliance:

| Severity | Badge Background | Text / Icon Color | Border Accent | Semantic Meaning |
|---|---|---|---|---|
| **Critical** | `#FEF2F2` (Light) / `#450A0A` (Dark) | `#DC2626` | `#F87171` | Banned terms, legal disclaimers missing, false claims |
| **Warning** | `#FFFBEB` (Light) / `#451A03` (Dark) | `#D97706` | `#FBBF24` | Outdated facts, off-tone language, missing alt text |
| **Info** | `#EFF6FF` (Light) / `#172554` (Dark) | `#2563EB` | `#60A5FA` | Preferred terminology suggestion, readability note |
| **Success** | `#ECFDF5` (Light) / `#064E3B` (Dark) | `#059669` | `#34D399` | Clean check, approved content, verified claim |

---

### 2.3 Check Origin Badges

| Type | Visual Styling | Icon | Meaning |
|---|---|---|---|
| **Rule Check** | Purple tint (`bg-purple-50 text-purple-700 border-purple-200`) | `<Code2 className="w-3.5 h-3.5" />` | Deterministic exact match from regex, spaCy, or contrast math |
| **AI-Assisted** | Indigo/Cyan gradient tint (`bg-cyan-50 text-cyan-800 border-cyan-200`) | `<Sparkles className="w-3.5 h-3.5" />` | LLM-based judgement call (tone, claim inference) |

---

### 2.4 Claim Passport Status Pills

| Status | Color | Pill Label | Icon |
|---|---|---|---|
| **Supported** | Emerald green | `Claim Verified` | `<CheckCircle2 />` |
| **Outdated** | Amber orange | `Fact Expired` | `<Clock />` |
| **Conflicting** | Rose red | `Fact Conflict` | `<AlertOctagon />` |
| **Unsupported** | Slate gray / Amber | `Unverified Claim` | `<HelpCircle />` |

---

## 3. Typography Scale

BrandProof uses **Inter** or **Outfit** via Google Fonts with system font fallbacks:

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

| Class | Font Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text-2xl` | 24px (1.5rem) | 32px | Bold (700) | Main page titles, dashboard headings |
| `text-xl` | 20px (1.25rem) | 28px | SemiBold (600) | Modal headers, section titles |
| `text-lg` | 18px (1.125rem) | 24px | Medium (500) | Card headings, queue item titles |
| `text-base` | 16px (1.0rem) | 24px | Regular (400) | Content body text, editor content |
| `text-sm` | 14px (0.875rem) | 20px | Regular / Medium | Table rows, finding card descriptions |
| `text-xs` | 12px (0.75rem) | 16px | Medium / SemiBold | Badges, pills, metadata, timestamps |
| `font-mono` | 13px (0.8125rem) | 20px | Regular (400) | Flagged text excerpts, rule codes (`R-21`) |

---

## 4. Key Component Anatomy

### 4.1 Finding Card Anatomy

```
┌────────────────────────────────────────────────────────────────────────┐
│ [ CRITICAL ]  [ RULE CHECK ]                  Rule R-21 · Terminology  │
│                                                                        │
│ Banned promotional guarantee                                           │
│ Flagged: "guaranteed 100% uptime"                                      │
│                                                                        │
│ Why: Promotional copy must not offer absolute guarantees without       │
│      an approved enterprise SLA addendum.                              │
│                                                                        │
│ ┌─ PROOF ────────────────────────────────────────────────────────────┐ │
│ │ Source: Brand_Guidelines_2026.pdf (Page 14, Line 8)                │ │
│ │ Quote: "Avoid absolute guarantees in marketing copy."              │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌─ SUGGESTED FIX (Meaning check preserved: 100%) ────────────────────┐ │
│ │ "designed to provide up to 99.9% uptime"                           │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ [ Accept Fix ]      [ Edit Fix ]                     [ Dismiss... ]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Version Diff View Anatomy

Using `diff-match-patch`:
- **Deletions**: Red background `#FEE2E2`, red text `#991B1B`, line-through decoration.
- **Additions**: Green background `#DCFCE7`, green text `#166534`, underlined or bolded.
- **Unchanged**: Standard body color and background.

---

### 4.3 AI Disclosure Drawer Anatomy

```
┌────────────────────────────────────────────────────────────────────────┐
│ ✦ AI Disclosure & Privacy Report (Claude 3.5 Sonnet)                   │
│ Timestamp: 2026-10-22 20:45:12 UTC · Request Latency: 1.14s          │
│                                                                        │
│ Privacy Gate Actions:                                                  │
│ • 2 email addresses scrubbed                                           │
│ • 1 customer phone number masked: [PHONE-MASKED-1]                     │
│ • Confidential pricing tag masked: [CONFIDENTIAL-DATA-1]               │
│                                                                        │
│ Dispatched Prompt Excerpt:                                             │
│ > Check claim support against Fact F-07. Masked text: "ApexCloud cuts  │
│ > reporting time by up to [CONFIDENTIAL-DATA-1]..."                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Tailwind CSS Configuration Preset

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          900: '#312E81',
        },
        severity: {
          critical: '#DC2626',
          warning: '#D97706',
          info: '#2563EB',
          success: '#059669',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'modal': '0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)',
      }
    },
  },
  plugins: [],
};
```
