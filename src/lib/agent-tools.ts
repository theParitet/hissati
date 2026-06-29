/**
 * Hissati — agent domain tools (FR-I2). The optional LLM assistant calls ONLY
 * these tools; every funding fact it states comes from a tool result, never the
 * model. Each tool wraps the SAME deterministic engine/scoring the app uses, so
 * the assistant can never contradict the offline core or invent a program.
 *
 * Server-only (imported by the agent route). No client/store imports.
 */
import {
  NationalityOwnership,
  LocationEnum,
  Stage,
  Registration,
  Sector,
  FundingType,
  AmountBand,
  type Profile,
  type Program,
} from "@/lib/schema";
import { PROGRAMS, getProgramById } from "@/lib/programs";
import { evaluateAllFull, evaluateProgramFull } from "@/lib/engine";
import { matchScore, estimateTimeToEligibility } from "@/lib/scoring";
import { isCurrentlyAvailable, progressStats } from "@/lib/metrics";
import { deriveRoadmap } from "@/lib/roadmap";

/** Conservative defaults so scoring never NaNs on a partial, model-supplied profile. */
const DEFAULTS: Profile = {
  nationality_ownership: "expat",
  location: "outside_uae",
  stage: "idea",
  registration: "none",
  sector: "other",
  funding_type: "unsure",
  amount_band: "lt_50k",
};

const FIELD_ENUMS = {
  nationality_ownership: NationalityOwnership,
  location: LocationEnum,
  stage: Stage,
  registration: Registration,
  sector: Sector,
  funding_type: FundingType,
  amount_band: AmountBand,
} as const;

/** Build a valid Profile from a loose, model-supplied object — invalid fields ignored. */
function buildProfile(input: unknown): Profile {
  const p: Profile = { ...DEFAULTS };
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    for (const [key, schema] of Object.entries(FIELD_ENUMS)) {
      const r = schema.safeParse(obj[key]);
      if (r.success) (p as Record<string, unknown>)[key] = r.data;
    }
    if (typeof obj.relocation_willing === "boolean") p.relocation_willing = obj.relocation_willing;
  }
  return p;
}

/**
 * Only the fields actually present and valid — NO defaults. Used to seed the
 * model with what the founder already answered (FR-I, item 11) so it never
 * re-asks; absent fields stay absent (we don't assert a guess as a known fact).
 */
export function validatedProfileFields(input: unknown): Partial<Profile> {
  const out: Partial<Profile> = {};
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    for (const [key, schema] of Object.entries(FIELD_ENUMS)) {
      const r = schema.safeParse(obj[key]);
      if (r.success) (out as Record<string, unknown>)[key] = r.data;
    }
    if (typeof obj.relocation_willing === "boolean") out.relocation_willing = obj.relocation_willing;
  }
  return out;
}

/** Profile fields the assistant may request via the collect_profile form. */
export const REQUESTABLE_FIELDS = [
  "nationality_ownership",
  "location",
  "stage",
  "registration",
  "sector",
  "funding_type",
  "amount_band",
  "relocation_willing",
] as const;

const PROFILE_SCHEMA = {
  type: "object" as const,
  description: "The founder's profile, inferred from the conversation. Provide every field you can.",
  properties: {
    nationality_ownership: { type: "string", enum: NationalityOwnership.options },
    location: { type: "string", enum: LocationEnum.options },
    stage: { type: "string", enum: Stage.options },
    registration: { type: "string", enum: Registration.options },
    sector: { type: "string", enum: Sector.options },
    funding_type: { type: "string", enum: FundingType.options },
    amount_band: { type: "string", enum: AmountBand.options },
    relocation_willing: { type: "boolean" },
  },
};

/** Tool definitions (Anthropic JSON-schema shape). */
export const TOOLS = [
  {
    name: "match_programs",
    description:
      "Classify every UAE funding program for a founder profile as eligible / almost / not-a-fit, with match %, blocking rules, time-to-qualify, and the cited source for each. Use this to answer 'what can I get?' / 'do I qualify?'.",
    input_schema: { type: "object", properties: { profile: PROFILE_SCHEMA }, required: ["profile"] },
  },
  {
    name: "steps_to_qualify",
    description:
      "Return the ordered, cited roadmap steps a founder must take to unlock the programs they are close to (e.g. register a trade licence, launch an MVP), with cost and time. Use for 'how do I qualify?' / 'what's my next step?'.",
    input_schema: { type: "object", properties: { profile: PROFILE_SCHEMA }, required: ["profile"] },
  },
  {
    name: "program_details",
    description:
      "Look up one program by id for its required documents, eligibility rules, application URL, and cited source. Valid ids: " +
      PROGRAMS.map((p) => p.id).join(", "),
    input_schema: {
      type: "object",
      properties: { program_id: { type: "string", enum: PROGRAMS.map((p) => p.id) } },
      required: ["program_id"],
    },
  },
  {
    name: "collect_profile",
    description:
      "Ask the founder for specific profile fields you still need (e.g. location, stage, registration) BEFORE answering. The app renders a quick tap-to-answer form (the founder can also just type). Use this instead of re-asking the same question in prose. Only request fields you don't already know from the conversation or the KNOWN PROFILE.",
    input_schema: {
      type: "object",
      properties: {
        fields: {
          type: "array",
          items: { type: "string", enum: [...REQUESTABLE_FIELDS] },
          minItems: 1,
          maxItems: 5,
        },
        reason: { type: "string", description: "One short line on why you need these (shown above the form)." },
      },
      required: ["fields"],
    },
  },
  {
    name: "compare_programs",
    description:
      "Compare 2–3 specific programs side by side for a founder — match %, amount, instrument, requirements met, time-to-qualify, and blocking rules. Use when the founder asks to weigh options against each other. Valid ids: " +
      PROGRAMS.map((p) => p.id).join(", "),
    input_schema: {
      type: "object",
      properties: {
        profile: PROFILE_SCHEMA,
        program_ids: {
          type: "array",
          items: { type: "string", enum: PROGRAMS.map((p) => p.id) },
          minItems: 2,
          maxItems: 3,
        },
      },
      required: ["profile", "program_ids"],
    },
  },
];

