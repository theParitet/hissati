# Hissati funding source manifest

Access dates are verification snapshots, not publication dates. `source_date` is recorded only when the publisher provides one. Full rules and bilingual copy live in `src/data/programs.json`.

Confidence:

- **confirmed** — directly supported by the operator or an official government page.
- **reported** — official/first-party material confirms the opportunity, but no fixed public amount or window is published.
- **estimated** — an explicitly labelled approximation; never counted in the headline metric.

| Programme | Availability checked 2026-06-27 | Counted AED ceiling | Primary source |
|---|---|---:|---|
| Khalifa Fund SME financing | rolling | 2,000,000 | [Khalifa Fund](https://www.khalifafund.ae/services/funding-scheme/) |
| Khalifa agricultural financing | rolling | grouped with Khalifa SME | [Khalifa Fund](https://www.khalifafund.ae/services/funding-scheme/) |
| Ma’an Funding Requests | rolling | varies / 0 counted | [Ma’an](https://programs.maan.gov.ae/en-US/programs/program-details/?id=f1b4900b-e139-ed11-9db0-0022480dadc2) |
| Tajer Abu Dhabi Licence | rolling | fee, excluded | [ADRA](https://www.adra.gov.ae/en/establishing/tajer-abu-dhabi-licence) |
| Mobdea Licence | rolling | fee, excluded | [ADRA](https://www.adra.gov.ae/en/establishing/mobdea-licence) |
| Farm Licence | rolling | fee, excluded | [ADRA](https://www.adra.gov.ae/en/establishing/small-producers-licence) |
| DCT tourism licence | rolling | fee, excluded | [DCT Abu Dhabi](https://dct.gov.ae/en/media.centre/news/abu.dhabi.introduces.aed.1000.new.cap.for.annual.tourism.business.licenses.aspx) |
| Tanami mSME framework | rolling | service, excluded | [ADDED](https://www.added.gov.ae/en/grow/Tanami) |
| Sheikh Mansour Agricultural Excellence Award | closed / annual | collective pool, excluded | [Abu Dhabi Media Office](https://www.mediaoffice.abudhabi/en/environment/abu-dhabi-agriculture-and-food-safety-authority-launches-4th-edition-of-sheikh-mansour-bin-zayed-agricultural-excellence-award/) |
| Hub71 Access | open to 2026-08-02 | 250,000 cash component | [Hub71](https://www.hub71.com/program/access-programme) |
| Sheraa S3 | closed — last cohort Fall 2025 (re-checked 2026-06-29) | varies / 0 counted | [Sheraa](https://www.asc.sheraa.ae/s3-program) |
| Access Sharjah Challenge | latest edition closed | 250,000 when open | [Sheraa 2025 edition](https://www.startups.sheraa.ae/asc2025) |
| Khalifa Entrepreneurship Competition | 2026 applications closed | collective pool, excluded | [Khalifa Fund](https://www.khalifafund.ae/program-initiatives/khalifa-entrepreneurship-award/) |
| EDB AgriTech Loans | rolling | 5,000,000 | [EDB programme](https://edb.gov.ae/solutions/agritech-loans) |
| Shorooq Partners | window unknown | per deal / excluded | [Shorooq](https://www.shorooq.com/) |
| BECO Capital | window unknown | per deal / excluded | [BECO](https://www.becocapital.com/contact/) |

## High-impact corrections from the original dataset

- Mobdea is for Emirati women residing in Abu Dhabi, costs AED 860 for the base licence, and permits no employees.
- Tajer’s published range is AED 790–5,500, not a flat AED 790.
- Khalifa’s AED 150K agricultural figure is a product ceiling, not a minimum.
- Hub71’s package combines AED 250K in-kind, AED 250K cash-for-equity, and a conditional AED 250K top-up.
- Ma’an’s live Funding Requests route has no fixed AED 200K ceiling; that number belonged to older incubator cohorts.
- ADDED Tanami is an enablement framework, not a grant.
- AED 1M+ for the Khalifa competition and AED 10M for the agricultural award are collective pools, not per-founder maxima.

## 2026-06-29 re-verification pass

All 16 records re-checked against live primary sources (links + facts). No dead links — all 18 URLs resolve. 14 records clean; plus:

- **Applied — Sheraa S3 availability `open → closed`.** The page's "active" Apply form is the Fall 2025 cohort (deadline 7 Sep 2025; ran to Feb 2026), now past with no new intake published. Metric pins re-set accordingly: open-match climb `0 → 1 → 3 → 4`, programsTotal `6 → 5`. The AED climb `0 → 0 → 2M → 7M` is unchanged (S3 contributes 0).
- **Applied — Sheikh Mansour award `application_url`** moved off the bare ADAFSA homepage (`/en/Pages/default.aspx`) to the dedicated award page (`/en/awards/`; the registration portal is `smaea.ae`).
- **Known caveat, deliberately not applied — Hub71 Access is sector-agnostic** per its live page, but the dataset still gates it to `tech` via a hard, no-remedy sector rule (so non-tech founders are wrongly hard-excluded). Left as-is for now: broadening it ripples into `scoring.test.ts` / `wizard.test.ts` and Hub71 is a tier-2 stretch (relocation + equity SAFE) the primary personas won't realistically reach. Revisit if non-tech founders should surface Hub71.
- **No change (false alarm) — Access Sharjah Challenge 2025 is EdTech** (dataset correct). The page `<title>` "Agriculture & Livestock" is stale SEO from the 2024 (6th) edition; the visible body and all 2025 coverage confirm EdTech.
- **Notes (verified correct, left as-is):** Ma'an "Funding Requests" requires applicants to register as an *organization* (not an individual); mobdea `max_aed: 1000` is a derived cost cap not stated on the page; khalifa-fund-sme `max_aed: 2M` is conservative vs the 3M absolute ceiling (already disclosed in `notes`).
