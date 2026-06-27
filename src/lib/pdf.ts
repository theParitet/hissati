/**
 * Hissati — the **Funding Readiness Plan** PDF (FR-F2): a real bilingual document a
 * founder can carry to a bank or a TAMM service centre and actually work from.
 *
 * The page is an official *worksheet*: a compact cover with the cited "AED within
 * reach" headline as the hero, ONE prioritised tick-box action checklist (the steps
 * that unlock funding + the documents to gather, each with its cited time/cost), a
 * scannable "how to apply" block per eligible program (amount, method, processing
 * time, apply URL, verified source + date), the "one step away" programs with their
 * blocking rule → cited remedy, and a QR to the live app. html2canvas rasterises a
 * dedicated, inline-styled element (so Arabic shaping is preserved and no
 * Tailwind/oklch CSS trips the renderer) and jsPDF paginates it onto A4.
 *
 * html2canvas survival rules followed here: hex colours only (never oklch/var
 * colour tokens); spacing via margins, not flex `gap`; accent edges are a flex
 * first-child bar so they sit on the start side in both LTR and RTL; the Al Sadu
 * band/seal and the QR are plain inline SVG (shapes only — no <pattern>/gradients)
 * so they serialise cleanly; every user/program string is escaped. The heavy
 * html2canvas/jsPDF deps load lazily so the HTML builder is import-safe in Node
 * (unit/preview). Saves as hissati-plan-{locale}.pdf.
 */
import { ui, pick, toLocaleDigits, enumLabel, type Locale } from "@/lib/i18n";
import { formatAmountRange, localizeDate } from "@/lib/format";
import { estimateTimeToEligibility } from "@/lib/scoring";
import { appUrl, qrSvgPath } from "@/lib/share";
import type { ProgressStats } from "@/lib/metrics";
import { isCurrentlyAvailable } from "@/lib/metrics";
import type { EvaluatedProgram, Profile } from "@/lib/schema";
import type { RoadmapStep } from "@/lib/roadmap";

/* Palette — inline hex twins of the Al Qua'a tokens (html2canvas can't read oklch). */
const C = {
  paper: "#fbf8f1",
  white: "#ffffff",
  ink: "#21180f",
  soft: "#5c5043",
  faint: "#8a7d6c",
  line: "#e3d8c4",
  oasis: "#14584a",
  oasisDeep: "#0e4034",
  goldOnInk: "#e9c178", // light gold legible on the deep-green hero
  gold: "#b9711a",
  palm: "#1f7a52",
  palmBg: "#eef5f0",
  almost: "#b8730f",
  almostBg: "#faf2dd",
  clay: "#9c4a2f",
  clayBg: "#f3e6df",
};

const BODY = "var(--font-tajawal), 'Tajawal', system-ui, -apple-system, sans-serif";
const DISPLAY = "var(--font-fraunces), var(--font-tajawal), 'Tajawal', Georgia, serif";
const MONO = "var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const CONTENT_W = 722; // 794 (A4 @96dpi) − 2 × 36px padding

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** A printed URL: drop the protocol, keep the path (so it fits and reads cleanly). */
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Grouped AED in the ledger voice (localized digits), e.g. EN "AED 200,000" / AR "٢٠٠٬٠٠٠ درهم". */
function money(aed: number, locale: Locale, open = false): string {
  const grouped = Math.round(aed).toLocaleString("en-US");
  const digits = toLocaleDigits(grouped, locale);
  const plus = open ? "+" : "";
  return locale === "ar" ? `${digits}${plus} درهم` : `AED ${digits}${plus}`;
}

/* --------------------------------------------------------------------------
 * Signature motifs — Al Sadu weave, rendered as plain inline SVG (shapes only).
 * ------------------------------------------------------------------------ */

/** A woven selvedge: gold warp rule, an oasis sawtooth (the Sadu "tooth"), clay weft. */
function saduBand(width = CONTENT_W): string {
  const h = 16;
  const step = 16;
  const n = Math.ceil(width / step);
  let zig = "";
  let dots = "";
  for (let i = 0; i <= n; i++) {
    const x = i * step;
    const y = i % 2 === 0 ? 5 : h - 5;
    zig += `${x},${y} `;
    if (i % 2 === 0) dots += `<circle cx="${x}" cy="${y}" r="1.7" fill="${C.gold}"/>`;
  }
  return `<svg width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">
    <rect x="0" y="0" width="${width}" height="1.4" fill="${C.gold}"/>
    <polyline points="${zig.trim()}" fill="none" stroke="${C.oasis}" stroke-width="2"/>
    ${dots}
    <rect x="0" y="${h - 1.4}" width="${width}" height="1.4" fill="${C.clay}"/>
  </svg>`;
}

