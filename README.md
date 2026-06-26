# Hissati · حِصّتي — a funding-readiness navigator

**Hissati** ("my share") is a bilingual, offline-first web app that matches a UAE founder to **real funding programs** and, for the ones they don't yet qualify for, names the **exact blocking rule** and generates the **shortest cited path** to becoming eligible. It turns every *"you don't qualify"* into a sequenced, sourced next step.

> **Tatweer Hackathon — Challenge 1: Taking the first entrepreneurial step.**
> Built for first-time founders in **Al Qua'a, Al Ain**. Arabic-first, works in airplane mode.

**Live demo:** _add your Vercel URL here_ · **Code:** this repo · `npm test` → 34 passing tests

---

## 1. The challenge & the specific problem

We chose **Challenge 1 — taking the first entrepreneurial step**. The barrier for a first-time founder is rarely ambition; it's not knowing the first move — *which* program, *what* it requires, and *what to do* when the answer is "not yet."

Every existing tool dead-ends at "no." Khalifa Fund ships a single-fund eligibility calculator; everything else is a static listicle. All of them tell a first-time founder *"you don't qualify"* and stop. **Hissati inverts that:** it treats non-eligibility as the starting point and produces the cited path forward.

## 2. Who it's for, and their situation

- **Primary persona — a first-time founder, idea/early stage, not yet registered** (e.g. an Emirati woman making **date products at home** in Al Qua'a). Every existing tool rejects her; the readiness *path* is the value.
- Al Qua'a is a **dispersed, low-connectivity** rural community (camel and date farming dominate). So the app is **offline-first** and **Arabic-first** — it works on weak or no connection, in the user's language.
- Also served: an operating camel/dairy farmer seeking expansion funding, and an MVP-stage tech founder eligible for the "stretch tier" (Hub71, Sheraa, Khalifa Award).

## 3. The solution & its impact — with testable claims

A short, adaptive **Arabic-first questionnaire** (≈6 questions) → a **deterministic** engine classifies every program **Eligible now / Almost eligible / Not a fit**, naming the blocking rule → a **readiness roadmap + score that climbs** as steps are completed → a per-program **checklist** → a downloadable **Arabic PDF plan**.

**Testable claims (verify each in minutes — see §5):**

1. **12 UAE funding programs across 3 tiers**, each linked to a primary source with a verified date. → `src/data/programs.json`, validated by `tests/programs.test.ts`.
2. **Deterministic, in-browser, no-network core.** Matching + scoring are pure functions over a bundled dataset — no API call for a result, so a match returns in **well under 1 s even on throttled 3G / offline**. → `npm test` (34 tests).
3. **Zero dead-ends.** Every "almost" program carries **1–2 cited, remediable steps**; every non-match names its blocking rule. → no-dead-end invariant in `tests/engine.test.ts`; completeness (no orphan rules/questions) in `tests/completeness.test.ts`.
4. **The readiness climb is reproducible: 14 → 51 → 59 → 75**, and the **Khalifa Fund loan flips *almost → eligible* at step 2.** → asserted exactly in `tests/scoring.test.ts`.
5. **Full core flow runs offline** (service-worker precache; data is bundled into the JS, not fetched). → see `public/sw.js`; airplane-mode screenshot in `docs/`.

## 4. Feasibility, deployment & scalability

- **Feasibility / deployment.** Pure front-end PWA (Next.js, static-exportable) on Vercel's free tier. No backend, no database, no login — the only optional network call is the LLM helper, which is off by default. Maintenance = editing one JSON file.
- **Scalability.** Adding a program is **data-only**: one record in `programs.json` that validates against the Zod schema — `evaluateProgram` already interprets every rule via a frozen grammar. Expanding to another emirate is an `in`-rule on the `location` enum. No engine change. The rural-first wedge ships first; the wider UAE ecosystem (accelerators, VCs) is already included as higher "stretch" tiers, proving the model scales.

## 5. How to run & verify it

```bash
npm install
npm test        # 34 Vitest tests — the deterministic core (this is the criterion-6 evidence)
npm run dev     # http://localhost:3000
npm run build   # production build (Turbopack)
```

**Verify the headline claims directly:**

| Claim | Command / file |
|---|---|
| Readiness climbs **14 → 51 → 59 → 75**; Khalifa flips at step 2 | `npx vitest run tests/scoring.test.ts` |
| 3-bucket classification + **no dead-ends** | `npx vitest run tests/engine.test.ts` |
| **No orphan** rules/questions (questionnaire is complete vs the schema) | `npx vitest run tests/completeness.test.ts` |
| ≥6 cited programs across tiers, dataset validates against Zod | `npx vitest run tests/programs.test.ts` |
| Offline | build, serve, open DevTools → Network → *Offline*, reload — the flow still works |

**Tools:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Zod (schema/validation) · Zustand + persist (offline state) · Vitest (tests) · self-hosted Tajawal + Fraunces (next/font) · html2canvas + jsPDF (Arabic PDF) · hand-written service worker (offline) · Vercel (hosting).

## 6. How we score against criteria 1–7

- **1 · Impact (10).** Routes real, first-time founders to real money. Khalifa Fund has disbursed billions since 2007, yet local awareness is near-zero; Hissati closes the awareness-and-readiness gap for the exact person every other tool rejects — the not-yet-registered idea-stage founder.
- **2 · Relevance (10).** Squarely Challenge 1: it turns "I have an idea" into a concrete, costed first action (e.g. "register a Tajer licence, ~AED 790, Emirates ID only"), then sequences the path to funding.
- **3 · Feasibility (10).** Front-end-only PWA on a free tier; no backend or login; offline-first for weak rural connectivity; maintained by editing one cited JSON file.
- **4 · Readiness (10).** Working end-to-end **now**: questionnaire → classification → roadmap → live readiness score → checklist → Arabic PDF, all running offline. 34 passing tests.
- **5 · Scalability (10).** New programs and new emirates are **data-only** changes against a frozen rule grammar; the wider-UAE stretch tiers already in the dataset prove the rule-swap model.
- **6 · Falsifiability & evidence (10).** Every figure/rule is cited to a primary source with a verified date (§7); every demo-critical behaviour is pinned by a unit test (the climb, the flip, no-dead-ends, completeness). Unconfirmed figures are **flagged, not hidden** (§7).
- **7 · Repo documentation (5).** This README maps to the criteria, lists testable claims with the exact command to verify each, documents architecture, and ships the source manifest.

## 7. Source manifest & data confidence

Every program in `src/data/programs.json` carries `source.url` + `verified_date` (all 2026-06-26) and shows them in the UI ("verified [date]").

| id | operator | tier | instrument | source |
|----|----------|------|-----------|--------|
| khalifa-fund-sme | Khalifa Fund | 1 | loan | khalifafund.ae/services/funding-scheme |
| maan-social-grants | Ma'an (ASC Abu Dhabi) | 1 | grant | maan.gov.ae/en/social-investment-fund |
| tajer-abu-dhabi | ADDED via TAMM | 1 | licence | tamm.abudhabi … tajer-abudhabi |
| mobdea-home-licence | ADDED via TAMM | 1 | licence | tamm.abudhabi … Business |
| dct-tourism-licence | DCT Abu Dhabi | 1 | licence | tamm.abudhabi … Tourism |
| added-sme-support | ADDED | 1 | grant | added.gov.ae |
| hub71-access | Hub71 (ADGM) | 2 | accelerator | hub71.com/programmes |
| sheraa-s3 | Sheraa (Sharjah) | 2 | accelerator | startups.sheraa.ae |
| access-sharjah-challenge | Sheraa (Sharjah) | 2 | grant | asc.sheraa.ae |
| khalifa-entrepreneurship-award | Khalifa Fund | 2 | grant | khalifafund.ae … khalifa-entrepreneurship-award |
| shorooq-partners | Shorooq Partners | 3 | equity | shorooq.com |
| beco-capital | BECO Capital | 3 | equity | becocapital.com |

> **Honesty notes (deliberate — this serves criterion 6, not against it).**
> - **Unconfirmed figures** are flagged with a `notes` caveat in `programs.json` and must not be read as live-verified: the Tajer (~AED 790), Mobdea, and DCT (~AED 1,000) fees come from a research report (the official portals are JS-rendered and weren't machine-fetchable), and several grant/VC amounts are intentionally left `null` because they aren't publicly fixed.
> - **Arabic copy is a careful draft** pending native review before any real-world deployment.

## 8. Architecture (deterministic core)

```
src/lib/schema.ts      Zod schemas/types — the single source of truth (frozen enums + Rule grammar)
src/lib/programs.ts    loads & validates programs.json at module load (fails loud on drift)
src/lib/engine.ts      passesRule / evaluateProgram / evaluateAll — pure, 3-bucket classification
src/lib/scoring.ts     match score + readiness score + time-to-eligibility (tunable constants)
src/lib/questions.ts   question↔rule traceability (drives the wizard AND the completeness test)
src/lib/wizard.ts      adaptive flow + live "N still match" counter
src/lib/roadmap.ts     derives deduped, ordered, cited roadmap steps from the matcher output
tests/                 34 Vitest tests; fixtures are dev-only (never shipped, no in-app case picker)
```

The matcher and both scores are **pure and deterministic** — same inputs, same output, every run — which is what makes the demo rehearsable and the claims unit-testable. Marking a roadmap step "done" simply advances a profile field and re-runs the same functions; the score climb and the Khalifa flip fall straight out of the engine.

## 9. Demo (no internet needed)

1. Open the app (airplane mode is fine). Enter the **idea-stage Al Qua'a date-products founder** through the questionnaire.
2. Results: licence rungs are **eligible now**; Khalifa / Ma'an / ADDED are **almost**, each naming its blocking rule and cited fix. Readiness ≈ **14**.
3. Mark **"register a trade licence"** done → two grants flip eligible, the gauge climbs to **51**.
4. Mark **"launch your product"** done → the **Khalifa Fund loan flips eligible**, gauge **59**.
5. Open a checklist → **download the Arabic PDF plan**.

_Internal planning/research lives in `.local-docs/` (git-ignored) and is intentionally not part of this public submission._
