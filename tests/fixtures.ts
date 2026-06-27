/**
 * Dev/debug-only Profile fixtures (ER-3).
 *
 * These are NOT shipped to the client and there is NO in-app case selector — in
 * the live demo the team enters cases manually through the questionnaire. They
 * exist purely to make the deterministic core unit-testable and the demo
 * rehearsable (NFR-7). Lives in `tests/`, excluded from the client bundle.
 */
import type { Profile } from "@/lib/schema";

/**
 * The hero persona: an Emirati woman making date products at home in Al Qua'a.
 * Used to assert the readiness CLIMB (scoring.md §2.4). We model "completing a
 * roadmap step" as advancing one profile field:
 *   step 0 (here) -> step 1 (register) -> step 2 (launch/MVP).
 */
export const dateFounderIdea: Profile = {
  nationality_ownership: "emirati_majority",
  location: "al_quaa_al_ain",
  stage: "idea",
  registration: "none",
  sector: "dates",
  funding_type: "grant",
  amount_band: "lt_50k",
  gender: "female",
  farm_tenure: false,
  social_impact: true,
};

/** Step 1 — after "Register a trade licence (Tajer Abu Dhabi)" is done. */
export const dateFounderRegistered: Profile = {
  ...dateFounderIdea,
  registration: "lt_1yr",
};

/** Step 2 — after "Launch and operate the product" is done (the Khalifa-flip beat). */
export const dateFounderMvp: Profile = {
  ...dateFounderRegistered,
  stage: "mvp",
};

/** A fully-matured date founder (used for Match Score worked-example A = 83). */
export const dateFounderEstablished: Profile = {
  ...dateFounderIdea,
  amount_band: "aed_200_500k",
  stage: "established",
  registration: "reg_2yr_plus",
};

/** An MVP tech founder, relocation unanswered (Match Score worked-example B = 54; Hub71 = almost). */
export const mvpTechFounder: Profile = {
  nationality_ownership: "expat",
  location: "dubai",
  stage: "mvp",
  registration: "lt_1yr",
  sector: "tech",
  funding_type: "equity",
  amount_band: "aed_200_500k",
};
