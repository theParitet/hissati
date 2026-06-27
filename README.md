# Hissati · حصتي

**A bilingual, offline-first funding *readiness navigator* for first-time founders in the UAE.**

Hissati (حصتي, *"my share"*) matches a UAE founder to real funding programs and — for the ones they don't yet qualify for — names the **exact blocking rule** and generates the **shortest cited path** to becoming eligible. Every existing tool dead-ends at *"you don't qualify."* Hissati turns that "no" into a sequenced, sourced next step.

 **Live demo:** https://hissati.org  ·   **Repo:** https://github.com/theParitet/TatweerHackathon404Team
 **Tatweer Hackathon — Challenge 1: Taking the first entrepreneurial step**

---

## 1. The challenge and the problem

**Challenge 1 — Taking the first entrepreneurial step.** Many people in Al Qua'a have a viable idea or a real skill but never start a business. The barrier is rarely ambition — it's not knowing the first move, what's required, or where to begin.

The specific problem we target: **the eligibility wall.** A first-time founder researching funding meets a wall of "you don't qualify" — Khalifa Fund's calculator covers one fund, and everything else is a static list. None of them tells the founder *what to do next*. The information that would actually move them forward (which licence, what it costs, what it unlocks) is scattered, in English, and online-only — which fails a dispersed, weak-connectivity, Arabic-first community.

## 2. Who it's for

Built first for the **Al Qua'a first-time founder** — e.g. an Emirati woman making date products at home, idea-stage, not yet registered. She is the person every existing tool rejects, so for her *the readiness path itself is the value.*

| Persona | Situation | What Hissati gives them |
|---|---|---|
| **New founder** (idea-stage, unregistered) | Rejected by almost every program | The fastest cited path to a first licence, then to first funding — never a zero-results screen |
| **Operating founder** (e.g. 1–2yr camel-dairy) | Seeking expansion funding | Programs they're eligible for now, ranked, with document checklists |
| **Early tech founder** (MVP/traction) | Reaching for the "stretch tier" | Accelerator/competition matches (Hub71, Sheraa, Khalifa Award) with the exact gap to close |
| **Judge / skeptic** | Must verify claims fast | Every figure cited to a primary source with a verified date, checkable from this repo |

## 3. The solution

A short, **Arabic-first (RTL)** questionnaire of ~6 questions feeds a **deterministic matching engine** that classifies every program into one of three buckets and explains itself:

- **Eligible now** — you meet every rule.
- **Almost eligible** — 1–2 *remediable* rules block you; the card shows "You could qualify if…" with the exact missing condition and the next action.
- **Not a fit** — a non-remediable gate, shown in the "why not" explainer rather than padded into results.

From the "almost" set, Hissati builds a **Funding Readiness Roadmap** (ordered, cited steps) and a single **Readiness Score (0–100)** that climbs as steps are marked done — programs visibly unlock in real time. The output exports as a **downloadable Arabic PDF plan** with per-program document checklists.

**Key characteristics**
-  **Offline-first PWA** — the entire wizard → results → roadmap → PDF flow runs in airplane mode. Built for Al Qua'a's connectivity, not a city's.
-  **Bilingual, Arabic-first** — full RTL with an English toggle; self-hosted Tajawal font (no runtime CDN).
-  **Cited or it doesn't ship** — every AED figure and eligibility rule traces to a primary source with a "verified June 2026" date. Nothing is invented.
-  **Optional grounded agent** — a Claude-powered chat that turns vague/dialect questions into structured lookups. It calls the *same* engine over the *same* cited data; the app is fully usable with it switched off.

## 4. How it works

```
Questionnaire (≈6 Qs, offline, persisted)
        ▼
evaluateAll(profile) → matchScore → readinessScore → buildRoadmap
        ▼
 ┌───────────┬───────────────┬──────────────────┐
 Eligible now   Almost eligible    Not a fit
 (cards +       (cards + the        (explained,
  checklist)     missing rule +      never an empty
                 the cited fix)      screen → pre-reg track)
        ▼
 Mark a roadmap step done → profile re-evaluated → score tweens up,
 "almost" cards flip to "eligible" in real time
```

The engine (`evaluateProgram`, `matchScore`, `readinessScore`, `estimateTimeToEligibility`, `buildRoadmap`) is **pure and deterministic** — same inputs always produce the same outputs, with no clock, network, or randomness. That's what makes the demo unbreakable and every claim below reproducible.

## 5. Testable claims (verify these from the repo)

Each claim is falsifiable and checkable in minutes — that's criterion 6.

| Claim | How to verify |
|---|---|
| **12 currently-open programs** across 3 tiers, each linked to a primary source with a verified date | Open [`data/programs.json`](./data/programs.json) + [`programs-sources.md`](./programs-sources.md) |
| **100% of "not eligible today" profiles return ≥1 actionable, cited step** (the no-dead-ends guarantee) | `pnpm test` → `tests/deadends.test.ts` |
| **Matched result in < 1s on throttled 3G** | DevTools → Network: *Slow 3G* → run the wizard (engine is O(programs × rules), sub-millisecond) |
| **A new founder reaches a concrete first action in ≤ 3 clicks** | "I only have an idea" → wizard → results with roadmap visible |
| **The full flow runs offline** | DevTools → Network → *Offline* → reload → complete wizard → PDF (see airplane-mode screenshot in [`/docs/evidence`](./docs/evidence)) |
| **The Readiness Score climbs monotonically 14 → 51 → 58 → 75** for the seeded idea-stage founder as steps complete | `pnpm test` → `tests/scoring.readiness.test.ts` |
| **The knowledge base validates against a committed Zod schema** | `pnpm run validate:kb` |