/** A wax-seal lockup: a sadu-toothed ring around the Hissati compass mark. */
function seal(size = 56, onDark = false): string {
  const r = size / 2;
  const teethN = 28;
  const disc = onDark ? C.white : C.paper;
  const ring = onDark ? C.white : C.oasis;
  let teeth = "";
  for (let i = 0; i < teethN; i++) {
    const a = (i / teethN) * Math.PI * 2;
    const x1 = r + Math.cos(a) * (r - 1.5);
    const y1 = r + Math.sin(a) * (r - 1.5);
    const x2 = r + Math.cos(a) * (r - 5.5);
    const y2 = r + Math.sin(a) * (r - 5.5);
    teeth += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${i % 2 ? C.gold : ring}" stroke-width="1.6"/>`;
  }
  // Compass glyph (Logo geometry, 100-unit space) scaled into the inner disc.
  const s = (size - 18) / 72;
  const glyph = `<g transform="translate(${r} ${r}) scale(${s.toFixed(3)}) translate(-50 -50)">
    <circle cx="50" cy="50" r="28" fill="none" stroke="${C.oasis}" stroke-width="11"/>
    <path d="M 26.25 35.16 A 28 28 0 0 1 73.75 35.16" fill="none" stroke="${C.gold}" stroke-width="11"/>
    <path d="M50 57 L50 38" stroke="${C.oasis}" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M50 47 Q 46 40 41 40.5" stroke="${C.oasis}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <path d="M50 47 Q 54 40 59 40.5" stroke="${C.oasis}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <circle cx="47.2" cy="46.2" r="1.6" fill="${C.oasis}"/>
    <circle cx="52.8" cy="46.2" r="1.6" fill="${C.oasis}"/>
  </g>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">
    <circle cx="${r}" cy="${r}" r="${r - 0.8}" fill="${disc}" stroke="${ring}" stroke-width="1.2"/>
    ${teeth}
    <circle cx="${r}" cy="${r}" r="${r - 7}" fill="${onDark ? C.white : C.paper}"/>
    ${glyph}
  </svg>`;
}

/** Offline QR (inline SVG path) — same encoder as the in-app ShareSheet. */
function qrSvg(text: string, px: number): string {
  const { path, size } = qrSvgPath(text);
  return `<svg width="${px}" height="${px}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="${C.white}"/>
    <path d="${path}" fill="${C.ink}"/>
  </svg>`;
}

/* --------------------------------------------------------------------------
 * Small typographic primitives
 * ------------------------------------------------------------------------ */

function eyebrow(txt: string, color: string): string {
  return `<div style="font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${color}">${esc(
    txt
  )}</div>`;
}

/** A pen-tickable square (paper checkbox). */
function box(color = C.oasis, size = 14): string {
  return `<span style="display:inline-block;flex:0 0 auto;width:${size}px;height:${size}px;border:1.6px solid ${color};border-radius:3px;background:${C.white}"></span>`;
}

/** A right-aligned data pill (time/cost). Always mono + LTR. */
function metaPill(text: string, color = C.soft): string {
  return `<span dir="ltr" style="flex:0 0 auto;font-family:${MONO};font-size:10px;color:${color};border:1px solid ${C.line};background:${C.white};border-radius:999px;padding:2px 8px;white-space:nowrap">${esc(
    text
  )}</span>`;
}

function sectionHeader(eb: string, title: string, color: string, count: number | undefined, locale: Locale): string {
  const badge =
    count != null
      ? `<span dir="ltr" style="font-family:${MONO};font-size:11px;font-weight:700;color:${C.white};background:${color};border-radius:999px;padding:1px 9px">${toLocaleDigits(
          count,
          locale
        )}</span>`
      : "";
  return `<div style="margin:24px 0 9px">
    ${eyebrow(eb, C.faint)}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:3px">
      <span style="font-family:${DISPLAY};font-size:17px;font-weight:800;color:${color};line-height:1.1">${esc(title)}</span>
      ${badge}
    </div>
    <div style="height:2px;background:${color};opacity:0.22;margin-top:7px"></div>
  </div>`;
}

