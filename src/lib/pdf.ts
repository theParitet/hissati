/**
 * Hissati — Arabic-capable plan PDF (FR-F2). html2canvas rasterises a dedicated,
 * inline-styled element (so Arabic shaping is preserved and no Tailwind/oklch CSS
 * trips the renderer), then jsPDF paginates it onto A4. One-tap download.
 */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { formatAmountRange, localizeDate } from "@/lib/format";
import { estimateTimeToEligibility } from "@/lib/scoring";
import type { ProgressStats } from "@/lib/metrics";
import type { EvaluatedProgram, Profile } from "@/lib/schema";
import type { RoadmapStep } from "@/lib/roadmap";

/** Minimal grouped AED for the PDF header (L5 swaps in the shared formatAED). */
function pdfAed(aed: number, locale: Locale): string {
  return toLocaleDigits(aed.toLocaleString("en-US"), locale);
}

const C = {
  ink: "#21180f",
  soft: "#5c5043",
  faint: "#8a7d6c",
  oasis: "#14584a",
  amber: "#b9711a",
  palm: "#1f7a52",
  line: "#e3d8c4",
  sand: "#f6f1e7",
};

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

function docsList(ev: EvaluatedProgram, locale: Locale): string {
  return ev.program.required_documents
    .map(
      (d) =>
        `<li style="margin:2px 0;color:${C.soft}">${esc(locale === "ar" ? d.ar : d.en)}${
          d.format ? ` <span style="color:${C.faint}">· ${esc(d.format)}</span>` : ""
        }</li>`
    )
    .join("");
}

function programBlock(ev: EvaluatedProgram, profile: Profile, locale: Locale, t: Record<string, string>): string {
  const eta = estimateTimeToEligibility(profile, ev.program, ev.rules);
  const almost = ev.status === "almost";
  const remedies = ev.rules
    .filter((r) => !r.passed && r.remediable && r.remedy)
    .map(
      (r) =>
        `<li style="margin:3px 0;color:${C.soft}">${esc(pick(r.blocking_message, locale))}<br/><span style="color:${C.oasis}">→ ${esc(
          pick(r.remedy!.action, locale)
        )}${r.remedy!.est_time ? ` · ${esc(r.remedy!.est_time)}` : ""}</span></li>`
    )
    .join("");
  return `
  <div style="break-inside:avoid;border:1px solid ${C.line};border-radius:12px;padding:14px 16px;margin:10px 0;background:#fff">
    <div style="display:flex;justify-content:space-between;gap:10px">
      <div>
        <div style="font-weight:700;color:${C.ink};font-size:15px">${esc(pick(ev.program.name, locale))}</div>
        <div style="color:${C.faint};font-size:12px;margin-top:2px">${esc(ev.program.operator)}</div>
      </div>
      <div style="text-align:end;color:${C.oasis};font-weight:700;white-space:nowrap">${esc(formatAmountRange(ev.program.amount, locale))}</div>
    </div>
    ${
      almost
        ? `<div style="margin-top:8px"><div style="font-weight:600;color:${C.amber};font-size:13px">${t.youCouldQualify} <span style="color:${C.faint};font-weight:400">· ${eta}</span></div><ul style="margin:4px 0 0;padding-inline-start:16px;font-size:12px">${remedies}</ul></div>`
        : ""
    }
    <div style="margin-top:8px;font-size:12px"><div style="font-weight:600;color:${C.ink}">${t.requiredDocs}</div><ul style="margin:4px 0 0;padding-inline-start:16px">${docsList(ev, locale)}</ul></div>
    <div style="margin-top:8px;font-size:11px;color:${C.faint}">${t.source} · ${t.verified} ${localizeDate(ev.program.source.verified_date, locale)} · ${esc(ev.program.application_url)}</div>
  </div>`;
}

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
  const eligible = evaluated.filter((e) => e.status === "eligible");
  const almost = evaluated.filter((e) => e.status === "almost");

  const stepsHtml = steps
    .map(
      (s, i) =>
        `<li style="margin:5px 0;color:${C.soft}"><b style="color:${C.ink}">${toLocaleDigits(i + 1, locale)}.</b> ${esc(
          pick(s.action, locale)
        )}${s.est_time ? ` <span style="color:${C.faint}">· ${esc(s.est_time)}</span>` : ""}</li>`
    )
    .join("");

  const sectionTitle = (txt: string, color: string) =>
    `<h2 style="font-size:16px;color:${color};margin:18px 0 6px;border-bottom:2px solid ${C.line};padding-bottom:4px">${txt}</h2>`;

  const el = document.createElement("div");
  el.setAttribute("dir", dir);
  el.style.cssText = `position:fixed;top:0;left:-99999px;width:794px;background:#fff;color:${C.ink};padding:36px;font-family:var(--font-tajawal),'Tajawal',sans-serif;line-height:1.55;`;
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid ${C.oasis};padding-bottom:12px">
      <div>
        <div style="font-size:28px;font-weight:800;color:${C.oasis}">${t.appName}</div>
        <div style="color:${C.soft};font-size:13px">${t.tagline} · ${t.builtFor}</div>
      </div>
      <div style="text-align:end">
        <div style="font-size:34px;font-weight:800;color:${C.oasis};line-height:1">${locale === "ar" ? "" : "AED "}${toLocaleDigits(stats.aedReachableNow, locale)}${stats.hasOpenEndedAmounts ? "+" : ""}</div>
        <div style="font-size:12px;color:${C.soft}">${locale === "ar" ? "ضمن متناولك الآن" : "Within reach now"} · ${toLocaleDigits(stats.programsEligible, locale)}/${toLocaleDigits(stats.programsTotal, locale)} ${locale === "ar" ? "برنامج" : "programs"}</div>
      </div>
    </div>

    ${eligible.length ? sectionTitle(t.eligibleNow, C.palm) + eligible.map((e) => programBlock(e, profile, locale, t)).join("") : ""}
    ${almost.length ? sectionTitle(t.almostEligible, C.amber) + almost.map((e) => programBlock(e, profile, locale, t)).join("") : ""}
    ${steps.length ? sectionTitle(t.roadmapTitle, C.oasis) + `<ul style="margin:4px 0;padding-inline-start:18px;font-size:13px">${stepsHtml}</ul>` : ""}

    <div style="margin-top:22px;border-top:1px solid ${C.line};padding-top:8px;font-size:11px;color:${C.faint}">
      ${t.cited} · ${t.appName} · ${localizeDate(new Date().toISOString().slice(0, 10), locale)}
    </div>`;

  document.body.appendChild(el);
  try {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
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
