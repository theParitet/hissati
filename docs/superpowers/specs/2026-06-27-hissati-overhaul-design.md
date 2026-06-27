# Hissati — Design & Website Overhaul (Orchestration Spec)

> **Date:** 2026-06-27 · **Status:** approved for planning
> Single source of truth for the multi-agent design/website overhaul. The deterministic core (engine, matching, program data, store) is **not** redesigned — only the metric layer, views, identity, docs, and supporting features.

---

## 1. Goal

Overhaul Hissati's design and UX to win the Tatweer Hackathon (judged on Impact, Relevance, Feasibility, Readiness, Scalability, Falsifiability/Evidence, Documentation, Presentation). The overhaul must stay true to the non-negotiables: offline-first, Arabic-first bilingual RTL/LTR, deterministic cited core, no dead-ends, agent optional.

The whole overhaul is organized around **one honest, cited number — "AED within reach"** — which is simultaneously the headline metric, the demo climax, the PDF headline, the share message, and the thing the dashboard visualizes. Designing around one number keeps nine work streams coherent.

## 2. Locked decisions (from brainstorming)

| Decision | Choice |
|---|---|
| **Visual identity** | Hybrid: keep the warm-desert base, fix the token system, spend the one bold move on a **"funding sky"** signature in the dashboard Overview. |
| **Logo** | Clean + **extract an atomic transparent mark** (no redesign). Must be swappable on the dev side (one source file / `<Logo>` component). |
| **Headline metric** | Replace the Readiness Score with a compact **stat strip led by "AED within reach"** (cited) + programs eligible (N of M) + steps done. |
| **Deploy + API key** | Handled by the user. App must still work fully with the agent OFF. |
| **Screenshots** | Produced by the orchestrator via Playwright (driving the real app), swappable later. |
| **Timeline** | Full overhaul, quality-first, parallelized where safe. |
| **Nav label for dashboard** | "My plan" (warmer than "Dashboard" for a first-time founder). |
| **Dark mode** | No global theme toggle. The dashboard Overview's funding-sky is genuinely dark as its signature surface. |
| **Questionnaire** | Logic untouched; inherits new tokens/components automatically. |

## 3. Product / UX architecture (the "what")

### 3.1 Dashboard (replaces the one-long-page `/results`) — 3 tabs
- **Overview** — the hero. Compact stat strip: **AED within reach** (sum of eligible programs, cited) · **Programs N eligible / M total** · **Steps done**. Below it, the **funding sky**: each matched program is a star — lit (eligible) / glowing (almost) / dim (not-fit) — that lights up as roadmap steps complete. Plus the 1–3 highest-impact next actions. This is the live-demo "watch it climb" moment, made of real money. The funding-sky is dark (the signature surface).
- **Programs** — all programs in detail: eligible / almost / not-fit, restructured compact & scannable; each names the blocking rule + cited remedy; verified stamps on figures; compare.
- **Checklist** — per-program application checklist (documents to gather + requirements met); the tangible take-away; ties into PDF/share.

Compact, concise, modern, UX-first. Not verbose.

### 3.2 Identity & CSS (task 1)
- Reconcile `design.md` ↔ the real Tailwind-v4 `@theme`. **Keep the shipping token names** (`oasis / amber / clay / sand / ink / night / palm / almost`), not the doc's `green/gold/red/bone`. Reconcile hex to the build.
- Deepen the cream base; reserve true cream for paper/PDF.
- **Restrain Al Sadu** to one signature surface (hero band) + the **PDF seal** — off every card/modal/header.
- Promote `night` for the funding sky. Add missing tokens: focus ring (single source of truth), motion durations, skeleton, elevation.
- `prefers-reduced-motion` respected.

### 3.3 Header & naming (task 6)
- Product name locked: **Hissati / حِصّتي**.
- Top nav: **My plan** (dashboard) · **Assistant** · **My details** (questionnaire). Logo → home.
- Remove all "readiness" terminology. Unify "results/matches/readiness" → consistent set.
- Use the extracted swappable `<Logo>`.

### 3.4 Assistant (tasks 5 + 9 — one owner; same surface)
- Modern, uncluttered chat. **Reuse** `ProgramCard` / `CompareView` / compact stat chips instead of dumping walls of markdown into the thread.
- Tighter grounding chips; better empty / loading / error states.
- Model never emits HTML; app renders all UI from structured tool results (unchanged architecture).
- Fully functional with the agent OFF.

### 3.5 PDF + WhatsApp (task 7 — brainstorm + implement)
- Reframe from "share a number" to "share a **next action with receipts**."
- **PDF** → a real **Funding Readiness Plan**: founder context, cited sources + verified dates, the document checklist they can carry to TAMM / a bank. A judged artifact (Readiness + Evidence). Needs its own layout (currently only a bare print stylesheet) and an Al Sadu seal. Must survive html2canvas and render Arabic RTL.
- **WhatsApp** → shares the top eligible program + AED + apply link (+ a QR to the live URL, since deploy is handled). Per-program share from the checklist; plan-level share from the dashboard.