> **Honesty note (also criterion 6):** Of the 12 programs, the directly-quantified funding figures are Khalifa Fund SME (up to **AED 2M**, loan) and Hub71 Access (up to **AED 500K**, *in-kind* package), plus the licence-rung costs (Tajer ~AED 790; Mobdea/DCT permits in the AED 0–1,000 band). Grant and VC amounts that are **not publicly fixed** (Ma'an, ADDED, Access Sharjah, Khalifa Award, the VCs) are shown as such rather than invented. Figures not confirmable against a live portal fetch are flagged in [`programs-sources.md`](./programs-sources.md), and the Arabic copy is marked **draft pending native review**. We'd rather under-claim and be verifiable than inflate a headline.

## 6. Tech stack

**Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · Zustand (+persist) · next-pwa / Workbox · Tajawal (self-hosted) · Vitest · Vercel · Anthropic Claude (optional agent).**

The deterministic core is plain TypeScript with no heavy dependencies; the knowledge base ships in the bundle so matching needs zero network. The only server-side surface is an optional `/api/agent` route that keeps the API key off the client. Full layering, data flows, and the service-worker strategy are in [`system-architecture.md`](./system-architecture.md).

## 7. Run it locally

```bash
pnpm install
pnpm run validate:kb   # Zod-validate the knowledge base (build gate)
pnpm test              # Vitest: matcher, scores, dead-ends, traceability, personas
pnpm dev               # http://localhost:3000
pnpm build && pnpm start
```

**Verify offline (the headline claim):**
```
1. pnpm build && pnpm start
2. Load the app once — the service worker precaches the shell, KB, and fonts
3. DevTools → Network → Offline
4. Reload — the app loads fully from cache
5. Run the whole wizard → results → roadmap → PDF flow with no network
```

## 8. Data & citations

The knowledge base is **hand-verified**, not scraped. Each of the 12 records carries bilingual names, operator, eligibility rules, required documents, an application URL, and a **source URL + verified date** (all `2026-06-26`). The full citation manifest — including an explicit list of figures that could not be live-confirmed against JavaScript-rendered government portals — is in [`programs-sources.md`](./programs-sources.md). Arabic strings are drafted and flagged for native review before any public launch.

## 9. Documentation

Engineering reference (the internal architecture set). Every doc is derived from, and agrees with, the frozen data contract — `data-model.md`, `scoring.md`, `programs.json`, `programs-sources.md`. **If any doc disagrees with those four, the contract wins.**

| Document | Covers |
|---|---|
| [`system-architecture.md`](./system-architecture.md) | Layered architecture, module map, data flows, service-worker strategy, performance budget |
| [`database-erd.md`](./database-erd.md) | Data model, Zod schemas, the eligibility algorithm, localStorage shape, question→rule traceability |
| [`service-functions.md`](./service-functions.md) | Every engine function with signatures, invariants, the two scoring pipelines, the test matrix |
| [`functionalities-workflow.md`](./functionalities-workflow.md) | End-to-end journeys, wizard flow, classification + scoring walkthrough, agent flow |
| [`security-architecture.md`](./security-architecture.md) | Threat model, API-key isolation, agent guardrails, input validation, privacy posture |
| [`deployment-architecture.md`](./deployment-architecture.md) | GitHub → Vercel pipeline, env vars, PWA/offline config, CI gates |
| [`diagrams.md`](./diagrams.md) | 17 `mermaid.parse`-validated diagrams |

**Core invariants (true across every document)**
1. **Deterministic core** — pure functions; same inputs → same outputs (NFR-7).
2. **Three buckets only** — `eligible` (0 failed rules) · `almost` (1–2 failed, all remediable) · `not_fit` (FR-C1).
3. **No dead ends** — every `almost` carries 1–2 cited steps; idea-stage founders always see a pre-registration path (FR-C3 / FR-G).
4. **Offline-first** — the whole core flow runs in airplane mode; the only egress is the optional `/api/agent` route (NFR-1).
5. **Cited or it doesn't ship** — every figure and rule traces to a primary source with a verified date (FR-B2 / ER-4).
6. **Frozen vocabulary** — enum values and field names are referenced verbatim across dataset, scoring, and engine; additive changes only.

---

## Team & license

Built for the **Tatweer Hackathon** (26–28 June 2026, Al Qua'a · in collaboration with Abu Dhabi University). Open-sourced per the hackathon's rural-infrastructure track so other communities can adapt the data and the engine.

*Hissati is an information tool, not a licensed financial or legal advisor. It surfaces public funding programs and their stated rules; it does not file applications on anyone's behalf.*
