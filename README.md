# Hissati · حِصّتي

**An Arabic-first, offline funding-path navigator for first-time UAE founders.**

Hissati matches a founder against published programme criteria, names each blocking rule, and turns “not yet” into a cited next step. It was built for Tatweer Hackathon Challenge 1: helping people in Al Qua’a take the first entrepreneurial step.

**Live:** https://hissati.org · **Repository:** https://github.com/theParitet/TatweerHackathon404Team

## 1. The challenge and beneficiary

First-time founders face fragmented programme pages, unclear eligibility, English-heavy portals, and poor connectivity. A founder making date products at home may be ineligible for financing today, but still needs to know which licence to obtain, what it costs, and what that step unlocks.

Hissati is designed first for Al Qua’a and Al Ain:

- Idea-stage founders who have not registered a business.
- Operating camel, date, food, or tourism businesses seeking growth finance.
- MVP-stage founders considering accelerators or competitions.

## 2. What the product does

1. An adaptive six-question core collects location, ownership, stage, registration, sector, and funding need.
2. Narrow questions appear only when relevant: women-only programmes, farm tenure, social impact, and Hub71 relocation.
3. A deterministic TypeScript engine evaluates the bundled dataset into:
   - **Published criteria met**
   - **Almost** — one or two remediable gaps
   - **Not a fit** — a published hard gate fails
4. The dashboard produces an ordered roadmap, application checklist, Arabic/English PDF, and WhatsApp share.

The assessment is a preliminary screen, not approval. Loans, investments, accelerators, and competitions retain their own credit, due-diligence, and selection processes.

## 3. Data reliability

The knowledge base contains **16 tracked opportunities across three tiers**:

- Three licence rungs.
- One non-cash enablement framework.
- Twelve funding, accelerator, competition, or investment opportunities.

As checked on **2026-06-27**, **six funding opportunities have an open or rolling application route**. Closed annual competitions remain visible with a “next cycle” label; unpublished VC windows are not counted as open.

Every record contains:

- A primary source and access date.
- The source’s own date where published.
- A confidence tag: `confirmed`, `reported`, or `estimated`.
- A frozen availability state: `open`, `rolling`, `closed`, or `unknown`.
- A conservative per-applicant amount used by the headline metric.

See [programs-sources.md](programs-sources.md) and [the verification report](docs/verification-report.md).

## 4. “AED within reach” without inflation

The headline metric counts only `amount.countable_max_aed` for open or rolling matches.

It deliberately excludes:

- Licence fees and support services.
- Closed competitions.
- Collective prize pools presented as though one founder receives the pool.
- In-kind-only benefits.
- Unknown VC ticket sizes.
- Duplicate alternatives from the same Khalifa Fund product family.

For the tested Al Qua’a date-products founder, the deterministic climb is:

| Stage | Open matches | AED within reach |
|---|---:|---:|
| Idea, unregistered | 0 / 6 | AED 0 |
| Registered | 1 / 6 | AED 0 |
| Operating MVP | 4 / 6 | AED 2,000,000 |
| Established, 2+ years | 5 / 6 | AED 7,000,000 |

The final step adds the separately sourced EDB AgriTech facility. Khalifa’s general and agricultural products remain two useful paths in the UI but contribute only one AED 2M grouped ceiling.

## 5. Testable claims

| Claim | Verification |
|---|---|
| 16 records validate against the committed Zod schema | `npm test -- --no-cache` → `tests/programs.test.ts` |
| Source confidence and availability dates exist on every record | `tests/programs.test.ts` |
| Questionnaire fields and eligibility rules cannot drift | `tests/completeness.test.ts` |
| Every almost-match has a concrete remedy | `tests/engine.test.ts` |
| AED totals exclude pools, costs, closed cycles, and duplicate alternatives | `tests/metrics.test.ts` |
| The exact `0 → 0 → 2M → 7M` climb is reproducible | `tests/metrics.test.ts` |
| The core runs with no network or backend | bundled JSON + pure functions in `src/lib/` |

## 6. Architecture and feasibility

- **Next.js 16 / React 19 / TypeScript**
- **Tailwind CSS v4**
- **Zod** for dataset validation
- **Zustand persist** for on-device answers and progress
- **Vitest** for deterministic evidence
- **html2canvas + jsPDF** for bilingual plans
- Hand-written service worker for the offline shell

The programme dataset is imported into the client bundle. Matching, scoring, roadmaps, and metrics run locally without a network call. The optional assistant calls domain tools wrapping the same engine; the product remains fully functional when the assistant is disabled.

Adding an ordinary programme is data-only when it uses existing rule fields. New narrow gates are additive and must add a conditional question plus a completeness test.

## 7. Run and verify

```bash
npm ci
npm test -- --no-cache
npm run build
npm run dev
```

Then open http://localhost:3000.

To verify offline behaviour:

1. Load the production app once.
2. Enable browser DevTools → Network → Offline.
3. Reload and complete questionnaire → results → checklist → PDF.

## 8. How we score against criteria 1–7

1. **Impact:** gives a first-time rural founder a concrete first action instead of a rejection screen.
2. **Relevance:** directly addresses Challenge 1 and Al Qua’a’s date, livestock, and low-connectivity context.
3. **Feasibility:** the core is a static, offline-capable web application with no account or database requirement.
4. **Readiness:** questionnaire, matching, roadmap, checklist, sharing, and bilingual PDF work end to end.
5. **Scalability:** programmes and emirates are represented as validated data over a reusable rule grammar.
6. **Falsifiability:** exact matches and AED totals are pinned by tests; uncertain and closed opportunities are visibly labelled.
7. **Documentation:** this repository contains setup instructions, primary-source manifest, verification report, tests, screenshots, and sample PDFs.

## 9. Important limitations

- “Published criteria met” is not a funding approval.
- Availability is a checked snapshot and must be refreshed periodically.
- Arabic programme copy is a careful draft pending native legal/content review.
- Hissati provides public information, not financial or legal advice.
