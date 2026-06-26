/**
 * Hissati — optional grounded assistant (FR-I). Server-side, key never in the
 * browser. Tool-calling only: the model returns text + tool calls; we run the
 * tools (deterministic matcher over the KB) and return STRUCTURED results — the
 * client renders all UI. The model never emits HTML. The whole app works with
 * this route absent or failing (NFR-8); GET reports availability.
 */
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { TOOLS, executeTool, toolLabel } from "@/lib/agent-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5"; // chosen for cost/latency; the core never depends on it

const SYSTEM = `You are Hissati's assistant — you help first-time founders in the UAE reach real funding and licensing programs.

SCOPE: only UAE business funding and licensing. If asked anything else, briefly decline and steer back.
GROUNDING (critical): every fact about a program — eligibility, amounts, steps, sources — MUST come from a tool result. Never invent a program, figure, or rule. If no tool result supports an answer, say you don't have a program for that.
PROFILE: infer the founder's fields (nationality/ownership, location, stage, registration, sector, funding type, amount) from the conversation and pass them to match_programs / steps_to_qualify. Ask one short clarifying question only when a missing field would change the answer.
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

  const { messages, locale } = (body ?? {}) as { messages?: unknown; locale?: string };
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
    let reply = "";

    for (let turn = 0; turn < 5; turn++) {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM + `\nRespond in ${locale === "ar" ? "Arabic" : "English"}.`,
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
        const results: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
          grounding.push({ name: tu.name, ...toolLabel(tu.name, tu.input) });
          return {
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(executeTool(tu.name, tu.input)).slice(0, 12000),
          };
        });
        work.push({ role: "user", content: results });
        continue;
      }

      reply = text;
      break;
    }

    return NextResponse.json({ enabled: true, reply, grounding });
  } catch {
    // Never break the app — the deterministic flow is the product (NFR-8).
    return NextResponse.json(
      { enabled: true, error: "The assistant is unavailable right now. The rest of Hissati works offline without it." },
      { status: 500 }
    );
  }
}