export function executeTool(
  name: string,
  input: unknown,
  doneKeys: ReadonlySet<string> = new Set(),
): unknown {
  const args = (input ?? {}) as Record<string, unknown>;
  switch (name) {
    case "match_programs": {
      const profile = buildProfile(args.profile);
      const evals = evaluateAllFull(profile, PROGRAMS, doneKeys);
      const fmt = (e: (typeof evals)[number]) => ({
        id: e.program.id,
        name: e.program.name,
        status: e.status,
        match: matchScore(profile, e.program, e.status, e.rules),
        amount: e.program.amount,
        eta: estimateTimeToEligibility(profile, e.program, e.rules),
        blocking: e.rules
          .filter((r) => !r.passed)
          .map((r) => ({ field: r.field, why: r.blocking_message, remediable: r.remediable, fix: r.remedy?.action })),
        source: e.program.source,
        availability: e.program.availability,
      });
      const scored = evals.map(fmt);
      const stats = progressStats(profile, evals, []);
      return {
        aed_reachable_now: stats.aedReachableNow,
        aed_reachable_after_steps: stats.aedReachableAfterSteps,
        programs_eligible: stats.programsEligible,
        eligible: scored
          .filter((s) => s.status === "eligible" && isCurrentlyAvailable(getProgramById(s.id)!))
          .sort((a, b) => b.match - a.match),
        almost: scored
          .filter((s) => s.status === "almost" && isCurrentlyAvailable(getProgramById(s.id)!))
          .sort((a, b) => b.match - a.match),
        unavailable: scored.filter((s) => !isCurrentlyAvailable(getProgramById(s.id)!)),
        not_fit: scored.filter((s) => s.status === "not_fit"),
      };
    }
    case "steps_to_qualify": {
      const profile = buildProfile(args.profile);
      const evals = evaluateAllFull(profile, PROGRAMS, doneKeys);
      return {
        aed_reachable_after_steps: progressStats(profile, evals, []).aedReachableAfterSteps,
        almost_ids: evals.filter((e) => e.status === "almost").map((e) => e.program.id),
        steps: deriveRoadmap(evals).map((s) => ({
          action: s.action,
          est_time: s.est_time,
          est_cost_aed: s.est_cost_aed,
          unlocks: s.unlocks.map((p) => p.name),
        })),
      };
    }
    case "compare_programs": {
      const profile = buildProfile(args.profile);
      const ids = Array.isArray(args.program_ids)
        ? args.program_ids.filter((x): x is string => typeof x === "string").slice(0, 3)
        : [];
      const evs = ids
        .map((id) => getProgramById(id))
        .filter((p): p is Program => Boolean(p))
        .map((p) => evaluateProgramFull(profile, p, doneKeys));
      return {
        ids: evs.map((e) => e.program.id),
        comparison: evs.map((e) => ({
          id: e.program.id,
          name: e.program.name,
          status: e.status,
          match: matchScore(profile, e.program, e.status, e.rules),
          amount: e.program.amount,
          instrument: e.program.instrument,
          requirements_met: e.rules.filter((r) => r.passed).length,
          requirements_total: e.rules.length,
          eta: estimateTimeToEligibility(profile, e.program, e.rules),
          blocking: e.rules.filter((r) => !r.passed).map((r) => r.blocking_message),
        })),
      };
    }
    case "program_details": {
      const p = getProgramById(String(args.program_id));
      if (!p) return { error: "No program with that id." };
      return {
        id: p.id,
        name: p.name,
        operator: p.operator,
        instrument: p.instrument,
        amount: p.amount,
        required_documents: p.required_documents,
        eligibility: p.eligibility.map((r) => ({ field: r.field, op: r.op, value: r.value, why: r.blocking_message })),
        application_url: p.application_url,
        source: p.source,
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

/** Bilingual label for the grounding chip the UI renders (FR-I3). */
export function toolLabel(name: string, input: unknown): { labelEn: string; labelAr: string } {
  const id = (input as { program_id?: string })?.program_id;
  switch (name) {
    case "match_programs":
      return { labelEn: "Checked eligibility across all programs", labelAr: "تحقّق من الأهلية عبر كل البرامج" };
    case "steps_to_qualify":
      return { labelEn: "Built your roadmap to qualify", labelAr: "أنشأ خارطة طريقك للتأهّل" };
    case "program_details":
      return { labelEn: `Looked up ${id ?? "a program"}`, labelAr: `بحث في ${id ?? "برنامج"}` };
    case "compare_programs":
      return { labelEn: "Compared the programs side by side", labelAr: "قارن بين البرامج جنباً إلى جنب" };
    case "collect_profile":
      return { labelEn: "Asked for a few details", labelAr: "طلب بعض التفاصيل" };
    default:
      return { labelEn: name, labelAr: name };
  }
}