## 4. The metric layer (task 8 — foundation-owned)

**Remove:** `readinessScore`, `readinessBreakdown` (from `scoring.ts`), the `ReadinessGauge` component, `yourReadiness` / `readinessHint` i18n keys, the readiness header in PDF, the `readiness_score` field in the agent tool result.

**Add** (new `lib/metrics.ts`, pure, deterministic, offline):
```ts
// All values derived from the engine's EvaluatedProgram[] — cited, falsifiable.
export interface ProgressStats {
  aedReachableNow: number;        // see AED rule below
  aedReachableAfterSteps: number; // eligible + almost (what unlocks via the roadmap)
  programsEligible: number;
  programsAlmost: number;
  programsTotal: number;
  stepsDone: number;
  stepsTotal: number;
}
export function progressStats(
  profile: Partial<Profile>,
  evaluated: EvaluatedProgram[],
  doneSteps: DoneStep[],
): ProgressStats;
```
- **AED rule (must be honest & cited, no inflation):** `aedReachableNow` = sum over *eligible* programs of each program's upper funding bound (`amount.max_aed`). Programs with a null/open `max_aed` contribute a documented representative figure derived from `amount.notes` (and are visibly flagged as "up to / varies", never silently rounded up). The exact rule is implemented once in `lib/metrics.ts` and documented there.
- `aedReachableNow` and `programsEligible` MUST be **monotonic non-decreasing** as roadmap steps complete (replaces the readiness "climb" invariant).
- Keep the headline beat: **Khalifa flips almost → eligible at step 2** of the date-founder path.

**Tests:** rewrite `tests/scoring.test.ts` climb assertions to assert the new climb (`aedReachableNow` / `programsEligible` rise monotonically across the four date-founder fixtures; Khalifa flips at step 2). Keep all other test files green (engine, programs, completeness, checklist, compare).

## 5. Orchestration architecture (the "how", overlap-proof)

Per CLAUDE.md: foundation on one trunk first; then parallelize; never parallelize edits to the same files.

### Wave 0 — Foundation (one trunk, sequential, gated by orchestrator)
Builds the shared layer + a **frozen interface contract** (§6) everything else compiles against. Nothing fans out until this is merged and the contract is frozen. Scope:
- `@theme` token system in `globals.css` (§3.2).
- New shared primitives in `ui.tsx` (§6.2).
- Swappable `<Logo>` + **extracted atomic transparent SVG** (§6.4).
- Metric layer (§4): remove readiness, add `lib/metrics.ts`, rewrite climb test, update agent tool field, i18n keys.
- i18n + naming consolidation (§3.3).
- Frozen-prop baselines for cross-leaf components (`ProgramCard`, `CompareView`, `AskBar`) and **compile-able stubs** for `ShareSheet` + `lib/share.ts` + `pdf.ts` signature so leaves compile in parallel.

### Wave 1 — Parallel leaves (worktree-isolated, disjoint file ownership)
Each leaf invokes the `frontend-design` skill, builds against the frozen contract, keeps `npm run build` + `npm test` green in its worktree, and merges back only when green.

### Wave 2 — Finishing (after all leaves merge)
- Orchestrator captures real screenshots via Playwright → swaps into landing `<DeviceMockup>` placeholders.
- Docs agent (task 4): update the **judged README**, reconcile `design.md` to the final code, refresh `CLAUDE.md` build status + `AGENTS.md`.
- Write a short **golden-path demo script** for the live final (Presentation, criterion 8).
- Final verification: full build + test + Playwright walkthrough (incl. offline + RTL).

## 6. The frozen interface contract

> Leaf agents may freely change the **internals/visuals** of files they own. They MUST NOT break these interfaces, and MUST NOT edit files they don't own. Shared component **props** below are contract — the owning leaf may add optional props but not break existing ones.

### 6.1 Design tokens (names are contract; exact hex finalized in Wave 0)
`oasis{,-deep,-tint}` · `amber{,-deep,-tint}` · `clay{,-deep,-tint}` · `sand{,-2}` · `paper` · `ink{,-2,-3,-faint}` · `night{,-…}` · semantic `palm` (eligible), `almost`, plus `radius-card/pill`, `shadow-card/lift`, focus-ring, motion durations. Semantic usage: eligible→green, almost→amber, not-fit→muted clay/ink-3, money→amber + mono, verified→clay/red stamp.

### 6.2 New shared primitives (`src/components/ui.tsx`)
- `Tabs({ tabs: {id,label}[], active, onChange })`
- `Stat({ label, value, sub?, tone? })`
- `Money({ aed, locale, className? })` + `formatAED(aed, locale)` util (mono, `dir="ltr"`, locale digits)
- `VerifiedStamp({ sourceUrl, verifiedDate, locale })`
- `StatusPill({ status: 'eligible'|'almost'|'not_fit', locale })`
- `Skeleton`, `EmptyState({ icon?, title, desc?, action? })`
- (existing `Button`, `Card`, `Badge`, `Eyebrow` retained)

