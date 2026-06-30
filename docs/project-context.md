# Project Context — Hissati (حصتي)

> What Hissati is and why it exists. The build contract lives in `requirements.md`; the type/algorithm spec in `data-model.md`; the cited program data in `programs-sources.md`.

## One-line summary

**Hissati** (حصتي, "my share") is a bilingual, offline-capable funding **readiness navigator**: it matches a UAE founder to real funding programs and, for the ones they don't yet qualify for, names the exact blocking rule and generates the shortest cited path to becoming eligible.

## The idea

Most existing tools dead-end at "no": a single-fund eligibility/loan calculator, or static program lists — all of which tell a first-time founder *"you don't qualify"* and stop. Hissati inverts that. It treats non-eligibility as the starting point, classifying every program as **Eligible now / Almost eligible / Not a fit**, and for each near-miss it generates the concrete, cited steps to get there (e.g., "get a Mobdea home licence → register → you unlock Ma'an + Khalifa micro"). The output is a personalized **Funding Readiness Roadmap** led by the cited **"AED within reach"** metric, with licensing and registration planning folded in as the first rungs of the path.

## Who it serves

- **First-time founder, idea/early stage, not yet registered or licensed** (e.g., an Emirati woman making date products at home in Al Qua'a). The person every existing tool rejects; the readiness path *is* the value for her.
- **Operating founder** (e.g., a camel-dairy farmer 1–2 years in) seeking expansion funding.
- **Early tech founder** (MVP/traction) eligible for the "stretch tier" — Hub71, Sheraa, Khalifa Entrepreneurship Award.

## What it does

Core flow: a short, **adaptive bilingual (Arabic-first, RTL/LTR)** questionnaire of ~6 gating questions → a **deterministic** matching engine classifies each program (Eligible now / Almost eligible / Not a fit) and **cites the specific blocking rule** for non-matches → a readiness roadmap led by the "AED within reach" metric → a per-program application checklist → a downloadable **Arabic PDF plan**.

Key characteristics:
- **Offline-first PWA** — the whole core flow (wizard, matching, plan) runs in airplane mode; no runtime CDN. Built for Al Qua'a's weak connectivity.
- **Bilingual, Arabic-first** with full RTL, English toggle, self-hosted Tajawal font.
- **Every figure and rule cited** to a primary `.gov.ae` source with a "verified June 2026" date — nothing is invented.
- **Optional grounded LLM agent** layered on the deterministic core: it converts vague/dialect questions into structured fields and calls domain tools only; all facts come from those tools, never the model. The app is fully usable with the agent switched off.

## Scope

**Rural-first primary, broader UAE ecosystem as stretch tiers.** The primary persona and Tier-1 data are the Al Qua'a founder (Khalifa Fund, Ma'an, DCT/tourism, Tajer/Mobdea licence rungs). The wider UAE ecosystem — accelerators, competitions, VCs (Hub71, Sheraa, Shorooq, etc.) — appears as higher "stretch" rungs on the same readiness path, keeping the product locally grounded while remaining applicable across emirates.
