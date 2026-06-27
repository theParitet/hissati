/**
 * Hissati — share payloads (FR-F4). Builds a compelling, cited message a founder
 * actually wants to send (top funding within reach, or a specific program + apply
 * link) and the WhatsApp deep-link. Offline-safe (pure string building). L5 enriches
 * this (QR to the live URL, richer copy); the signatures here are the frozen contract.
 */
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { Program } from "@/lib/schema";
import type { ProgressStats } from "@/lib/metrics";
import { formatAmountRange } from "@/lib/format";
import { formatAED } from "@/components/ui";

export interface SharePayload {
  title: string;
  body: string;
  url?: string;
}

export function buildSharePayload(args: {
  kind: "plan" | "program";
  locale: Locale;
  stats?: ProgressStats;
  program?: Program;
  url?: string;
}): SharePayload {
  const { kind, locale, stats, program, url } = args;
  const isAr = locale === "ar";

  if (kind === "program" && program) {
    const name = pick(program.name, locale);
    const range = formatAmountRange(program.amount, locale);
    return {
      title: "Hissati",
      body: isAr
        ? `حِصّتي: أستكشف برنامج «${name}» (${range}).`
        : `Hissati: I'm exploring "${name}" (${range}).`,
      url: url ?? program.application_url,
    };
  }

  // plan-level
  const reach = stats
    ? `${formatAED(stats.aedReachableNow, locale)}${stats.hasOpenEndedAmounts ? "+" : ""}`
    : "—";
  const count = stats?.programsEligible ?? 0;
  return {
    title: "Hissati",
    body: isAr
      ? `حِصّتي · ضمن متناولي: ${reach} درهم عبر ${count} برنامج تمويل. خطتي مع المصادر:`
      : `Hissati · Within reach: AED ${reach} across ${count} funding programs. My cited plan:`,
    url,
  };
}

/** WhatsApp deep-link for a payload (text + optional URL). */
export function waHref(p: SharePayload): string {
  const text = [p.body, p.url].filter(Boolean).join(" ");
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
