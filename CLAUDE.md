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
