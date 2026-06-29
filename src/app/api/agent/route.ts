/**
 * Hissati — optional grounded assistant (FR-I). Server-side, key never in the
 * browser. Tool-calling only: the model returns text + tool calls; we run the
 * tools (deterministic matcher over the KB) and return STRUCTURED results — the
 * client renders all UI. The model never emits HTML. The whole app works with
 * this route absent or failing (NFR-8); GET reports availability.
 */
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { TOOLS, executeTool, toolLabel, validatedProfileFields, REQUESTABLE_FIELDS } from "@/lib/agent-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5"; // chosen for cost/latency; the core never depends on it

const SYSTEM = `You are Hissati's assistant — you help first-time founders in the UAE reach real funding and licensing programs.

SCOPE: only UAE business funding and licensing. If asked anything else, briefly decline and steer back.
GROUNDING (critical): every fact about a program — eligibility, amounts, steps, sources — MUST come from a tool result. Never invent a program, figure, or rule. If no tool result supports an answer, say you don't have a program for that.
PROFILE: a "KNOWN PROFILE" block may be provided — treat those fields as already answered and NEVER ask them again. For fields you still need to give a good answer, call collect_profile (the app shows the founder a quick tap-to-answer form) instead of re-asking in prose. Pass the fullest profile you have to match_programs / steps_to_qualify / compare_programs.
STYLE: concise; information, not legal or financial advice. Plain text only — never output HTML or markup; the app renders the UI.`;

interface InMsg {
  role: "user" | "assistant";
  content: string;
}

// Best-effort per-IP rate limit. NOTE: serverless memory is per-instance and
// resets on cold start — this stops casual abuse, NOT a distributed flood. The
// durable cost ceiling is a monthly spend cap on the API key (Anthropic Console).
const RL = new Map<string, number[]>();
const RL_MAX = 20;
const RL_WINDOW_MS = 5 * 60 * 1000;
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (RL.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  hits.push(now);
  RL.set(ip, hits);
  if (RL.size > 5000) RL.clear(); // crude memory bound
  return hits.length > RL_MAX;
}

/**
 * Which program ids a tool result surfaced — the client re-renders these as real
 * ProgramCards from the SAME deterministic engine (the model never ships UI/HTML).
 */
function collectProgramIds(name: string, result: unknown): string[] {
  if (!result || typeof result !== "object") return [];
  const r = result as Record<string, unknown>;
  const idsOf = (arr: unknown): string[] =>
    Array.isArray(arr)
      ? arr.map((x) => (x as { id?: unknown }).id).filter((v): v is string => typeof v === "string")
      : [];
  if (name === "match_programs") return [...idsOf(r.eligible), ...idsOf(r.almost)];
  if (name === "steps_to_qualify")
    return Array.isArray(r.almost_ids) ? r.almost_ids.filter((v): v is string => typeof v === "string") : [];
  if (name === "program_details") return typeof r.id === "string" ? [r.id] : [];
  return [];
}

/** Program ids the model asked to compare — rendered inline as a CompareView. */
function collectCompareIds(result: unknown): string[] {
  if (!result || typeof result !== "object") return [];
  const r = result as Record<string, unknown>;
  return Array.isArray(r.ids) ? r.ids.filter((v): v is string => typeof v === "string") : [];
}

interface AgentStats {
  aedReachableNow?: number;
  aedReachableAfterSteps?: number;
  programsEligible?: number;
}

function num(o: unknown, key: string): number | undefined {
  if (o && typeof o === "object") {
    const v = (o as Record<string, unknown>)[key];
    if (typeof v === "number") return v;
  }
  return undefined;
}

/**
 * Lift the cited money figures the money-tools already compute (match_programs /
 * steps_to_qualify) so the client can render the "within reach" ledger chip — the
 * same honest, falsifiable number as the dashboard. Never a readiness score.
 */
function collectStats(name: string, result: unknown, prev?: AgentStats): AgentStats | undefined {
  if (name === "match_programs") {
    return {
      ...prev,
      aedReachableNow: num(result, "aed_reachable_now"),
      aedReachableAfterSteps: num(result, "aed_reachable_after_steps"),
      programsEligible: num(result, "programs_eligible"),
    };
  }
  if (name === "steps_to_qualify") {
    return { ...prev, aedReachableAfterSteps: num(result, "aed_reachable_after_steps") };
  }
  return prev;
}