/** Access date + source confidence, without overstating approval or freshness. */
function verifiedStamp(ev: EvaluatedProgram, locale: Locale, t: Record<string, string>): string {
  const sourceDate = ev.program.source.source_date
    ? ` · source ${localizeDate(ev.program.source.source_date, locale)}`
    : "";
  return `<span dir="ltr" style="display:inline-block;border:1px solid ${C.clay};background:${C.clayBg};border-radius:6px;padding:2px 8px;font-family:${MONO};font-size:9.5px;color:${C.clay};line-height:1.3">✓ checked · ${esc(
    host(ev.program.source.url)
  )} · ${localizeDate(ev.program.source.verified_date, locale)}${sourceDate} · ${esc(
    t[`confidence_${ev.program.source.confidence}`]
  )}</span>`;
}

/* --------------------------------------------------------------------------
 * Cover (compact: masthead + hero number + profile snapshot)
 * ------------------------------------------------------------------------ */

function chip(label: string, value: string): string {
  return `<span style="display:inline-block;margin:0 4px 6px 4px;padding:3px 10px;border:1px solid ${C.line};border-radius:999px;background:${C.white};font-size:11px;color:${C.ink}"><span style="color:${C.faint}">${esc(
    label
  )}: </span>${esc(value)}</span>`;
}

function founderSnapshot(profile: Profile, locale: Locale, today: string): string {
  const ar = locale === "ar";
  const chips = [
    chip(ar ? "القطاع" : "Sector", enumLabel("sector", profile.sector, locale)),
    chip(ar ? "المرحلة" : "Stage", enumLabel("stage", profile.stage, locale)),
    chip(ar ? "الموقع" : "Location", enumLabel("location", profile.location, locale)),
    chip(ar ? "الملكية" : "Ownership", enumLabel("nationality_ownership", profile.nationality_ownership, locale)),
    chip(ar ? "التسجيل" : "Registration", enumLabel("registration", profile.registration, locale)),
    chip(ar ? "نوع التمويل" : "Funding", enumLabel("funding_type", profile.funding_type, locale)),
  ].join("");
  return `<div style="margin-top:14px"><div style="margin:0 4px 7px 4px">${eyebrow(
    `${ar ? "أُعدّت لـ" : "Prepared for"} · ${today}`,
    C.faint
  )}</div>${chips}</div>`;
}

function cover(profile: Profile, stats: ProgressStats, locale: Locale, t: Record<string, string>, today: string): string {
  const ar = locale === "ar";
  const masthead = `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px">
    <div style="display:flex;align-items:center">
      ${seal(56)}
      <div style="margin:0 13px">
        <div style="font-family:${DISPLAY};font-size:24px;font-weight:800;color:${C.oasis};line-height:1.0">${esc(t.appName)}</div>
        <div style="font-size:11px;color:${C.faint};margin-top:3px">${esc(t.tagline)} · ${esc(t.builtFor)}</div>
      </div>
    </div>
    <div style="text-align:end">
      ${eyebrow(ar ? "وثيقة" : "Document", C.faint)}
      <div style="font-family:${DISPLAY};font-size:15px;font-weight:800;color:${C.ink};margin-top:3px;line-height:1.1">${
        ar ? "خطة الجاهزية للتمويل" : "Funding Readiness Plan"
      }</div>
    </div>
  </div>`;

  const delta = stats.aedReachableAfterSteps - stats.aedReachableNow;
  const deltaLine =
    delta > 0
      ? `<div style="margin-top:9px;font-size:11.5px;color:${C.goldOnInk}">+ ${money(
          delta,
          locale,
          stats.hasOpenEndedAmounts
        )} ${ar ? "يُفتح عند إكمال خطواتك" : "unlocks as you complete your steps"}</div>`
      : "";

  const hero = `<div style="margin-top:15px;background:${C.oasisDeep};border-radius:16px;padding:20px 24px;color:${C.white};display:flex;justify-content:space-between;align-items:center">
    <div style="min-width:0">
      ${eyebrow(ar ? "ضمن متناولك الآن" : "AED within reach now", C.goldOnInk)}
      <div dir="ltr" style="font-family:${MONO};font-size:40px;font-weight:700;letter-spacing:-0.5px;color:${C.white};line-height:1.04;margin-top:6px">${money(
        stats.aedReachableNow,
        locale,
        stats.hasOpenEndedAmounts
      )}</div>
      <div style="font-size:12.5px;color:#d6e4dd;margin-top:8px">${toLocaleDigits(stats.programsEligible, locale)} ${
        ar ? "من" : "of"
      } ${toLocaleDigits(stats.programsTotal, locale)} ${ar ? "مطابقة تمويل مفتوحة تستوفي الشروط المنشورة" : "open funding matches meeting published criteria"}</div>
      ${deltaLine}
    </div>
    <div style="flex:0 0 auto;margin:0 6px">${seal(60, true)}</div>
  </div>`;

  return masthead + hero + founderSnapshot(profile, locale, today);
}

