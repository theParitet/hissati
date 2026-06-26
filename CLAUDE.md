# Hissati — Implementation Guide (CLAUDE.md)

**Hissati** (حصتي) is a funding **readiness navigator** for first-time founders in Al Qua'a, Al Ain (Tatweer Hackathon). Flow: short questionnaire → match the founder to real UAE funding programs (eligible / almost / not-a-fit, with the blocking rule named) → readiness roadmap + score → application checklist → Arabic PDF. Offline-first, Arabic-first.

## Read first — context lives in `.local-docs/` (git-ignored; informs the build, never shipped)
Core (always):
- `requirements.md` — the contract: features FR-A…FR-I, NFRs, stack, evidence reqs, Definition of Done (§10).
- `data-model.md` — Zod schema, enums, the `evaluateProgram` algorithm, question→rule map. **Single source of truth for types.**
- `programs.json` — the program dataset the matcher runs on.
- `scoring.md` — match-score + readiness-score formulas.
- `project-context.md` — the why / personas / scope.

Reference (as needed): `programs-sources.md` (citations + which figures are unconfirmed), `hackathon-info.md` (judging criteria + required README sections).

Ignore (superseded): `deep-research-report.md`, `Tatweer Hackathon - D2 Feature Spec.md`, `… Idea Slate & Strategy.md`, `Links.md`. Any `[[wikilinks]]` to these are intentional, not missing.

## Stack
Next.js (App Router) + TypeScript · Tailwind + shadcn/ui · Zustand+persist (localStorage) · PWA offline (next-pwa/Workbox) · Arabic PDF via html2canvas+jsPDF (or print stylesheet) · **Tajawal** self-hosted via next/font · deploy on Vercel. Optional agent: one server route calling Claude tool-use.

### As built (actual versions/decisions — read before touching config)
- **Next.js 16.2 + React 19 + Tailwind v4** (Turbopack is the default bundler). Tailwind v4 is CSS-first: tokens live in `src/app/globals.css` via `@theme`, **no `tailwind.config.js`**.
- **Offline = hand-written `public/sw.js`** (registered client-side), **not** next-pwa/Serwist — those inject the SW via a *webpack* hook that Turbopack doesn't run (confirmed in Next 16's own PWA guide). The KB is `import`ed JSON, so it's inlined into the JS bundle → offline needs only the chunks cached.
- **Zod pinned to v3** (`data-model.md`'s schema uses `z.string().url()` etc., reworked in v4).
- **Tests: Vitest**, config in **`vitest.config.mts`** (`.mts` so Vite loads it as ESM; `@/*` alias resolved manually — `vite-tsconfig-paths` is ESM-only and trips the loader). Run `npm test`.
- **Next 16 has breaking changes from training data** — read the bundled guides in `node_modules/next/dist/docs/01-app/` before writing Next-specific code (fonts, manifest, route handlers, layout).

## Non-negotiable invariants
- **Offline-first:** all assets (code, `programs.json`, fonts, icons) bundled locally; no runtime CDN; core flow works in airplane mode.
- **Bilingual:** Arabic-first RTL + English LTR toggle (`dir` + Tailwind logical utilities). Web-first; mobile responsive only if time allows.
- **Deterministic core, no backend:** matching/scoring are pure TS over `programs.json`, run in-browser. Never redefine the enums from `data-model.md`.
- **No dead-ends:** every "not eligible today" surfaces ≥1 cited remedial step.
- **Cited evidence:** every figure/rule shows its source + verified date. Do NOT present `programs-sources.md`'s unconfirmed figures as verified.
- **Agent (FR-I, P1, optional):** tool-calling only — the model returns text + tool calls; the app renders ALL UI from structured results; the model never emits HTML. App must fully work with the agent OFF; key server-side.
- **Test fixtures are dev-only** (ER-3): not shipped, no in-app case-selector; cases entered manually in the demo.

## Build order
1. Scaffold (Next.js+TS+Tailwind+shadcn); deploy empty to Vercel; confirm live URL + offline PWA shell.
2. Types + Zod schema; load & validate `programs.json` (per data-model.md).
3. `evaluateProgram`/`evaluateAll` + Vitest tests (classification, orphan-rule/question, no-dead-ends).
4. Scoring (match + readiness) + tests asserting the climb: dates founder **14 → 51 → 59 (±3)**, Khalifa flips **almost → eligible at step 2**.
5. Questionnaire wizard (FR-A: 6 + 1 conditional, adaptive, localStorage, offline).
6. Results dashboard + almost/roadmap + readiness gauge.
7. Checklist + Arabic PDF export.
8. Arabic/RTL polish, theme tokens (Al Qua'a look), README ("how we score against criteria 1–7" + ER-1 testable claims).
9. (If time) the optional tool-calling agent route.

**Done = `requirements.md` §10.** Commit often — the public repo is the submission (deadline Sat 8pm GST; only commits before count).

Note that this can be challenged if doesn't serve the final goal - winning hackathon.

## Dev tooling & workflow
- **Tests:** `npm test` (Vitest, `vitest.config.mts`). `npm run build` runs Turbopack + full TS typecheck. The deterministic core (schema/engine/scoring/questions) is covered by `tests/` and asserts the climb + no-dead-ends + no orphan rules/questions — keep it green.
- **Playwright MCP (Chrome debugging).** Configured in **`.mcp.json`** (`@playwright/mcp`, `--browser chrome`) so an agent can drive a real Chrome to click through the wizard, verify RTL, and screenshot offline mode. **Requires approving the project MCP server + restarting Claude Code** to load (it is not active in the session that created it). Use it to verify UI behaviour end-to-end rather than assuming. Falls back to bundled Chromium if Chrome isn't installed (change `--browser chrome` → drop the flag).
- **Distributed work via worktree agents.** For independent, parallelizable work (e.g. leaf features, README/manifest, the optional agent route), dispatch subagents with **`isolation: "worktree"`** so each works on an isolated copy and they don't clobber each other's files; merge back when green. Keep the *foundation* (types, store, i18n, theme, shared UI) on one trunk first — parallelizing before that exists creates merge churn. Do not parallelize edits to the same files.

## Build status (living)
- ✅ 1 Scaffold (Next 16/TS/Tailwind v4) — builds; **Vercel deploy pending user auth**.
- ✅ 2 Types + Zod schema; `programs.json` loads & validates.
- ✅ 3 Engine (`evaluateProgram`/`evaluateAll`) + completeness tests.
- ✅ 4 Scoring (match + readiness) — climb **14 → 51 → 59 → 75**, Khalifa flips at step 2. **34 tests green.**
- ⬜ 5 Wizard · ⬜ 6 Results/roadmap/gauge · ⬜ 7 Checklist + Arabic PDF · ⬜ 8 RTL/theme/README/SW · ⬜ 9 (opt) agent.
