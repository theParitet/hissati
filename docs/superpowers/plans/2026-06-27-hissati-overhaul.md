# Hissati Design & Website Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (foundation) and superpowers:dispatching-parallel-agents (leaves). Steps use checkbox (`- [ ]`) syntax for tracking. Spec: `docs/superpowers/specs/2026-06-27-hissati-overhaul-design.md`.

**Goal:** Overhaul Hissati's design/UX (identity, 3-tab dashboard, landing, assistant, header, PDF/WhatsApp, docs) around one cited number — "AED within reach" — replacing the readiness score, to win the Tatweer Hackathon.

**Architecture:** A shared **foundation** (tokens, primitives, metric layer, logo, i18n/naming, contract stubs) lands first on `main` and leaves it building green. Then five **leaf agents** work in isolated git worktrees against a frozen interface contract with disjoint file ownership, merging back when green. A **finishing wave** adds real screenshots, the judged README, doc reconciliation, and a demo script.

**Tech Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 (CSS-first `@theme`, no config file) · Zustand+persist · Vitest · self-hosted next/font (Tajawal, Fraunces, +IBM Plex Mono) · html2canvas+jsPDF · hand-written `public/sw.js`.

## Global Constraints

- **Offline-first:** no runtime CDN; all assets bundled locally; core flow works in airplane mode.
- **Bilingual Arabic-first:** RTL/LTR via `dir` + Tailwind logical utilities; every user-facing string in both AR/EN via `src/lib/i18n.ts`.
- **Deterministic core untouched:** never redefine enums from `data-model.md`; engine/matching/program data/store logic unchanged except the metric layer.
- **No dead-ends:** every "not eligible" surfaces ≥1 cited remedial step.
- **Cited evidence:** every AED figure/rule shows source + verified date; never present unconfirmed figures as verified; no inflated AED.
- **Agent optional:** app fully works with `ANTHROPIC_API_KEY` unset; model never emits HTML (UI rendered from structured tool results only).
- **Tailwind v4 CSS-first:** tokens in `globals.css` `@theme`; there is no `tailwind.config.*`.
- **Zod pinned v3; Tests: Vitest** (`vitest.config.mts`), run `npm test`; `npm run build` runs Turbopack typecheck.
- **Token names are contract:** `oasis / amber / clay / sand / paper / ink / night / palm / almost` (NOT design.md's green/gold/red/bone).
- **`prefers-reduced-motion: reduce`** disables all transitions/animations.
- **Definition of Done (every task):** `npm run build` + `npm test` green; AR/EN + RTL verified; offline-safe; reduced-motion respected; no "readiness" terminology; uses contract primitives, no duplicated styles.

---

## File Structure

**Foundation (Wave 0, on `main`):**
- `src/app/globals.css` — `@theme` tokens (reconciled + night/funding-sky/focus/motion), restrained Sadu utilities.
- `src/app/layout.tsx` — add self-hosted IBM Plex Mono font.
- `src/lib/metrics.ts` (new) — `progressStats()` + `ProgressStats` (replaces readiness).
- `src/lib/scoring.ts` — remove `readinessScore`/`readinessBreakdown`.
- `src/components/ReadinessGauge.tsx` — **delete**.
- `src/lib/i18n.ts` — remove readiness keys; add metric/nav/landing/assistant/share keys; lock naming.
- `src/components/ui.tsx` — add `Tabs`, `Stat`, `Money`+`formatAED`, `VerifiedStamp`, `StatusPill`, `Skeleton`, `EmptyState`.
- `src/components/Logo.tsx` (new) + `public/logo-mark.svg`, `public/logo-lockup.svg` (atomic, transparent, swappable).
- `src/lib/share.ts` (new, stub) · `src/components/ShareSheet.tsx` (new, stub) · `src/lib/pdf.ts` (signature only).
- Green-keeping mechanical edits to `src/app/results/page.tsx`, `src/lib/pdf.ts`, `src/lib/agent-tools.ts`, `src/components/ChecklistDialog.tsx` (swap readiness→`progressStats`; leaves redesign these later).
- `tests/scoring.test.ts` / new `tests/metrics.test.ts` — rewrite the climb.

**Leaves (Wave 1, worktrees):** as per spec §7 file-ownership map.

**Finishing (Wave 2):** `public/screenshots/*` (real), `README.md`, `.local-docs/design.md`, `CLAUDE.md`, `AGENTS.md`, `docs/superpowers/demo-script.md`.

---

# WAVE 0 — FOUNDATION (sequential, on `main`, leaves `main` green)

> Execute via subagent-driven-development with a review gate after each task. After Wave 0 merges, freeze the contract and fan out Wave 1.

## Task F1: Metric layer — remove readiness, add `progressStats`, rewrite the climb (TDD)

**Files:**
- Create: `src/lib/metrics.ts`
- Create: `tests/metrics.test.ts`
- Modify: `src/lib/scoring.ts` (remove `readinessScore`, `readinessBreakdown`)
- Modify: `tests/scoring.test.ts` (remove the readiness "climb" block; keep matchScore/ETA tests)
- Delete: `src/components/ReadinessGauge.tsx`
- Green-keeping edits: `src/app/results/page.tsx`, `src/lib/pdf.ts`, `src/lib/agent-tools.ts`, `src/components/ChecklistDialog.tsx` (replace any readiness usage with `progressStats`; minimal, not redesign)

**Interfaces:**
- Consumes: `EvaluatedProgram[]` from `evaluateAllFull()`, `effectiveProfile()`, `deriveRoadmap()`, `DoneStep[]`, `Profile`.
- Produces:
```ts
export interface ProgressStats {
  aedReachableNow: number;
  aedReachableAfterSteps: number;
  programsEligible: number;
  programsAlmost: number;
  programsTotal: number;
  stepsDone: number;
  stepsTotal: number;
  // optional: programs with open/null max contributing to the figure, for "up to/varies" flagging
  hasOpenEndedAmounts: boolean;
}
export function progressStats(
  profile: Partial<Profile>,
  evaluated: EvaluatedProgram[],
  doneSteps: DoneStep[],
): ProgressStats;
```

**AED rule (honest, no inflation):** `aedReachableNow` = Σ over *eligible* programs of `amount.max_aed`. Programs with null `max_aed` contribute a documented representative figure parsed from `amount.notes` if present (else 0) and set `hasOpenEndedAmounts=true`. `aedReachableAfterSteps` = same over eligible ∪ almost. Document the rule in a comment in `metrics.ts`.

- [ ] **Step 1: Write the failing test** (`tests/metrics.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { PROGRAMS } from "@/lib/programs";
import { evaluateAllFull } from "@/lib/engine";
import { deriveRoadmap } from "@/lib/roadmap";
import { progressStats } from "@/lib/metrics";
import {
  dateFounderIdea, dateFounderRegistered, dateFounderMvp, dateFounderEstablished,
} from "./fixtures"; // reuse existing fixtures (see scoring.test.ts imports)

const statsFor = (p: any) =>
  progressStats(p, evaluateAllFull(p, PROGRAMS), []);

describe("progressStats — the climb (replaces readiness)", () => {
  it("idea stage: no funding open yet → 0 eligible, AED 0", () => {
    const s = statsFor(dateFounderIdea);
    expect(s.programsEligible).toBe(0);
    expect(s.aedReachableNow).toBe(0);
  });
  it("registration unlocks eligible Tier-1 funding → AED and count rise", () => {
    const s = statsFor(dateFounderRegistered);
    expect(s.programsEligible).toBeGreaterThan(0);
    expect(s.aedReachableNow).toBeGreaterThan(0);
  });
  it("Khalifa flips eligible at MVP → more eligible programs & more AED than registered", () => {
    const reg = statsFor(dateFounderRegistered);
    const mvp = statsFor(dateFounderMvp);
    expect(mvp.programsEligible).toBeGreaterThan(reg.programsEligible);
    expect(mvp.aedReachableNow).toBeGreaterThanOrEqual(reg.aedReachableNow);
  });
  it("AED within reach is MONOTONIC non-decreasing across the climb", () => {
    const seq = [dateFounderIdea, dateFounderRegistered, dateFounderMvp, dateFounderEstablished].map(statsFor);
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i].aedReachableNow).toBeGreaterThanOrEqual(seq[i - 1].aedReachableNow);
      expect(seq[i].programsEligible).toBeGreaterThanOrEqual(seq[i - 1].programsEligible);
    }
  });
  it("never inflates: aedReachableNow ≤ aedReachableAfterSteps", () => {
    const s = statsFor(dateFounderRegistered);
    expect(s.aedReachableNow).toBeLessThanOrEqual(s.aedReachableAfterSteps);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- metrics` → FAIL ("progressStats is not a function"). If fixtures aren't exported from a shared module, first extract them from `tests/scoring.test.ts` into `tests/fixtures.ts` and import in both.

- [ ] **Step 3: Implement `src/lib/metrics.ts`** — pure function per the AED rule and interface above; iterate `evaluated` partitioning by `status`; sum `max_aed` for eligible/almost; `stepsTotal = deriveRoadmap(evaluated).length`, `stepsDone = doneSteps.length`.

- [ ] **Step 4: Remove readiness** — delete `readinessScore`/`readinessBreakdown` from `scoring.ts` and their tests from `scoring.test.ts`; delete `ReadinessGauge.tsx`.

- [ ] **Step 5: Green-keeping edits** — in `results/page.tsx`, `pdf.ts`, `agent-tools.ts`, `ChecklistDialog.tsx`, replace readiness references with `progressStats` fields (e.g. WhatsApp summary → "AED within reach: X"; PDF header → AED reachable; agent `match_programs` result → `aed_reachable_now`, `programs_eligible`). Minimal, just compile + sensible behavior.

- [ ] **Step 6: Run full suite + build** — `npm test` (all green) and `npm run build` (typecheck clean). Expected: PASS.

- [ ] **Step 7: Tighten the falsifiable claim (optional but recommended)** — after implementation, read the actual computed AED at each climb stage and add exact-value assertions (e.g. `expect(statsFor(dateFounderRegistered).aedReachableNow).toBe(<actual>)`), so the README can cite real numbers. Re-run.

- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat(metrics): replace readiness score with cited AED-within-reach + climb tests"`

## Task F2: Token system — reconcile `@theme`, add night/funding-sky/focus/motion, restrain Sadu

**Files:** Modify `src/app/globals.css`; Modify `src/app/layout.tsx` (add IBM Plex Mono).

**Interfaces — Produces (token names are contract):** `oasis{,-deep,-tint}`, `amber{,-deep,-tint}`, `clay{,-deep,-tint}`, `sand{,-2}`, `paper`, `ink{,-2,-3,-faint}`, `night{,-2}` + a funding-sky gradient, `palm{,-tint}`, `almost{,-tint}`, `--radius-card/--radius-pill`, `--shadow-card/--shadow-lift`, `--focus-ring` (single source of truth), `--motion-fast/base/slow`. Mono font via `--font-mono`.

- [ ] **Step 1:** Reconcile names/hex from current `globals.css` (oasis #14584a, amber #d98a1e, clay #9c4a2f, sand #f6f1e7, ink #21180f, night #15203a, palm #1f7a52, almost #c47d12) with design.md intent; deepen the base surface slightly (reserve pure cream for `paper`/PDF); add `night` deep variants + a funding-sky radial gradient token.
- [ ] **Step 2:** Add `--focus-ring` and reconcile focus to ONE definition (`:focus-visible` ring/outline); add `--motion-fast/base/slow` and a global `@media (prefers-reduced-motion: reduce)` killswitch.
- [ ] **Step 3:** Add `IBM_Plex_Mono` via `next/font/google` in `layout.tsx` (self-hosted at build → offline-safe), expose as `--font-mono`; wire `font-mono` utility.
- [ ] **Step 4:** Add restrained Sadu: ONE selvedge utility/SVG for the hero band + a PDF seal only (NOT per-card). Remove any "pattern on every card" intent.
- [ ] **Step 5:** `npm run build` clean; visually confirm tokens resolve. Commit: `style(theme): reconcile v4 @theme tokens, add night/focus/motion, self-host mono, restrain Sadu`.

## Task F3: Shared primitives in `ui.tsx`

**Files:** Modify `src/components/ui.tsx`; add `tests/ui-format.test.ts` for `formatAED`.

**Interfaces — Produces:** `formatAED(aed: number, locale: Locale): string` (mono, grouped, locale digits); `<Money aed locale className?/>` (renders `dir="ltr"` mono); `<Tabs tabs={{id,label}[]} active onChange/>`; `<Stat label value sub? tone?/>`; `<VerifiedStamp sourceUrl verifiedDate locale/>`; `<StatusPill status='eligible'|'almost'|'not_fit' locale/>`; `<Skeleton/>`; `<EmptyState icon? title desc? action?/>`. Keep `Button/Card/Badge/Eyebrow`.

- [ ] **Step 1:** Write failing test for `formatAED` (e.g. `formatAED(500000,"en") === "500,000"`; `"ar"` uses Arabic-Indic digits). Run → FAIL.
- [ ] **Step 2:** Implement `formatAED` + `<Money>`; run test → PASS.
- [ ] **Step 3:** Implement `Tabs/Stat/VerifiedStamp/StatusPill/Skeleton/EmptyState` per props above, styled with tokens; keyboard-accessible Tabs (roving tabindex, `role="tablist"`).
- [ ] **Step 4:** `npm run build` + `npm test` green. Commit: `feat(ui): add Tabs/Stat/Money/VerifiedStamp/StatusPill/Skeleton/EmptyState primitives`.

## Task F4: Logo — extract atomic transparent mark + swappable `<Logo>`

**Files:** Create `public/logo-mark.svg` (transparent, tight viewBox, just the glyph), `public/logo-lockup.svg`; Create `src/components/Logo.tsx`.

**Interfaces — Produces:** `<Logo variant?: 'mark'|'lockup'|'stacked' className?/>` reading from the single SVG source(s). Swapping the SVG file (or the import) changes the logo app-wide.

- [ ] **Step 1:** From `.local-docs/icons/Hissati-3-app-icon.svg`, extract the inner `<g>` glyph into `public/logo-mark.svg` with a transparent background (drop the `<rect>`), tight recentred viewBox; clean obviously-broken paths from the LLM SVG so it reads cleanly at 24–32px.
- [ ] **Step 2:** Build `<Logo>` that renders the mark (inline `currentColor`-friendly where possible) and an optional wordmark using the app's Fraunces/Tajawal (not baked Poppins/Naskh) so logo = product.
- [ ] **Step 3:** Verify it renders crisply on the green app bar AND on light bg, at favicon size. `npm run build` green. Commit: `feat(logo): atomic transparent mark + swappable <Logo> component`.

## Task F5: i18n + naming consolidation

**Files:** Modify `src/lib/i18n.ts`.

**Interfaces — Produces:** removed `yourReadiness`/`readinessHint`; new keys for the metric (`aedWithinReach`, `programsEligible`, `stepsDone`, `withinReachHint`), nav (`navPlan` = "My plan"/"خطتي", keep `assistant`, `navDetails`), dashboard tabs (`tabOverview`, `tabPrograms`, `tabChecklist`), share/PDF, landing copy keys, and assistant empty-state/error keys. Product name stays `Hissati / حِصّتي`.

- [ ] **Step 1:** Remove readiness keys; add the keys above (both AR/EN). Replace generic taglines ("YOUR SHARE, YOUR START") with benefit-specific copy ("turn a 'no' into a cited next step" / Arabic equivalent).
- [ ] **Step 2:** Grep for now-missing keys across the app; fix references touched by foundation (`grep -rn "yourReadiness\|readinessHint" src`). `npm run build` green.
- [ ] **Step 3:** Commit: `refactor(i18n): drop readiness strings, add metric/nav/tab/share keys, lock naming`.

## Task F6: Contract stubs (compile-able) + verify cross-leaf baselines

**Files:** Create `src/lib/share.ts`, `src/components/ShareSheet.tsx`; ensure `src/lib/pdf.ts` exports the frozen signature; confirm `ProgramCard`/`CompareView`/`AskBar` props are stable.

**Interfaces — Produces:**
```ts
// lib/share.ts
export interface SharePayload { title: string; body: string; url?: string; }
export function buildSharePayload(args: { kind: 'plan'|'program'; locale: Locale; stats?: ProgressStats; program?: Program; profile?: Partial<Profile> }): SharePayload;
export function waHref(p: SharePayload): string; // https://wa.me/?text=...
// components/ShareSheet.tsx
export function ShareSheet(props: { payload: SharePayload; className?: string }): JSX.Element;
// lib/pdf.ts (signature frozen; body rewritten by L5)
export function exportPlanPdf(args: { profile: Partial<Profile>; evaluated: EvaluatedProgram[]; steps: RoadmapStep[]; stats: ProgressStats; locale: Locale }): Promise<void>;
```

- [ ] **Step 1:** Implement a minimal-but-working `buildSharePayload`/`waHref` (real WhatsApp text, no QR yet) and a minimal `ShareSheet` (WhatsApp link + copy button) so dashboard/checklist can wire them now; L5 enriches later.
- [ ] **Step 2:** Adjust `pdf.ts` to the frozen `exportPlanPdf` signature (keep working output for now).
- [ ] **Step 3:** `npm run build` + `npm test` green on `main`. Commit: `feat(contract): share.ts + ShareSheet + pdf signature stubs for parallel leaves`.

**Wave 0 exit gate:** `main` builds, all tests green, no readiness references remain, contract frozen. Tag/note the commit; Wave 1 worktrees branch from here.

---

# WAVE 1 — LEAF AGENTS (parallel, worktree-isolated, against frozen contract)

> Each is dispatched as an autonomous agent with `isolation: "worktree"`. Each MUST: invoke `superpowers:frontend-design`; only edit files it owns (spec §7); import contract interfaces; keep `npm run build` + `npm test` green in its worktree; satisfy the DoD; commit frequently; verify via Playwright MCP where noted. **Creative latitude is intended** — the briefs give intent + constraints + acceptance criteria, not prescribed markup.

## Leaf L1 — Dashboard (3 tabs + funding-sky + metric)

**Owns:** `src/app/results/page.tsx`, `src/components/dashboard/*` (new), `ProgramCard.tsx`, `CompareView.tsx`, `ChecklistDialog.tsx`, `RoadmapStepCard.tsx`, `MatchesPanel.tsx`. **Imports only:** `ui.tsx`, `lib/metrics.ts`, `ShareSheet`, `Logo`, `AskBar`.

**Intent:** Turn `/results` into a compact, modern, UX-first dashboard with `Tabs`: **Overview** (the `progressStats` stat strip led by `<Money>` AED-within-reach; the **funding-sky** signature where matched programs are stars that light eligible/almost/dim and animate as steps complete via reduced-motion-safe transitions; top 1–3 next actions; plan-level `ShareSheet` + PDF), **Programs** (all programs in detail — eligible/almost/not-fit, each naming the blocking rule + cited remedy, `VerifiedStamp` on figures, compare flow), **Checklist** (per-program doc checklist + requirements met, per-program share). No "readiness" wording. The funding-sky is the dark signature surface (`night`).

**Acceptance:** Tabs switch with keyboard; AED-within-reach matches `progressStats`; lighting up a program as a roadmap step is marked done is visible (Playwright: mark a step, assert a star/stat changes); RTL mirrored; offline OK; build+tests green. Verify with Playwright MCP (desktop + mobile width).

## Leaf L2 — Landing page

**Owns:** `src/app/page.tsx`, `src/components/landing/*` (new, incl. `<DeviceMockup src/>`), `public/screenshots/*` (placeholders for now). **Imports only:** `ui.tsx`, `Logo`, `AskBar`, `lib/metrics.ts`.

**Intent:** A breathtaking, conversion-focused landing that nails the hackathon points: the *real problem* (every tool dead-ends at "no"), the *who* (first-time founder in Al Qua'a), the *solution + impact with a testable claim* ("zero to a cited funded path"), *offline + Arabic-first + cited evidence*, *scalability*. Hero with the funding-sky motif and `<DeviceMockup>` showing the app on phone + laptop (placeholder images; orchestrator swaps real screenshots in Wave 2). Clear CTAs to start the questionnaire and to ask the assistant. Bilingual, distinctive (not generic SaaS), restrained Sadu at most as one hero accent.

**Acceptance:** Above-the-fold tells the story in one screen; CTAs route correctly; `<DeviceMockup>` takes a swappable `src`; RTL + EN both strong; reduced-motion safe; build+tests green. Playwright screenshot at desktop + mobile.

## Leaf L3 — Assistant revamp (modern, reuse components, no bloat)

**Owns:** `src/app/assistant/page.tsx`, `Assistant.tsx`, `AskBar.tsx`, `Markdown.tsx`, `src/lib/assistant-store.ts`, `src/lib/agent-tools.ts`, `src/app/api/agent/route.ts`. **Imports only:** `ui.tsx`, `ProgramCard`, `CompareView`, `lib/metrics.ts`.

**Intent:** A modern, uncluttered chat. **Reuse** `ProgramCard`/`CompareView`/compact `Stat` chips for structured tool results instead of dumping markdown walls; keep grounding chips tight and cited; strong empty/loading/error states with friendly bilingual copy; the model still never emits HTML (render from structured results only). Keep `AskBar`'s frozen props (`seed?`, `variant?`, `className?`) since landing/dashboard import it. App fully works with agent OFF (graceful disabled state). Ensure `match_programs` tool result carries `progressStats` fields (not readiness).

**Acceptance:** With agent OFF, the tab shows a clean disabled state and the rest of the app is unaffected; structured results render as components, not raw JSON/markdown; thread stays compact; RTL OK; build+tests green. (If an API key is available in the env, smoke-test one prompt via Playwright; otherwise verify the OFF path.)

## Leaf L4 — Header & nav

**Owns:** `src/components/AppHeader.tsx` (+ `DirectionManager.tsx` only if needed). **Imports only:** `Logo`, `ui.tsx`, `i18n.ts`.

**Intent:** Redesign the sticky header using `<Logo>`; nav = **My plan** (`/results`) · **Assistant** · **My details** (`/questionnaire`); offline badge; language toggle. Consistent naming (no "matches/readiness" drift). Remove anything unneeded; ensure mobile-friendly (icons + labels), active states, accessible (`aria-current`).

**Acceptance:** Names match i18n contract; logo crisp; active state correct on each route; RTL mirrored; build green. Playwright check across routes.

## Leaf L5 — PDF + WhatsApp (make it genuinely useful)

**Owns:** `src/lib/pdf.ts`, `src/lib/share.ts`, `src/components/ShareSheet.tsx`. **Imports only:** `lib/metrics.ts`, `Logo`, `ui.tsx`.

**Intent:** Make these features something a founder *wants* to use. **PDF** → a real bilingual **Funding Readiness Plan**: header lockup + Sadu seal, AED-within-reach headline, eligible/almost programs with cited sources + verified dates, the document checklist they can carry to TAMM/a bank, roadmap steps. Must render Arabic RTL and survive html2canvas. **WhatsApp/Share** → `buildSharePayload` produces a compelling message (top eligible program + AED + apply link) for plan-level and per-program sharing; add a **QR code to the live URL** (deploy is handled) generated offline (bundled lib, no CDN). Keep the frozen signatures from F6.

**Acceptance:** PDF opens with correct AR/EN layout and cited figures; share text is useful and includes the apply link; QR resolves to the deploy URL; offline-safe; build+tests green.

**Wave 1 merge order:** L4, L5 → L1 → L3 → L2 (per spec §7). Resolve any trivial import wiring at each merge; run build+tests after each.

---

# WAVE 2 — FINISHING (after all leaves merge)

## Task W1: Real screenshots (orchestrator, Playwright)
- [ ] Run the app, drive the wizard → dashboard (Overview with lit funding-sky) → assistant; capture clean desktop + mobile screenshots; composite into the landing `<DeviceMockup>` slots (replace placeholders in `public/screenshots/`). Commit.

## Task W2: Docs reconciliation (docs agent)
**Owns:** `README.md`, `.local-docs/design.md`, `CLAUDE.md`, `AGENTS.md`.
- [ ] **README (judged, criterion 7):** required sections — challenge + specific problem; target demographic + situation; solution + impact with **testable claims** (cite the real AED-within-reach climb numbers from F1 step 7); feasibility + deployment + scalability; how to run/verify + tools + evidence; offline screenshot; section-by-section map to criteria 1–7.
- [ ] **design.md:** reconcile to the shipped system (v4 `@theme`, real token names/hex, Fraunces+Tajawal+mono, NO readiness gauge → AED/funding-sky, restrained Sadu, logo direction, add PDF layout + empty/loading/error + focus + contrast + data-density sections). Per spec §6 of the design critique.
- [ ] **CLAUDE.md:** update the stale "Build status" (chunks 5–9 are done; record the overhaul) and any naming.
- [ ] Commit each.

## Task W3: Demo golden-path script (criterion 8)
- [ ] `docs/superpowers/demo-script.md` — the live walk: idea-stage Al Qua'a founder → answer 6 → Overview shows AED 0 → mark steps → watch AED-within-reach climb + programs light up → open Checklist → download Arabic PDF → share. With the cited numbers. Commit.

## Task W4: Final verification
- [ ] `npm run build` + `npm test` green; Playwright end-to-end (AR + EN, desktop + mobile, **offline** via SW); confirm no readiness terminology remains (`grep -rni readiness src`); confirm agent-OFF path. Fix regressions. Final commit.

---

## Self-Review (against the spec)

**Spec coverage:** §3.1 dashboard→L1; §3.2 identity/CSS→F2+L1/L2; §3.3 header/naming→F5+L4; §3.4 assistant→L3; §3.5 PDF/WhatsApp→L5; §4 metric→F1; §5 waves→structure; §6 contract→F1–F6; §7 ownership→Wave 1 briefs + merge order; §8 DoD→Global Constraints; §9 risks→addressed (green-keeping edits, frozen contract, bounded funding-sky, placeholder screenshots). All 9 user tasks mapped: 1→F2/L1/L2; 2→L1; 3→L2; 4→W2; 5→L3; 6→F5/F4/L4; 7→L5; 8→F1; 9→L3.

**Placeholder scan:** No "TBD/implement later". Creative briefs intentionally omit prescriptive JSX (per user's explicit creative-latitude instruction, which overrides the default "complete code" rule for the design leaves); each still has exact files, exact contract interfaces, and verifiable acceptance criteria. Foundation tasks (the testable, correctness-critical layer) carry exact test code + signatures + commands.

**Type consistency:** `ProgressStats`/`progressStats` consistent F1↔leaves; `SharePayload`/`buildSharePayload`/`waHref`/`ShareSheet`/`exportPlanPdf` consistent F6↔L5↔L1; token names consistent F2↔all; `<Logo variant>` consistent F4↔L4/L2/L5; `formatAED`/`<Money>` consistent F3↔L1/L5.