/* --------------------------------------------------------------------------
 * Action checklist — ONE prioritised, pen-tickable worksheet.
 * ------------------------------------------------------------------------ */

/** A numbered step row: ☐ [n] action ............ [≈ time · AED cost]. */
function stepRow(s: RoadmapStep, i: number, locale: Locale): string {
  const meta: string[] = [];
  if (s.est_time) meta.push(`≈ ${s.est_time}`);
  if (typeof s.est_cost_aed === "number" && s.est_cost_aed > 0) meta.push(money(s.est_cost_aed, locale));
  const pill = meta.length ? metaPill(meta.join(" · "), C.oasis) : "";
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin:9px 0;break-inside:avoid">
    <div style="display:flex;align-items:flex-start;min-width:0;flex:1 1 auto">
      ${box(C.oasis)}
      <span style="margin:0 9px;font-size:12.5px;color:${C.soft};line-height:1.45;padding-top:1px"><span dir="ltr" style="font-family:${MONO};font-weight:700;color:${C.oasis}">${toLocaleDigits(
        i + 1,
        locale
      )}.</span> ${esc(pick(s.action, locale))}</span>
    </div>
    <div style="margin:1px 0 0 9px">${pill}</div>
  </div>`;
}

/** A document row: ☐ document name ............ [format]. */
function docRow(text: string, format: string | undefined): string {
  const pill = format ? metaPill(format, C.faint) : "";
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin:7px 0;break-inside:avoid">
    <div style="display:flex;align-items:flex-start;min-width:0;flex:1 1 auto">
      ${box(C.gold, 13)}
      <span style="margin:0 9px;font-size:12px;color:${C.soft};line-height:1.4;padding-top:1px">${esc(text)}</span>
    </div>
    <div style="margin:1px 0 0 9px">${pill}</div>
  </div>`;
}

/** Every required doc across the given programs, deduped (take-to-the-bank list). */
function documentRows(programs: EvaluatedProgram[], locale: Locale): string {
  const map = new Map<string, { text: string; format?: string }>();
  for (const ev of programs) {
    for (const d of ev.program.required_documents) {
      const key = d.en.toLowerCase().trim();
      if (!map.has(key)) map.set(key, { text: locale === "ar" ? d.ar : d.en, format: d.format });
    }
  }
  return [...map.values()].map((it) => docRow(it.text, it.format)).join("");
}

function subLabel(txt: string, color: string): string {
  return `<div style="display:flex;align-items:center;margin:4px 0 2px"><span style="width:6px;height:6px;border-radius:999px;background:${color};margin:0 7px"></span><span style="font-size:11px;font-weight:700;color:${color};letter-spacing:0.02em">${esc(
    txt
  )}</span></div>`;
}

function actionChecklist(steps: RoadmapStep[], gatherFrom: EvaluatedProgram[], locale: Locale): string {
  const ar = locale === "ar";
  const docs = documentRows(gatherFrom, locale);
  if (!steps.length && !docs) return "";

  const intro = `<div style="font-size:11px;color:${C.faint};margin:-4px 0 8px">${
    ar
      ? "علّم كل بند بالقلم وأنت تنجزه. احمل هذه الصفحة إلى المصرف أو مركز تم."
      : "Tick each item with a pen as you go. Take this page to the bank or a TAMM centre."
  }</div>`;

  const stepsBlock = steps.length
    ? subLabel(ar ? "خطوات تفتح لك التمويل" : "Steps that unlock funding", C.oasis) +
      steps.map((s, i) => stepRow(s, i, locale)).join("")
    : "";

  const docsBlock = docs ? subLabel(ar ? "مستندات تجهّزها" : "Documents to gather", C.gold) + docs : "";

  return (
    sectionHeader(
      ar ? "قائمة المهام" : "Action checklist",
      ar ? "خطواتك القادمة" : "Your next moves",
      C.ink,
      steps.length || undefined,
      locale
    ) +
    intro +
    stepsBlock +
    (stepsBlock && docsBlock ? `<div style="height:1px;background:${C.line};margin:14px 0 6px"></div>` : "") +
    docsBlock
  );
}

