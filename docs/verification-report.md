# Data reliability and consistency report

**Checked:** 2026-06-27
**Dataset:** `src/data/programs.json` schema 3.0

## Scope

This pass rechecked the programme database against operator and government sources, added rural-relevant coverage, and traced every resulting change through the questionnaire, metric, UI, assistant, PDF, tests, and documentation.

## Research added

The main additional programme is **Emirates Development Bank AgriTech Loans**. EDB’s live page confirms:

- UAE location and operations.
- Owners of all nationalities may apply.
- Minimum two years of operations.
- Account/VAT history, credit report, financial statements, and feasibility evidence.
- Up to 90% loan-to-value, ten-year tenor, and 2.5-year grace period.

EDB’s official annual report supplies the AED 5M facility ceiling. Both sources are retained in the record.

## Data model changes

- Added `gender`, `farm_tenure`, and `social_impact` rule fields.
- Added adaptive questions for those narrow gates.
- Added `availability.status` and `checked_date`.
- Added source confidence, method, optional source date, and additional URLs.
- Added `amount.value_kind` and conservative `countable_max_aed`.
- Added `funding_group` to prevent mutually alternative products from being summed.
- Added `support` as a non-cash instrument and `email` as an introduction method.

## Availability model

Eligibility and availability are separate:

- `open` and `rolling` opportunities participate in current counts and AED metrics.
- `closed` annual programmes stay discoverable with a next-cycle label.
- `unknown` deal windows remain visible but are not described as currently open.

This is a frozen offline snapshot. No runtime request or clock changes an answer.

## Metric rule

“AED within reach” now:

1. Uses only open/rolling funding instruments.
2. Reads only explicit `countable_max_aed`.
3. Excludes costs, services, closed cycles, collective pools, in-kind-only benefits, and unknown tickets.
4. Takes the maximum—rather than the sum—within one `funding_group`.

For the test persona, the exact AED sequence is `0 → 0 → 2,000,000 → 7,000,000`. Open matches are `0 → 1 → 4 → 5` out of six currently available funding opportunities.

## Remaining limitations

- Khalifa Fund applicants must be aged 21–60. The app displays that condition in programme notes but does not collect age; “published criteria met” remains a preliminary screen.
- Ma’an requests still require committee assessment and a valid legal/social-impact basis.
- Accelerator, competition, VC, and loan selection remains discretionary.
- Availability needs periodic manual refresh.
- Arabic copy requires native review before production use.

## Verification

Run:

```bash
npm test -- --no-cache
npm run build
```

The suite validates schema integrity, source metadata, conditional-question completeness, three-bucket classification, no-dead-end remedies, availability filtering, grouped amounts, and exact metric values.
