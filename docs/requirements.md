# Requirements — Hissati (Funding Readiness Navigator)

> Build contract for Hissati. Companion docs: `project-context.md`, `data-model.md`, `scoring.md`.
> **Product:** *Hissati* (حصتي) — a bilingual, offline-capable tool that matches a founder to real UAE funding programs, and for the ones they don't yet qualify for, shows the specific blocking rule and the shortest cited path to becoming eligible.
> **The reframe that defines the product:** not a grant *finder* (which dead-ends at "you don't qualify") but a funding *readiness navigator* that turns every "no" into a cited next step. It folds licensing/registration planning in as the first rung of that path.

## 0. Stated constraints (locked)

- **Offline-first.**
- **Multilingual: English + Arabic mandatory** (full RTL and LTR support).
- **Web-first; mobile responsive only if time allows.**
- **CSS/UI: shadcn/ui** (on Tailwind).
- **Stack: Next.js.**
- **Primary Arabic font: Tajawal** (self-hosted for offline).

---

## 1. Context

- **Community:** Al Qua'a, Al Ain — camel farming dominant livelihood, date farming secondary, dispersed desert population, weak connectivity. The product is built to feel local and to work in that environment.

### 1a. Scope
**Rural-first primary, broader UAE programs as additional tiers.** The primary persona is the Al Qua'a first-time founder; the funding database also includes the wider UAE ecosystem (accelerators, competitions, VCs), surfaced as higher "stretch" rungs on the readiness path. This keeps the product locally grounded while remaining applicable across emirates.

## 2. Goals

- A founder goes from a short profile to a **personalized, sequenced funding path** in under 60 seconds.
- **Zero dead-ends:** every "not eligible today" returns ≥1 concrete, cited next step.
- Every funding figure and eligibility rule is **traceable to a primary source** with a verification date.
- Works **offline and in Arabic**, and produces a **downloadable plan**.
- **Cross-program** coverage and a **readiness orientation**, rather than a single-fund eligibility check.

## 3. Non-goals (v1)