/* --------------------------------------------------------------------------
 * Program blocks
 * ------------------------------------------------------------------------ */

/** A row of label: value, with the value in the body voice (or mono LTR for URLs). */
function applyRow(label: string, value: string, ltr = false): string {
  return `<div style="font-size:11.5px;color:${C.soft};margin-top:3px"><span style="color:${C.faint}">${esc(
    label
  )}: </span>${ltr ? `<span dir="ltr" style="font-family:${MONO};font-size:10.5px;color:${C.oasis};word-break:break-all">${esc(value)}</span>` : esc(value)}</div>`;
}

/** Header row shared by both program block kinds: name + operator + cited amount. */
function programHead(ev: EvaluatedProgram, locale: Locale, amountColor: string): string {
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between">
    <div style="min-width:0;max-width:440px">
      <div style="font-weight:700;color:${C.ink};font-size:14.5px;line-height:1.25">${esc(pick(ev.program.name, locale))}</div>
      <div style="color:${C.faint};font-size:11px;margin-top:2px">${esc(ev.program.operator)}</div>
    </div>
    <div dir="ltr" style="font-family:${MONO};font-weight:700;color:${amountColor};font-size:14px;white-space:nowrap;margin:0 0 0 10px">${esc(
      formatAmountRange(ev.program.amount, locale)
    )}</div>
  </div>`;
}

/** Eligible: a scannable "how to apply" block with an oasis start-edge. */
function eligibleBlock(ev: EvaluatedProgram, locale: Locale, t: Record<string, string>): string {
  const ar = locale === "ar";
  const introLabel = t[`intro_${ev.program.intro_method}`] ?? ev.program.intro_method;
  const rows =
    applyRow(ar ? "كيفية التقديم" : "How", introLabel) +
    (ev.program.processing_time ? applyRow(ar ? "المدة" : "Processing", ev.program.processing_time) : "") +
    applyRow(ar ? "الرابط" : "Apply", prettyUrl(ev.program.application_url), true);

  return `<div style="display:flex;align-items:stretch;margin:9px 0;break-inside:avoid;border:1px solid ${C.line};border-radius:12px;background:${C.white};overflow:hidden">
    <div style="flex:0 0 auto;width:5px;background:${C.palm}"></div>
    <div style="flex:1 1 auto;padding:12px 15px;min-width:0">
      ${programHead(ev, locale, C.palm)}
      <div style="margin-top:8px;border-top:1px solid ${C.line};padding-top:7px">${rows}</div>
      <div style="margin-top:9px">${verifiedStamp(ev, locale, t)}</div>
    </div>
  </div>`;
}

/** Almost: the blocking rule → cited remedy, amber start-edge. */
function almostBlock(ev: EvaluatedProgram, profile: Profile, locale: Locale, t: Record<string, string>): string {
  const eta = estimateTimeToEligibility(profile, ev.program, ev.rules);
  const remedies = ev.rules
    .filter((r) => !r.passed && r.remediable && r.remedy)
    .map(
      (r) =>
        `<div style="margin-top:6px;font-size:11.5px;color:${C.soft};line-height:1.4"><span style="color:${C.almost}">●</span> ${esc(
          pick(r.blocking_message, locale)
        )}<div style="color:${C.oasis};margin-top:1px">→ ${esc(pick(r.remedy!.action, locale))}${
          r.remedy!.est_time ? ` <span style="color:${C.faint}">· ${esc(r.remedy!.est_time)}</span>` : ""
        }</div></div>`
    )
    .join("");

  return `<div style="display:flex;align-items:stretch;margin:9px 0;break-inside:avoid;border:1px solid ${C.line};border-radius:12px;background:${C.almostBg};overflow:hidden">
    <div style="flex:0 0 auto;width:5px;background:${C.almost}"></div>
    <div style="flex:1 1 auto;padding:12px 15px;min-width:0">
      ${programHead(ev, locale, C.almost)}
      <div style="margin-top:8px;border-top:1px dashed ${C.almost};padding-top:7px">
        <div style="font-weight:700;color:${C.almost};font-size:12px">${esc(t.youCouldQualify)} <span style="color:${C.faint};font-weight:400">· ${esc(
          eta
        )}</span></div>
        ${remedies}
      </div>
      <div style="margin-top:9px">${verifiedStamp(ev, locale, t)}</div>
    </div>
  </div>`;
}

/* --------------------------------------------------------------------------
 * Builder (pure — import-safe in Node, used by exportPlanPdf + preview)
 * ------------------------------------------------------------------------ */

export function buildPlanHtml(opts: {
  profile: Profile;
  evaluated: EvaluatedProgram[];
  steps: RoadmapStep[];
  stats: ProgressStats;
  locale: Locale;
}): { html: string; dir: "rtl" | "ltr"; width: number } {
  const { profile, evaluated, steps, stats, locale } = opts;
  const t = ui(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const ar = locale === "ar";
  const eligible = evaluated.filter((e) => e.status === "eligible" && isCurrentlyAvailable(e.program));
  const almost = evaluated.filter((e) => e.status === "almost" && isCurrentlyAvailable(e.program));
  const gatherFrom = [...eligible, ...almost];
  const url = appUrl();
  const today = localizeDate(new Date().toISOString().slice(0, 10), locale);

  const empty =
    !eligible.length && !almost.length && !steps.length
      ? `<div style="margin-top:24px;border:1px dashed ${C.line};border-radius:12px;padding:24px;text-align:center;color:${C.soft};font-size:13px">${
          ar ? "أكمل الأسئلة لبناء خطتك." : "Answer the questionnaire to build your plan."
        }</div>`
      : "";

  const footer = `<div style="margin-top:24px;border-top:1px solid ${C.line};padding-top:14px;display:flex;justify-content:space-between;align-items:center">
    <div style="max-width:440px">
      <div style="font-size:11.5px;color:${C.soft};font-weight:700">${esc(t.cited)}</div>
      <div style="font-size:10px;color:${C.faint};margin-top:4px">${esc(t.appName)} · ${esc(t.tagline)} · ${today}</div>
    </div>
    <div style="text-align:center">
      ${qrSvg(url, 78)}
      <div style="font-size:9px;color:${C.faint};margin-top:4px">${ar ? "امسح لفتح حِصّتي" : "Scan to open Hissati"}</div>
    </div>
  </div>`;

  const html = `
    ${saduBand()}
    ${cover(profile, stats, locale, t, today)}
    ${empty}
    ${actionChecklist(steps, gatherFrom, locale)}
    ${eligible.length ? sectionHeader(ar ? "قدّم الآن" : "Apply now", t.eligibleNow, C.palm, eligible.length, locale) + eligible.map((e) => eligibleBlock(e, locale, t)).join("") : ""}
    ${almost.length ? sectionHeader(ar ? "بخطوة واحدة" : "One step away", t.almostEligible, C.almost, almost.length, locale) + almost.map((e) => almostBlock(e, profile, locale, t)).join("") : ""}
    ${footer}
    <div style="margin-top:14px">${saduBand()}</div>`;

  return { html, dir, width: 794 };
}

/* --------------------------------------------------------------------------
 * Export
 * ------------------------------------------------------------------------ */

export async function exportPlanPdf(opts: {
  profile: Profile;
  evaluated: EvaluatedProgram[];
  steps: RoadmapStep[];
  stats: ProgressStats;
  locale: Locale;
}): Promise<void> {
  const { locale } = opts;
  const { html, dir, width } = buildPlanHtml(opts);

  // Heavy renderer deps load lazily → the builder above stays import-safe in Node.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  const el = document.createElement("div");
  el.setAttribute("dir", dir);
  el.style.cssText = `position:fixed;top:0;left:-99999px;width:${width}px;background:${C.paper};color:${C.ink};padding:36px;font-family:${BODY};line-height:1.55;`;
  el.innerHTML = html;

  document.body.appendChild(el);
  try {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: C.paper });
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(`hissati-plan-${locale}.pdf`);
  } finally {
    document.body.removeChild(el);
  }
}