### 6.3 Metric API — §4 `progressStats()` / `ProgressStats`.

### 6.4 Logo — `<Logo variant?: 'mark'|'lockup'|'stacked', className? />`, backed by a single atomic transparent SVG source (swappable). Used by Header, Landing, PDF.

### 6.5 Cross-leaf component props (frozen; owner edits visuals only)
- `ProgramCard` — owned by **Dashboard (L1)**, consumed read-only by **Assistant (L3)**. Frozen props: at minimum `{ program, status, evaluated, onOpenChecklist?, compact? }` (Wave 0 seeds baseline + exact prop list).
- `CompareView` — owned by **L1**, consumed read-only by **L3**. Frozen: `{ programIds | evaluated[] , locale }`.
- `AskBar` — owned by **Assistant (L3)**, consumed by **Landing (L2)** + **Dashboard (L1)**. Frozen: `{ seed?, variant?, className? }`.

### 6.6 Stubs (Wave 0 creates compile-able stubs; L5 implements)
- `lib/share.ts` → `buildSharePayload(...)`, `waHref(payload)`, QR helper.
- `components/ShareSheet.tsx` → `<ShareSheet payload />`.
- `lib/pdf.ts` → `exportPlanPdf({ profile, evaluated, steps, stats, locale })` (signature frozen; L5 rewrites body).

## 7. File-ownership map (no write–write overlap)

| Stream | Owns (edits) | Imports only (must not edit) |
|---|---|---|
| **Wave 0 Foundation** | `globals.css`, `ui.tsx`, `lib/metrics.ts` (new), `scoring.ts`, `i18n.ts`, `store.ts` (if needed), `components/Logo.tsx` + `public/` logo SVGs, delete `ReadinessGauge.tsx`, `tests/scoring.test.ts`, baseline `ProgramCard`/`CompareView`/`AskBar` + stubs (`ShareSheet`, `lib/share.ts`, `pdf.ts` sig) | — |
| **L1 Dashboard** | `app/results/page.tsx`, `components/dashboard/*` (new, incl. funding-sky + money counter), `ProgramCard.tsx`, `CompareView.tsx`, `ChecklistDialog.tsx`, `RoadmapStepCard.tsx`, `MatchesPanel.tsx` | `ui.tsx`, `metrics.ts`, `ShareSheet`, `Logo`, `AskBar` |
| **L2 Landing** | `app/page.tsx`, `components/landing/*` (new, incl. `<DeviceMockup>`), `public/screenshots/*` (placeholders) | `ui.tsx`, `Logo`, `AskBar`, `metrics.ts` |
| **L3 Assistant** | `app/assistant/page.tsx`, `Assistant.tsx`, `AskBar.tsx`, `Markdown.tsx`, `lib/assistant-store.ts`, `lib/agent-tools.ts`, `app/api/agent/route.ts` | `ui.tsx`, `ProgramCard`, `CompareView`, `metrics.ts` |
| **L4 Header** | `AppHeader.tsx`, `DirectionManager.tsx` (if needed) | `Logo`, `ui.tsx`, `i18n.ts` |
| **L5 PDF + Share** | `lib/pdf.ts`, `lib/share.ts`, `components/ShareSheet.tsx` | `metrics.ts`, `Logo`, `ui.tsx` |
| **Wave 2 Docs** | `README.md`, `.local-docs/design.md`, `CLAUDE.md`, `AGENTS.md`, `docs/*` | — |

**Merge order:** Foundation → (L4 Header, L5 PDF/Share early as they're small) → L1 Dashboard → L3 Assistant (consumes L1's ProgramCard) → L2 Landing → Wave 2 (screenshots + docs). Worktrees branch from post-foundation main; frozen props keep parallel work compiling regardless of merge timing.

## 8. Per-stream Definition of Done
Every stream: `npm run build` (Turbopack typecheck) + `npm test` green; bilingual AR/EN + RTL verified; offline-safe (no runtime CDN); `prefers-reduced-motion` respected; no readiness terminology; uses contract primitives, no duplicated styles.

## 9. Risks & mitigations
- **Merge churn** → frozen contract + disjoint file ownership + worktree isolation.
- **Readiness removal breaks tests** → metric layer + test rewrite done in Wave 0 before fan-out.
- **Funding-sky over-scopes** → bounded to the Overview hero only (Hybrid decision).
- **Screenshots chicken-and-egg** → landing builds against placeholders; real screens swapped in Wave 2.
- **design.md ↔ code drift** → Wave 0 reconciles code; Wave 2 reconciles the doc to final reality.
- **Agent OFF** → app stays fully functional; assistant degrades gracefully.

## 10. Out of scope
Questionnaire redesign; new program data; backend/persistence; a global dark-mode toggle; native mobile.
