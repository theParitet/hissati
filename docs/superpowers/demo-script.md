# Hissati — live demo script (Sunday final · criterion 8)

> **Goal:** a 60–90 second, no-internet "golden path" that lands the one emotional beat — *watch the money climb* — and proves every number is cited. Rehearse it; the core is deterministic, so it cannot break on stage.
>
> **Setup:** app open on the **landing page**, language on **العربية** (Arabic-first) or English to taste, **airplane mode ON** (prove offline live). Have the dashboard already verified once so the service worker has cached the shell.

## The one-liner (say this first)

> **"Every funding tool tells a first-time founder 'you don't qualify' and stops. Hissati turns that 'no' into a cited path — and shows the real money it unlocks. Watch."**

(Arabic: «كل أدوات التمويل تقول للمبتدئ: لا تنطبق عليك، ثم تتوقف. حِصّتي تحوّل هذا الرفض إلى مسار موثّق — وتُظهر المبلغ الحقيقي الذي يفتحه. شاهدوا.»)

---

## The golden path (~75 s)

**0:00 — Open.** Landing: *"From an idea to a funding path — with receipts."* Tap the offline badge — **"Works offline"** — say: *"No internet. This whole demo runs on the device."* Tap **Start**.

**0:10 — Answer 6 questions as the Al Qua'a date-products founder.** Enter her manually (no case-picker — it's the real questionnaire):
- Nationality/ownership → **Emirati**
- Location → **Al Qua'a – Al Ain**
- Stage → **Idea only**
- Registration → **None**
- Sector → **Dates**
- Funding sought → **Grant**, small band

Note the live *"N programs still match"* hint updating as you answer.

**0:30 — Dashboard → Overview.** Read the stat strip aloud:
- **AED within reach: 0** · **Programs eligible: 0 / 9** · **Steps done: 0 / 1**

Say: *"Zero — honestly. Some licences are already 'eligible', but a licence is a fee she pays, not money she gets, so it doesn't count. And critically — it is **not** a dead-end."* Point at the **funding sky**: dim stars low on the horizon = programs one cited step away. Point at **Your next steps**: each names the blocking rule and the cited fix.

**0:45 — Mark "register a trade licence" done.** The grants flip: **eligible programs → 2 / 9**, two stars rise. AED within reach is still **0** (those grant amounts aren't publicly fixed — the UI shows **"+ amounts vary"**, never an invented figure). Say: *"Still honest. But look what's one step away."*

**0:55 — Mark "launch an MVP / product" done.** The beat:
- **AED within reach jumps to 2,000,000** — the counter climbs, the Khalifa star rises bright.
- **Eligible programs → 5 / 9.**
- **Khalifa Fund's AED 2,000,000 loan flips *almost → eligible*.**

Say: *"That's the whole product in one move — from zero to a two-million-dirham path, every dirham cited."* (Point at the **verified · source · date** stamp on the Khalifa card.)

**1:05 — Checklist + take-away.** Switch to the **Checklist** tab: the exact documents she carries to TAMM or a bank. Tap **Download** → the **Arabic PDF plan** (founder context + cited sources + the document checklist). Then **Share** → **WhatsApp** message + **QR** to the live URL.

**1:15 — Close.** *"Offline, in Arabic, with receipts — built for Al Qua'a, and a rule-swap away from any emirate. 49 tests pin every number you just saw."*

---

## Cited numbers (must match the screen — from `tests/metrics.test.ts`)

| Step | AED within reach | Eligible programs | Note |
|---|---|---|---|
| Idea only | **0** | **0 / 9** | not a dead-end; licences excluded (fees, not funding) |
| + registered a licence | **0** | **2 / 9** | grants flip eligible; awards "vary" → contribute 0, never inflated |
| + launched an MVP | **2,000,000** | **5 / 9** | **Khalifa AED 2,000,000 loan flips eligible** |
| (mature) | **2,000,000** | **6 / 9** | monotonic — never drops |

- **9 funding programs** of **12 total** (3 are licence rungs).
- Headline metric = Σ structured `max_aed` of **eligible funding** programs only.

## If asked (have these ready)

- **"Is the 2M real?"** — It's Khalifa Fund's published loan ceiling (flagged in `programs.json` as report-sourced because the portal is JS-rendered; verified 2026-06-26). Every figure on screen carries its source + date.
- **"Does the AI write this?"** — No. The core is deterministic TypeScript; the optional assistant is **tool-calling only** and works fully when OFF. Toggle airplane mode on — nothing changes.
- **"Will it scale?"** — Adding a program or an emirate is data-only against a frozen Zod rule grammar; no engine change.

## Fallbacks

- If a tap misfires, the climb is replayable: **Undo** a completed step and re-mark it.
- If the PDF is slow, the **sample plans** are committed at `docs/sample-plan-ar.pdf` / `docs/sample-plan-en.pdf`.
- Worst case, `npx vitest run tests/metrics.test.ts` proves the exact climb in front of the judges.