- Not an application *submitter* — route to TAMM / the program, don't file for the user.
- Not a loan-affordability / EMI calculator (Khalifa's lane).
- No live API sync with program portals — data is curated and hand-dated for v1.
- No user accounts / login.

## 4. Users

- **P-1 New founder, idea/early stage, not yet registered/licensed** (e.g., Emirati woman making date products at home). Primary persona — the one existing tools fail. Most programs reject this stage; the readiness path is the value.
- **P-2 Operating founder** (e.g., camel farmer, 2-year-old dairy) seeking expansion funding.
- **P-3 Early tech founder** (MVP/traction, possibly Emirati-owned) eligible for accelerators/competitions (Hub71, Sheraa, Khalifa Entrepreneurship Award) — the "stretch tier."

---

## 5. Functional requirements

Priority: **P0** = cannot ship without; **P1** = strong fast-follow within the window; **P2** = design for, don't build.

### FR-A · Eligibility questionnaire (wizard)
> **Design rule (completeness):** the questionnaire is *derived from and complete against* the program eligibility schema (FR-B). Every gating field any program's rules use has exactly one question, and every question gates ≥1 program (no vanity questions). This guarantees the engine can classify every program for any completed profile. Target: a verdict in **~6 questions** (often fewer via adaptive skipping), ≤9 including optional readiness questions.

- **FR-A0 (P0) Adaptive, fewest-to-conclude.** Ask questions in order of elimination power; stop or branch as soon as further answers cannot change any program's verdict. Conditional questions appear only when relevant. After each answer show a live "N programs still match" hint (also satisfies progressive disclosure).
- **FR-A1 (P0) Core gating questions (6 + 1 conditional).** Each maps to a structured enum used by the deterministic rules:
  1. **Nationality / ownership** — Emirati (≥51%) / part-Emirati (<51%) / GCC / expat. *(Gates: Khalifa loans & Award, Ma'an.)*
  2. **Location** — Al Qua'a–Al Ain / other Abu Dhabi / Sharjah / Dubai / other UAE / outside UAE. *(Gates: Khalifa & Hub71 = AD, Sheraa = Sharjah.)*
  3. **Stage / traction** — idea only / prototype-MVP / early traction (pilots, first revenue) / established (1–2yr+ revenue). *(Dominant gate: accelerators/VCs need MVP+; loans need established.)*
  4. **Registration / licence** — none / <1yr / 1–2yr / 2yr+ with financials. *(Gates Khalifa loans; triggers the pre-registration/pre-MVP track.)*
  5. **Sector** — camel farming·dairy / dates / astro-tourism / handicrafts / food processing / retail / tech / other. *(Gates sector whitelists + Al Qua'a livelihood tags.)*
  6. **Funding sought** — type (grant / loan / equity investment / unsure) + amount band (<50K / 50–200K / 200–500K / 500K–2M / 2M+). *(Filters instrument type + funding-range fit.)*
  7. **(Conditional) Relocation willingness** — asked only if otherwise eligible for a relocation program (Hub71) and not already in Abu Dhabi.
- **FR-A2 (P1) Optional readiness questions** (do NOT gate eligibility; feed the application checklist): team composition (solo / co-founder / technical co-founder); whether a pitch deck and financial statements already exist.
- **FR-A3 (P0)** Each step persists to localStorage; refreshing or dropping connection mid-wizard preserves progress.
- **FR-A4 (P0)** Wizard logic + program data cached client-side; the wizard runs fully in airplane mode.
- **FR-A5 (P0) Question–rule traceability.** A committed mapping table links each question to the eligibility field(s) and the program(s) it gates; a test asserts no orphan rules (every rule field is covered by a question) and no orphan questions (every question gates ≥1 program).

### FR-B · Funding program database
- **FR-B1 (P0)** Hand-verified JSON knowledge base, **≥6 currently-open programs** (open/rolling records; the funding-only headline metric counts 5 of these) (the C6 threshold; aim higher). Each record: name (AR + EN), operator, min/max grant or award (AED), **eligibility rules (nationality/ownership, business stage/traction, business age, sector whitelist, location, relocation requirement, employee count)**, required documents, intro method (open form / TAMM / warm intro), application URL, **source URL + date-verified**, and a **priority tier**.
  - **Tier 1 — local non-dilutive (rural hero):** Khalifa Fund SME loans (≤AED 2M, agri/tourism/ICT etc.), Ma'an Social grants, ADDED SME support, a tourism/DCT grant (astro-camp), Tajer Abu Dhabi + Mobdea (licence-stage rungs).
  - **Tier 2 — UAE accelerators/competitions (stretch):** Hub71 Access + sector tracks (≤AED 500K, relocation), Sheraa Startup Studio S3, Access Sharjah Challenge, Khalifa Entrepreneurship Award (≥50% Emirati, MVP).
  - **Tier 3 — regional VCs / global (reference):** Shorooq, BECO, MEVP, Turn8; YC/Techstars/500 (low priority, shown only if relevant).
- **FR-B2 (P0)** Source-citation layer: every figure and rule links to its primary source page with a "verified [date]" tag.
- **FR-B3 (P0)** Each program tagged by sector + Al Qua'a livelihood(s); matching runs on tags, not free text (auditable).
- **FR-B4 (P0)** KB validated against a **Zod schema**; the schema is committed and visible in the repo.

### FR-C · Matching engine (deterministic core)
- **FR-C1 (P0)** Pure, deterministic TypeScript: run profile against each program's rules → **Eligible now / Almost eligible / Not a fit**, naming the **specific blocking rule(s)** for non-matches. Stage, ownership, and relocation are first-class gates (e.g., "needs an MVP", "needs ≥50% Emirati ownership", "requires relocation to Abu Dhabi", "needs a registered business").
- **FR-C2 (P1)** Ranked results: composite of priority tier (Tier 1 > 2 > 3) × sector fit × funding-range fit × fewest missing requirements; shown as a match percentage.
- **FR-C3 (P0)** "Almost eligible" pathway: a near-miss program shows "You could qualify if…" with the exact missing condition and the next action (e.g., "Register with Tajer Abu Dhabi — ~AED 790, Emirates ID only"; "Build a working prototype to qualify for Hub71/Sheraa").
- **FR-C4 (P0)** Matching runs **entirely in the browser** — no network/API call required for a result.

### FR-D · Readiness roadmap & the "AED within reach" metric
- **FR-D1 (P0)** Eligibility-gap roadmap: ordered, cited steps to qualify for near-miss programs; licence steps link to cost/sequence; stage steps express "what to build/prove next."
- **FR-D2 (P1)** The headline **"AED within reach"** metric — a conservative sum of the funding the founder can currently access — with the steps that would raise it.
- **FR-D3 (P1)** Live re-check: mark a step done → the **"AED within reach"** metric updates and newly-eligible programs unlock in real time.
- **FR-D4 (P1)** Estimated time-to-eligibility ("≈8 months to qualify for Khalifa Fund at this path") — a falsifiable, testable claim.

### FR-E · Results dashboard
- **FR-E1 (P0)** Card grid: program name, operator, grant/award range, sector tags, priority tier, match badge, one-line eligibility summary; colour-coded full vs. partial match.
- **FR-E2 (P1)** Side-by-side comparison of up to 3 programs (amounts, documents, processing time, equity vs non-dilutive, concurrent-application compatibility).
- **FR-E3 (P1)** "Apply to multiple" stacking guidance (e.g., Khalifa + Ma'an concurrent; others exclusive).

### FR-F · Application checklist & plan export
- **FR-F1 (P0)** Per-program checklist (AR + EN): specific required documents (e.g., pitch deck, financial statements, trade licence + Emirates ID), format, where to obtain, submission channel, processing time.
- **FR-F2 (P0)** One-tap **Arabic PDF export** of matched programs + roadmap + checklist; a sample PDF is committed to the repo as proof of end-to-end function.
- **FR-F3 (P1)** Completion tracker (localStorage); when all items checked, a "Ready to apply" banner with the application URL appears.

### FR-G · Pre-registration / pre-MVP pathway (the anti-dead-end track)
- **FR-G1 (P0)** "Idea only" activates a track that shows the programs unlockable after registration/MVP **plus the fastest first steps first** — never a zero-results screen.
- **FR-G2 (P0)** First-step planner (D1-lite): pick livelihood → the specific first licence, its AED cost, and the single first action.

### FR-H · Bilingual UI & sharing
- **FR-H1 (P0)** Arabic-first, full **RTL** layout with an English toggle; all program names, steps, and copy available in both languages; correct LTR rendering in English; **Tajawal** as the primary Arabic typeface.
- **FR-H2 (removed)** "Share via WhatsApp" → `wa.me` deep link with a pre-filled Arabic summary (no API, no Twilio). *(descoped — the WhatsApp/share sheet was removed; not in the shipped app).*

### FR-I · LLM agent (non-blunt, online enhancement)
> The agent is a layer on top of the deterministic core. **The app must be fully usable with the agent disabled** (protects offline + the deterministic "AED within reach" metric).
> **Rendering model (important).** The agent is a *tool-calling* agent, not a UI generator. The model returns **text/markdown** plus structured **tool calls**; your app runs the tools (plain TS functions over the KB) and **renders all UI itself** from the structured results (chat bubble, the grounding chip in FR-I3, and optionally existing components like program cards / the funding-sky "AED within reach" stat). The model **never emits HTML** or injects DOM/popups — there is no model-drawn markup.
- **FR-I1 (P1)** Conversational agent that converts vague/dialect questions into structured profile fields and tool calls (e.g., "I fix cars, is there money to start?" → sector/stage classification).
- **FR-I2 (P1)** Agent exposes **domain tools only**, wrapping the same deterministic functions + cited KB: `match_programs`, `explain_rule`, `simulate(profile, changes)`, `steps_to_qualify`, `estimate_cost`, `find_by_need`, `generate_plan`. **All facts come from tool results; the model never asserts a funding fact.**
- **FR-I3 (P1)** **Surface tool calls in the UI** ("checked Khalifa Fund eligibility → source") so grounding is visible.
- **FR-I4 (P0 for the agent) Guardrails:** cite-or-decline (no match → "I don't have a program for that," never invent); hard scope (funding/licensing only); information-not-advice framing for anything legal/financial.
- **FR-I5 (P1)** Agent call runs **server-side** via a Next.js route (key never in the browser).

---

## 6. Non-functional requirements

- **NFR-1 Offline-first:** all assets (code, JSON data, fonts incl. Tajawal, icons) ship locally in the PWA bundle; **no runtime external CDN**. Core flow works in airplane mode. Service-worker precache of app shell + data.
- **NFR-2 Performance:** matched result in **< 1s on a throttled 3G** connection; new founder reaches a concrete first action in **≤ 3 clicks**.
- **NFR-3 Language/RTL:** Arabic primary, English fallback; correct RTL/LTR mirroring via `dir` + Tailwind logical utilities; self-hosted **Tajawal** Arabic font.
- **NFR-4 Responsive priority:** **desktop/web layout first**; mobile-responsive layout is a **P1**, built only if time allows (offline/PWA still applies on web).
- **NFR-5 Accessibility:** keyboard-navigable, sufficient contrast, semantic components (Radix/shadcn defaults).
- **NFR-6 Security/privacy:** no login; profile stays on-device (localStorage); the only network egress is the optional agent route; API key server-side only.
- **NFR-7 Reliability for demo:** deterministic outputs for the seeded personas; nothing in the core demo path depends on connectivity.
- **NFR-8 Resilience:** if the agent route/API fails, the deterministic app continues to function with no error state blocking use.

---

## 7. Technical & architecture requirements

- **TR-1 Framework:** **Next.js (App Router) + React + TypeScript** — fastest beginner setup and an **in-repo serverless route** for the agent (one scaffold, one deploy). Core is static-exportable.
- **TR-2 Styling:** **Tailwind CSS + shadcn/ui** (components copied into repo, token/CSS-variable theming for a distinct Al Qua'a look; not stock). Tajawal wired via `next/font` (self-hosted).
- **TR-3 Data & logic:** program KB as committed JSON/TS + **Zod** validation; matching engine as **pure deterministic TS functions** with **Vitest unit tests** (the tests double as criterion-6 evidence).
- **TR-4 State/persistence:** Zustand + `persist` (or equivalent) over localStorage.
- **TR-5 PWA/offline:** hand-written `public/sw.js` registered client-side (precaches the app shell + data); Turbopack doesn't run the next-pwa/Serwist webpack hook. Self-hosted fonts via `next/font`.
- **TR-6 PDF (Arabic):** native browser print — a print stylesheet + `window.print()` over a print-only `PlanDocument` component (the on-screen dashboard is `print:hidden`). No html2canvas/jsPDF.
- **TR-7 Agent route:** single Next.js serverless/Edge route calling **Claude with tool use** (Anthropic SDK); tools wrap the same TS matcher + KB; key in a Vercel env var.
- **TR-8 Hosting/repo:** GitHub (the submission) + Vercel (auto-deploy on push, live URL). Reference docs are committed under `docs/`.

---

## 8. Evidence & repo requirements

- **ER-1 Testable claims** in the README, each verifiable from the repo in minutes:
  - covers ≥6 currently-open programs (across tiers) each linked to a primary source;
  - matched result in < 1s on throttled 3G (DevTools-tested);
  - new founder with zero history gets a concrete first action in ≤ 3 clicks;
  - 100% of "not eligible today" profiles return ≥1 actionable, cited step (the no-dead-ends guarantee);
  - full flow runs offline (airplane-mode screen capture committed).
- **ER-2 README** documents how the product satisfies each of its stated requirements, one short paragraph per area.
- **ER-3 Test fixtures (dev/debug only).** 2–4 `Profile` fixtures with expected match/score outputs, kept in a **test-only file (in `tests/`), excluded from the client bundle and never surfaced in the UI** — no persona/case-selector, no in-app "case picker." Purpose: debugging and deterministic Vitest matching tests. Cases are entered **manually through the normal questionnaire**.
- **ER-4 Source manifest:** a committed list of every program with its source URL + verified date.
- **ER-5 Impact headline**, verified from Khalifa Fund's published reports (e.g., billions disbursed since 2007 vs. near-zero local awareness).

## 9. Definition of done

The repo is public and deployed; the deterministic core runs end-to-end **offline** in Arabic and English; ≥6 cited programs validate against the Zod schema; matching (incl. stage/ownership/relocation gates), almost-eligible routing, roadmap, checklist, and Arabic PDF export all work on web; Vitest matching tests pass; seeded personas produce deterministic output; README carries the requirements-mapped section + the ER-1 claims; the agent (if enabled) runs server-side, cites via tools, and the app still works with it switched off.
