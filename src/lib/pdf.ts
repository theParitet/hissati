/**
 * Hissati — the **Funding Readiness Plan** PDF (FR-F2): a real bilingual document a
 * founder can carry to a bank or a TAMM service centre. html2canvas rasterises a
 * dedicated, inline-styled element (so Arabic shaping is preserved and no
 * Tailwind/oklch CSS trips the renderer) and jsPDF paginates it onto A4.
 *
 * html2canvas survival rules followed here: hex colours only (never oklch/var
 * colour tokens); spacing via margins, not flex `gap`; the Al Sadu seal/band and
 * the QR are plain inline SVG (shapes only — no <pattern>/gradients) so they
 * serialise cleanly; every user/program string is escaped. Saves as
 * hissati-plan-{locale}.pdf.
 */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ui, pick, toLocaleDigits, enumLabel, type Locale } from "@/lib/i18n";
import { formatAmountRange, localizeDate } from "@/lib/format";
import { estimateTimeToEligibility } from "@/lib/scoring";
import { appUrl, qrSvgPath } from "@/lib/share";
import type { ProgressStats } from "@/lib/metrics";
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
  gold: "#b9711a",
  palm: "#1f7a52",
  palmBg: "#e7f1ea",
  almost: "#c47d12",
  almostBg: "#f7edd6",
  clay: "#9c4a2f",
  clayBg: "#f1e1da",
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
function seal(size = 56): string {
  const r = size / 2;
  const teethN = 28;
  let teeth = "";
  for (let i = 0; i < teethN; i++) {
    const a = (i / teethN) * Math.PI * 2;
    const x1 = r + Math.cos(a) * (r - 1.5);
    const y1 = r + Math.sin(a) * (r - 1.5);
    const x2 = r + Math.cos(a) * (r - 5.5);
    const y2 = r + Math.sin(a) * (r - 5.5);
    teeth += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${i % 2 ? C.gold : C.oasis}" stroke-width="1.6"/>`;
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
    <circle cx="${r}" cy="${r}" r="${r - 0.8}" fill="${C.white}" stroke="${C.oasis}" stroke-width="1.2"/>
    ${teeth}
    <circle cx="${r}" cy="${r}" r="${r - 7}" fill="${C.paper}"/>
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
 * Document fragments
 * ------------------------------------------------------------------------ */

/** "verified · source · date" — the evidence thesis as a stamp (always LTR + mono). */
function verifiedStamp(ev: EvaluatedProgram, locale: Locale, t: Record<string, string>): string {
  return `<span dir="ltr" style="display:inline-block;border:1px solid ${C.clay};background:${C.clayBg};border-radius:6px;padding:2px 7px;font-family:${MONO};font-size:9.5px;color:${C.clay};line-height:1.3">✓ ${esc(
    t.verified
  )} · ${esc(host(ev.program.source.url))} · ${localizeDate(ev.program.source.verified_date, locale)}</span>`;
}

function chip(label: string, value: string): string {
  return `<span style="display:inline-block;margin:0 4px 6px 4px;padding:3px 10px;border:1px solid ${C.line};border-radius:999px;background:${C.white};font-size:11px;color:${C.ink}"><span style="color:${C.faint}">${esc(
    label
  )}: </span>${esc(value)}</span>`;
}

function founderSnapshot(profile: Profile, locale: Locale): string {
  const chips = [
    chip(locale === "ar" ? "القطاع" : "Sector", enumLabel("sector", profile.sector, locale)),
    chip(locale === "ar" ? "المرحلة" : "Stage", enumLabel("stage", profile.stage, locale)),
    chip(locale === "ar" ? "الموقع" : "Location", enumLabel("location", profile.location, locale)),
    chip(locale === "ar" ? "الملكية" : "Ownership", enumLabel("nationality_ownership", profile.nationality_ownership, locale)),
    chip(locale === "ar" ? "التسجيل" : "Registration", enumLabel("registration", profile.registration, locale)),
    chip(locale === "ar" ? "نوع التمويل" : "Funding", enumLabel("funding_type", profile.funding_type, locale)),
  ].join("");
  return `<div style="margin-top:14px"><div style="font-size:9.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${C.faint};margin:0 4px 6px 4px">${
    locale === "ar" ? "ملف المؤسّس" : "Founder snapshot"
  }</div>${chips}</div>`;
}

function programCard(ev: EvaluatedProgram, profile: Profile, locale: Locale, t: Record<string, string>): string {
  const almost = ev.status === "almost";
  const toneColor = almost ? C.almost : C.palm;
  const introLabel = t[`intro_${ev.program.intro_method}`] ?? ev.program.intro_method;

  let remedyBlock = "";
  if (almost) {
    const eta = estimateTimeToEligibility(profile, ev.program, ev.rules);
    const remedies = ev.rules
      .filter((r) => !r.passed && r.remediable && r.remedy)
      .map(
        (r) =>
          `<div style="margin-top:5px;font-size:11.5px;color:${C.soft}"><span style="color:${C.almost}">●</span> ${esc(
            pick(r.blocking_message, locale)
          )}<div style="color:${C.oasis};margin-top:1px">→ ${esc(pick(r.remedy!.action, locale))}${
            r.remedy!.est_time ? ` · ${esc(r.remedy!.est_time)}` : ""
          }</div></div>`
      )
      .join("");
    remedyBlock = `<div style="margin-top:9px;border-top:1px dashed ${C.line};padding-top:8px"><div style="font-weight:700;color:${C.almost};font-size:12px">${esc(
      t.youCouldQualify
    )} <span style="color:${C.faint};font-weight:400">· ${esc(eta)}</span></div>${remedies}</div>`;
  }

  return `<div style="border:1px solid ${C.line};border-radius:12px;padding:13px 15px;margin:9px 0;background:${C.white};break-inside:avoid">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div style="max-width:430px">
        <div style="font-weight:700;color:${C.ink};font-size:14.5px;line-height:1.25">${esc(pick(ev.program.name, locale))}</div>
        <div style="color:${C.faint};font-size:11.5px;margin-top:2px">${esc(ev.program.operator)} · ${esc(introLabel)}</div>
      </div>
      <div dir="ltr" style="font-family:${MONO};font-weight:700;color:${toneColor};font-size:13.5px;white-space:nowrap">${esc(
        formatAmountRange(ev.program.amount, locale)
      )}</div>
    </div>
    ${remedyBlock}
    <div style="margin-top:9px">${verifiedStamp(ev, locale, t)}</div>
  </div>`;
}

/** The consolidated take-to-the-bank checklist — every required doc, deduped. */
function documentsToGather(programs: EvaluatedProgram[], locale: Locale): string {
  const map = new Map<string, { text: string; format?: string }>();
  for (const ev of programs) {
    for (const d of ev.program.required_documents) {
      const key = d.en.toLowerCase().trim();
      if (!map.has(key)) map.set(key, { text: locale === "ar" ? d.ar : d.en, format: d.format });
    }
  }
  if (!map.size) return "";
  const items = [...map.values()]
    .map(
      (it) =>
        `<li style="margin:5px 0;list-style:none;color:${C.soft};font-size:12.5px"><span style="display:inline-block;width:11px;height:11px;border:1.5px solid ${C.oasis};border-radius:3px;margin:0 7px;vertical-align:-1px"></span>${esc(
          it.text
        )}${it.format ? ` <span style="color:${C.faint}">· ${esc(it.format)}</span>` : ""}</li>`
    )
    .join("");
  return `<ul style="margin:6px 0 0;padding:0">${items}</ul>`;
}

function roadmapList(steps: RoadmapStep[], locale: Locale): string {
  return steps
    .map(
      (s, i) =>
        `<div style="display:flex;align-items:flex-start;margin:7px 0"><span style="flex:0 0 auto;width:20px;height:20px;border-radius:999px;background:${C.oasis};color:${C.white};font-family:${MONO};font-size:11px;font-weight:700;text-align:center;line-height:20px">${toLocaleDigits(
          i + 1,
          locale
        )}</span><span style="margin:0 9px;color:${C.soft};font-size:12.5px;line-height:1.45;padding-top:1px">${esc(
          pick(s.action, locale)
        )}${s.est_time ? ` <span style="color:${C.faint}">· ${esc(s.est_time)}</span>` : ""}</span></div>`
    )
    .join("");
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
  const { profile, evaluated, steps, stats, locale } = opts;
  const t = ui(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const ar = locale === "ar";
  const eligible = evaluated.filter((e) => e.status === "eligible");
  const almost = evaluated.filter((e) => e.status === "almost");
  const gatherFrom = [...eligible, ...almost];
  const url = appUrl();
  const today = localizeDate(new Date().toISOString().slice(0, 10), locale);

  const sectionTitle = (txt: string, color: string, count?: number) =>
    `<div style="margin:20px 0 6px"><span style="font-family:${DISPLAY};font-size:15px;font-weight:800;color:${color}">${esc(
      txt
    )}</span>${
      count != null ? `<span style="font-family:${MONO};font-size:12px;color:${C.faint}"> · ${toLocaleDigits(count, locale)}</span>` : ""
    }<div style="height:2px;background:${color};opacity:0.2;margin-top:5px"></div></div>`;

  const header = `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:14px">
    <div style="display:flex;align-items:center">
      ${seal(56)}
      <div style="margin:0 12px">
        <div style="font-family:${DISPLAY};font-size:24px;font-weight:800;color:${C.oasis};line-height:1.05">${esc(t.appName)}</div>
        <div style="font-size:13px;color:${C.ink};font-weight:700;margin-top:2px">${ar ? "خطة الجاهزية للتمويل" : "Funding Readiness Plan"}</div>
        <div style="font-size:11px;color:${C.faint};margin-top:1px">${esc(t.tagline)} · ${esc(t.builtFor)}</div>
      </div>
    </div>
    <div style="text-align:end">
      <div style="font-size:9.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.faint}">${
        ar ? "ضمن متناولك الآن" : "Within reach now"
      }</div>
      <div dir="ltr" style="font-family:${MONO};font-size:25px;font-weight:700;color:${C.oasis};line-height:1.1;margin-top:3px">${money(
        stats.aedReachableNow,
        locale,
        stats.hasOpenEndedAmounts
      )}</div>
      <div style="font-size:11px;color:${C.soft};margin-top:3px">${toLocaleDigits(stats.programsEligible, locale)} ${
        ar ? "من" : "of"
      } ${toLocaleDigits(stats.programsTotal, locale)} ${ar ? "برنامج مؤهَّل" : "programs eligible"}</div>
      <div style="font-size:10px;color:${C.faint};margin-top:3px">${today}</div>
    </div>
  </div>`;

  const empty =
    !eligible.length && !almost.length && !steps.length
      ? `<div style="margin-top:24px;border:1px dashed ${C.line};border-radius:12px;padding:24px;text-align:center;color:${C.soft};font-size:13px">${
          ar ? "أكمل الأسئلة لبناء خطتك." : "Answer the questionnaire to build your plan."
        }</div>`
      : "";

  const el = document.createElement("div");
  el.setAttribute("dir", dir);
  el.style.cssText = `position:fixed;top:0;left:-99999px;width:794px;background:${C.paper};color:${C.ink};padding:36px;font-family:${BODY};line-height:1.55;`;
  el.innerHTML = `
    ${saduBand()}
    ${header}
    ${founderSnapshot(profile, locale)}
    ${empty}
    ${eligible.length ? sectionTitle(t.eligibleNow, C.palm) + eligible.map((e) => programCard(e, profile, locale, t)).join("") : ""}
    ${almost.length ? sectionTitle(t.almostEligible, C.almost) + almost.map((e) => programCard(e, profile, locale, t)).join("") : ""}
    ${gatherFrom.length ? sectionTitle(ar ? "المستندات المطلوب تجهيزها" : "Documents to gather", C.oasis) + `<div style="font-size:11px;color:${C.faint};margin:0 4px 2px 4px">${ar ? "احملها معك إلى المصرف أو مركز تم." : "Take these to the bank or a TAMM centre."}</div>` + documentsToGather(gatherFrom, locale) : ""}
    ${steps.length ? sectionTitle(t.roadmapTitle, C.oasis, steps.length) + roadmapList(steps, locale) : ""}

    <div style="margin-top:24px;border-top:1px solid ${C.line};padding-top:12px;display:flex;justify-content:space-between;align-items:center">
      <div style="max-width:430px">
        <div style="font-size:11px;color:${C.soft};font-weight:600">${esc(t.cited)}</div>
        <div style="font-size:10px;color:${C.faint};margin-top:3px">${esc(t.appName)} · ${esc(t.tagline)} · ${today}</div>
      </div>
      <div style="text-align:center">
        ${qrSvg(url, 76)}
        <div style="font-size:9px;color:${C.faint};margin-top:3px">${ar ? "امسح لفتح حِصّتي" : "Scan to open Hissati"}</div>
      </div>
    </div>
    <div style="margin-top:12px">${saduBand()}</div>`;

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
