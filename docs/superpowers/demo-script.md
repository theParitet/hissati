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

**0:10 — Answer the 6 core questions plus relevant checks.** Enter her manually:
- Location → **Al Qua'a – Al Ain**
- Nationality/ownership → **Emirati**
- Stage → **Idea only**
- Registration → **None**
- Sector → **Dates**
- Funding sought → **Grant**, small band
- Women-only programmes → **Woman**
- Own or lease a farm → **No**
- Defined social priority → **Yes**

Note the live *"N programs still match"* hint updating as you answer.

**0:30 — Dashboard → Overview.** Read the stat strip aloud:
- **AED within reach: 0** · **Open matches: 0 / 6**

Say: *"Zero — honestly. Some licences are already 'eligible', but a licence is a fee she pays, not money she gets, so it doesn't count. And critically — it is **not** a dead-end."* Point at the **funding sky**: dim stars low on the horizon = programs one cited step away. Point at **Your next steps**: each names the blocking rule and the cited fix.

**0:45 — Mark "register a trade licence" done.** Ma’an Funding Requests becomes an open match: **1 / 6**. AED within reach stays **0** because Ma’an publishes no fixed ceiling.

**0:55 — Mark "launch an MVP / product" done.** The beat:
- **AED within reach jumps to 2,000,000** — the counter climbs, the Khalifa star rises bright.
- **Open matches → 4 / 6.**
- Khalifa’s general and agricultural paths meet the published gates, while the metric counts their overlapping AED 2M ceiling only once.

Say: *"That's the whole product in one move — from zero to a two-million-dirham path, every dirham cited."* (Point at the **checked · source · date · confidence** stamp.)

**1:05 — Checklist + take-away.** Switch to the **Checklist** tab: the exact documents she carries to TAMM or a bank. Tap **Download** → the **Arabic PDF plan** (founder context + cited sources + the document checklist).

**1:15 — Close.** *"Offline, in Arabic, with receipts — built for Al Qua'a. 55 tests pin every number you just saw."*

---

## Cited numbers (must match the screen — from `tests/metrics.test.ts`)

| Step | AED within reach | Eligible programs | Note |
|---|---|---|---|
| Idea only | **0** | **0 / 6** | licences excluded (fees, not funding) |
| + registered a licence | **0** | **1 / 6** | Ma’an opens; its amount remains variable |
| + launched an MVP | **2,000,000** | **4 / 6** | grouped Khalifa ceiling, no double count |
| (mature, 2+ years) | **7,000,000** | **5 / 6** | EDB AgriTech adds a separately sourced AED 5M facility |

- **16 tracked opportunities; six open/rolling funding routes** in the checked snapshot.
- Headline metric uses conservative `countable_max_aed`, availability, and funding groups.

## If asked (have these ready)

- **"Is the 2M real?"** — It is read directly from Khalifa Fund’s server-rendered funding page. The source stamp shows access date and confidence; final approval remains Khalifa Fund’s.
- **"Does the AI write this?"** — No. The core is deterministic TypeScript; the optional assistant is **tool-calling only** and works fully when OFF. Toggle airplane mode on — nothing changes.
- **"Will it scale?"** — Adding a program or an emirate is data-only against a frozen Zod rule grammar; no engine change.

## Fallbacks

- If a tap misfires, the climb is replayable: **Undo** a completed step and re-mark it.
- If the PDF is slow, the **sample plans** are committed at `docs/sample-plan-ar.pdf` / `docs/sample-plan-en.pdf`.
- Worst case, `npx vitest run tests/metrics.test.ts` proves the exact climb in front of the judges.
