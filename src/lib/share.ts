/**
 * Hissati — share payloads + offline QR (FR-F4).
 *
 * Builds a compelling, cited message a founder actually wants to send (top funding
 * within reach + the eligible program names, or a specific program + apply link)
 * and the WhatsApp deep-link. Also resolves the live-app URL and renders a QR code
 * fully OFFLINE (qrcode-generator — pure JS, no DOM, no runtime CDN), so the same
 * matrix backs both the in-app ShareSheet (React SVG) and the PDF (inline SVG).
 *
 * `buildSharePayload` / `waHref` signatures are the frozen contract; `eligibleNames`
 * is an additive, optional field so existing call-sites keep type-checking.
 */
import qrcode from "qrcode-generator";
import type { Locale } from "@/lib/i18n";
import { pick, ui } from "@/lib/i18n";
import type { Program } from "@/lib/schema";
import type { ProgressStats } from "@/lib/metrics";
import { formatAmountRange } from "@/lib/format";
import { formatAED } from "@/components/ui";

export interface SharePayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * The message a founder is PROUD to forward to family or a mentor: one punchy line
 * leading with the exciting, specific outcome (the cited AED within reach), the top
 * 1–3 eligible programs, and a cited tag — short, warm, tasteful emoji, bilingual.
 * When nothing is open yet it leads on roadmap momentum so it never
 * reads as a dead end. The per-program variant is the founder claiming one match.
 */
export function buildSharePayload(args: {
  kind: "plan" | "program";
  locale: Locale;
  stats?: ProgressStats;
  program?: Program;
  url?: string;
  /** Eligible program names for a richer plan message (additive — optional). */
  eligibleNames?: string[];
}): SharePayload {
  const { kind, locale, stats, program, url, eligibleNames } = args;
  const isAr = locale === "ar";

  if (kind === "program" && program) {
    const name = pick(program.name, locale);
    const range = formatAmountRange(program.amount, locale);
    const how = ui(locale)[`intro_${program.intro_method}`] ?? "";
    const available = program.availability.status === "open" || program.availability.status === "rolling";
    return {
      title: "Hissati",
      body: isAr
        ? available
          ? `🎯 وجدت مطابقة تمويل مفتوحة: «${name}» — ${range}${how ? ` · ${how}` : ""}.\nكل التفاصيل بمصدرها 👇`
          : `🔎 أتابع الدورة القادمة من «${name}» — ${range}.\nالحالة والتفاصيل موثّقة هنا 👇`
        : available
          ? `🎯 Found an open funding match: ${name} — ${range}${how ? ` · ${how}` : ""}.\nAll details source-checked 👇`
          : `🔎 I’m tracking the next cycle of ${name} — ${range}.\nIts status and source-checked details are here 👇`,
      // Per-program: the apply link is the useful destination for the recipient.
      url: url ?? program.application_url,
    };
  }

  // plan-level — lead with the exciting, cited number, then name the wins.
  const reach = stats
    ? `${formatAED(stats.aedReachableNow, locale)}${stats.hasOpenEndedAmounts ? "+" : ""}`
    : "—";
  const count = stats?.programsEligible ?? 0;
  const almost = stats?.programsAlmost ?? 0;
  const names = (eligibleNames ?? []).filter(Boolean).slice(0, 3);
  const namesStr = names.join(isAr ? "، " : ", ");

  // No money in hand yet → lead on momentum so the message still feels like a win.
  if (count === 0 || stats?.aedReachableNow === 0) {
    const body = isAr
      ? `🌱 رسمت طريقي نحو التمويل الإماراتي${almost ? ` — ${almost} برنامج ضمن خارطة طريقي` : ""}.\nهذه خطتي بخطواتها الموثّقة 👇`
      : `🌱 I mapped my path to UAE funding${almost ? ` — ${almost} programs are on my roadmap` : ""}.\nHere's my cited plan and exact next steps 👇`;
    return { title: "Hissati", body, url };
  }

  const winLine = names.length
    ? isAr
      ? `\n✅ مؤهَّل الآن: ${namesStr}.`
      : `\n✅ Eligible now: ${namesStr}.`
    : "";

  return {
    title: "Hissati",
    body: isAr
      ? `🌱 وجدت ${reach} درهم تمويلاً إماراتياً يمكنني التقديم عليه فعلاً!${winLine}\nكل رقم بمصدره 👇`
      : `🌱 I found AED ${reach} in UAE funding I can actually apply for!${winLine}\nEvery figure is source-checked 👇`,
    url,
  };
}

/** WhatsApp deep-link for a payload (text + optional URL). */
export function waHref(p: SharePayload): string {
  const text = [p.body, p.url].filter(Boolean).join(" ");
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/* -------------------------------------------------------------------------- */
/* Live-app URL + offline QR                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The deployed app URL. Build-time `NEXT_PUBLIC_APP_URL` wins; otherwise we use the
 * real origin at runtime (so a preview/local build still produces a working QR),
 * with a final constant fallback for SSR/build. No hardcoding, no network.
 */
export function appUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && /^https?:\/\//.test(env)) return env.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://hissati.app";
}

/**
 * Encode `text` into a QR module matrix and emit a single SVG `path` of the dark
 * cells (plus a quiet-zone `margin`). One compact path → tiny DOM, and it survives
 * html2canvas (the PDF) exactly as it renders in React (the ShareSheet). ECL "M"
 * balances density vs. scan resilience; type 0 auto-sizes to the URL length.
 */
export function qrSvgPath(text: string, margin = 2): { path: string; size: number } {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const size = count + margin * 2;
  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        path += `M${col + margin} ${row + margin}h1v1h-1z`;
      }
    }
  }
  return { path, size };
}