export function GET() {
  return NextResponse.json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ enabled: false, error: "Assistant is disabled (no API key configured)." }, { status: 503 });
  }

  // Same-origin only — blocks scripted cross-site abuse (the model is already
  // fixed server-side; this protects spend, not the model choice).
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Bad origin." }, { status: 403 });
    }
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests — please slow down." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { messages, locale, profile, doneKeys } = (body ?? {}) as {
    messages?: unknown;
    locale?: string;
    profile?: unknown;
    doneKeys?: unknown;
  };
  // Completed roadmap steps the founder has marked done — clear their gates so the
  // assistant's grounding matches the dashboard (NOT the model's claim; the client's).
  const doneKeySet = new Set(
    Array.isArray(doneKeys) ? doneKeys.filter((k): k is string => typeof k === "string") : [],
  );
  // Seed the model with what the founder already answered so it never re-asks.
  const known = validatedProfileFields(profile);
  const knownStr = Object.keys(known).length
    ? `\n\nKNOWN PROFILE (already answered — DO NOT ask these again; pass them to the tools): ${JSON.stringify(known)}`
    : "";
  const convo: InMsg[] = (Array.isArray(messages) ? messages : [])
    .filter(
      (m): m is InMsg =>
        !!m && typeof (m as InMsg).content === "string" && ((m as InMsg).role === "user" || (m as InMsg).role === "assistant")
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (convo.length === 0 || convo[convo.length - 1].role !== "user") {
    return NextResponse.json({ error: "Expected a trailing user message." }, { status: 400 });
  }

  try {
    const client = new Anthropic();
    const work: Anthropic.MessageParam[] = convo.map((m) => ({ role: m.role, content: m.content }));
    const grounding: Array<{ name: string; labelEn: string; labelAr: string }> = [];
    const programIds = new Set<string>();
    const compareIds = new Set<string>();
    let stats: AgentStats | undefined;
    let reply = "";

    for (let turn = 0; turn < 5; turn++) {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM + knownStr + `\nRespond in ${locale === "ar" ? "Arabic" : "English"}.`,
        tools: TOOLS as Anthropic.Tool[],
        messages: work,
      });

      const text = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");

      if (resp.stop_reason === "tool_use") {
        work.push({ role: "assistant", content: resp.content });
        const toolUses = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

        // collect_profile pauses the server loop and hands a form spec to the client.
        // The client gathers answers, persists them, and re-asks with an enriched
        // profile seed — far more robust than threading tool_results across requests.
        const formReq = toolUses.find((tu) => tu.name === "collect_profile");
        if (formReq) {
          const f = (formReq.input ?? {}) as { fields?: unknown; reason?: unknown };
          const fields = Array.isArray(f.fields)
            ? f.fields
                .filter((x): x is string => typeof x === "string" && (REQUESTABLE_FIELDS as readonly string[]).includes(x))
                .slice(0, 5)
            : [];
          grounding.push({ name: "collect_profile", ...toolLabel("collect_profile", formReq.input) });
          return NextResponse.json({
            enabled: true,
            reply: text,
            grounding,
            programIds: Array.from(programIds).slice(0, 6),
            compareIds: Array.from(compareIds).slice(0, 3),
            stats,
            form: { fields, reason: typeof f.reason === "string" ? f.reason : undefined },
          });
        }

        const results: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
          grounding.push({ name: tu.name, ...toolLabel(tu.name, tu.input) });
          const result = executeTool(tu.name, tu.input, doneKeySet);
          for (const id of collectProgramIds(tu.name, result)) programIds.add(id);
          if (tu.name === "compare_programs") for (const id of collectCompareIds(result)) compareIds.add(id);
          stats = collectStats(tu.name, result, stats);
          return {
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(result).slice(0, 12000),
          };
        });
        work.push({ role: "user", content: results });
        continue;
      }

      reply = text;
      break;
    }

    return NextResponse.json({
      enabled: true,
      reply,
      grounding,
      programIds: Array.from(programIds).slice(0, 6),
      compareIds: Array.from(compareIds).slice(0, 3),
      stats,
    });
  } catch {
    // Never break the app — the deterministic flow is the product (NFR-8).
    return NextResponse.json(
      { enabled: true, error: "The assistant is unavailable right now. The rest of Hissati works offline without it." },
      { status: 500 }
    );
  }
}
