"use client";

/**
 * PlanDocument — the print-only **Funding Readiness Plan**.
 *
 * Native browser print (window.print() → "Save as PDF") renders THIS element,
 * composed from the real app components + @theme tokens, so the exported PDF is a
 * faithful copy of the dashboard's visual language — correct Arabic shaping, RTL,
 * and spacing — with crisp, selectable vector text. It replaces the old
 * html2canvas/jsPDF rasteriser (and its duplicated hex palette + survival hacks).
 *
 * It is hidden on screen (`hidden print:block`) while the interactive dashboard is
 * `print:hidden`, so a single window.print() prints the same plan from any tab.
 * Page setup (A4, forced colours, break-inside) lives in globals.css @media print.
 *
 * Content mirrors the take-to-the-bank worksheet: cover + cited "within reach"
 * hero · the founder snapshot · ONE prioritised action checklist · a scannable
 * "apply now" block per eligible program · the "one step away" programs with the
 * blocking rule → cited remedy · a cited-evidence footer.
 */
import * as React from "react";
import { Clock } from "lucide-react";
import {
  Card,
  Stat,
  Money,
  AmountDirectionBadge,
  VerifiedStamp,
  EmptyState,
} from "@/components/ui";
import { Logo } from "@/components/Logo";
import { InstrumentGlyph } from "@/components/dashboard/InstrumentGlyph";
import { cn } from "@/lib/cn";
import { ui, pick, toLocaleDigits, enumLabel, type Locale } from "@/lib/i18n";
import { formatAmountRange, isCostInstrument, localizeDate } from "@/lib/format";
import { estimateTimeToEligibility } from "@/lib/scoring";
import { programsUnlockedBy } from "@/lib/programs";
import { isCurrentlyAvailable, type ProgressStats } from "@/lib/metrics";
import type { EvaluatedProgram, Profile } from "@/lib/schema";
import type { RoadmapStep } from "@/lib/roadmap";

/** A printed URL: drop the protocol/trailing slash so it reads cleanly. */
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/* -------------------------------------------------------------------------- */

/** A small label: value chip for the founder snapshot. */
function SnapshotChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center rounded-pill border border-sand-line bg-sand-100 px-2.5 py-1 text-[11px] leading-none text-ink">
      <span className="text-ink-faint">{label}:&nbsp;</span>
      {value}
    </span>
  );
}

/** A pen-tickable paper checkbox. */
function TickBox({ tone }: { tone: "oasis" | "amber" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-[3px] border-2 bg-sand-100",
        tone === "oasis" ? "border-oasis" : "border-amber"
      )}
    />
  );
}

/** A right-aligned mono data pill (time / cost / format). Always LTR. */
function MetaPill({ tone = "oasis", children }: { tone?: "oasis" | "faint"; children: React.ReactNode }) {
  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-pill border border-sand-line bg-sand-100 px-2 py-1 font-mono text-[10px] leading-none",
        tone === "oasis" ? "text-oasis" : "text-ink-faint"
      )}
    >
      {children}
    </span>
  );
}

const SECTION_TEXT = { ink: "text-ink", palm: "text-palm", almost: "text-almost" } as const;
const SECTION_BG = { ink: "bg-ink", palm: "bg-palm", almost: "bg-almost" } as const;

/** Section header: eyebrow · title · count badge · hairline rule. */
function Section({
  eyebrow,
  title,
  tone,
  count,
  locale,
  children,
}: {
  eyebrow: string;
  title: string;
  tone: "ink" | "palm" | "almost";
  count?: number;
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 break-inside-avoid">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">{eyebrow}</p>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <h2 className={cn("font-display text-lg font-extrabold leading-tight", SECTION_TEXT[tone])}>{title}</h2>
        {count != null && (
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold text-sand-100",
              SECTION_BG[tone]
            )}
          >
            {toLocaleDigits(count, locale)}
          </span>
        )}
      </div>
      <div className={cn("mt-1.5 h-0.5 opacity-20", SECTION_BG[tone])} />
      <div className="mt-2.5 space-y-2">{children}</div>
    </section>
  );
}

/** A small sub-heading inside the checklist (a coloured dot + label). */
function SubLabel({ tone, children }: { tone: "oasis" | "amber"; children: React.ReactNode }) {
  return (
    <p className={cn("flex items-center gap-2 text-[11px] font-semibold", tone === "oasis" ? "text-oasis" : "text-amber-600")}>
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", tone === "oasis" ? "bg-oasis" : "bg-amber")} aria-hidden />
      {children}
    </p>
  );
}

/** A label: value row inside an apply card. */
function ApplyRow({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <p className="text-[11.5px] text-ink-soft">
      <span className="text-ink-faint">{label}: </span>
      {ltr ? (
        <span dir="ltr" className="break-all font-mono text-[10.5px] text-oasis">
          {value}
        </span>
      ) : (
        value
      )}
    </p>
  );
}

/** Shared header for a program block: glyph + name + operator + cited amount. */
function ProgramHead({ ev, locale, tone }: { ev: EvaluatedProgram; locale: Locale; tone: "palm" | "almost" }) {
  const { program, status } = ev;
  const cost = isCostInstrument(program.instrument);
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="inline-flex items-start gap-1.5 font-semibold leading-snug text-ink">
          <InstrumentGlyph instrument={program.instrument} status={status} className="mt-0.5" />
          {pick(program.name, locale)}
        </h3>
        <p className="mt-0.5 text-[11px] text-ink-faint">{program.operator}</p>
      </div>
      <div className="shrink-0 text-end">
        <AmountDirectionBadge direction={cost ? "pay" : "receive"} locale={locale} />
        <p
          dir="ltr"
          className={cn("mt-1 font-mono text-sm font-bold leading-none", cost ? "text-clay" : tone === "palm" ? "text-palm" : "text-almost")}
        >
          {formatAmountRange(program.amount, locale)}
        </p>
      </div>
    </div>
  );
}

/** "What this payment unlocks" context for cost (license/support) instruments. */
function PaidContext({ ev, locale }: { ev: EvaluatedProgram; locale: Locale }) {
  if (!isCostInstrument(ev.program.instrument)) return null;
  const ar = locale === "ar";
  const unlocked = programsUnlockedBy(ev.program.id);
  return (
    <div className="mt-2 rounded-lg border border-clay-100 bg-clay-100/40 p-2.5">
      <p className="text-[10.5px] font-semibold text-clay">{ar ? "ما الذي تفتحه هذه الرسوم" : "What this payment unlocks"}</p>
      <p className="mt-1 text-[10.5px] leading-snug text-ink-soft">{pick(ev.program.description, locale)}</p>
      {unlocked.length > 0 && (
        <p className="mt-1 text-[10.5px] text-clay">
          <strong>{ar ? "خطوة مطلوبة للوصول إلى" : "Required step toward"}:</strong>{" "}
          {unlocked.map((p) => pick(p.name, locale)).join(ar ? "، " : ", ")}.
        </p>
      )}
    </div>
  );
}

/** Eligible: a scannable "how to apply" card with a palm start-edge. */
function EligibleCard({ ev, locale }: { ev: EvaluatedProgram; locale: Locale }) {
  const t = ui(locale);
  const ar = locale === "ar";
  const { program } = ev;
  return (
    <div className="flex break-inside-avoid items-stretch overflow-hidden rounded-xl border border-sand-line bg-sand-100">
      <div className="w-1.5 shrink-0 bg-palm" aria-hidden />
      <div className="min-w-0 flex-1 p-3.5">
        <ProgramHead ev={ev} locale={locale} tone="palm" />
        <PaidContext ev={ev} locale={locale} />
        <div className="mt-2.5 space-y-1 border-t border-sand-line pt-2.5">
          <ApplyRow label={t.introMethod} value={t[`intro_${program.intro_method}`] ?? program.intro_method} />
          {program.processing_time && <ApplyRow label={t.processingTime} value={program.processing_time} />}
          <ApplyRow label={ar ? "الرابط" : "Apply"} value={prettyUrl(program.application_url)} ltr />
        </div>
        <div className="mt-2.5">
          <VerifiedStamp
            sourceUrl={program.source.url}
            verifiedDate={program.source.verified_date}
            sourceDate={program.source.source_date}
            confidence={program.source.confidence}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

/** Almost: the blocking rule → cited remedy, amber start-edge. */
function AlmostCard({ ev, profile, locale }: { ev: EvaluatedProgram; profile: Profile; locale: Locale }) {
  const t = ui(locale);
  const { program } = ev;
  const eta = estimateTimeToEligibility(profile, program, ev.rules);
  const remedies = ev.rules.filter((r) => !r.passed && r.remediable && r.remedy);
  return (
    <div className="flex break-inside-avoid items-stretch overflow-hidden rounded-xl border border-sand-line bg-almost-100/40">
      <div className="w-1.5 shrink-0 bg-almost" aria-hidden />
      <div className="min-w-0 flex-1 p-3.5">
        <ProgramHead ev={ev} locale={locale} tone="almost" />
        <PaidContext ev={ev} locale={locale} />
        <div className="mt-2.5 border-t border-dashed border-almost pt-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-almost">
            {t.youCouldQualify}
            <span className="ms-auto inline-flex items-center gap-1 font-normal text-ink-faint">
              <Clock className="h-3 w-3" aria-hidden />
              <span dir="ltr">{eta}</span>
            </span>
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {remedies.map((r, i) => (
              <li key={i} className="text-[11.5px] leading-snug">
                <span className="text-ink">
                  <span className="text-almost">● </span>
                  {pick(r.blocking_message, locale)}
                </span>
                <span className="mt-0.5 block text-oasis">
                  → {pick(r.remedy!.action, locale)}
                  {r.remedy!.est_time ? <span className="text-ink-faint"> · {r.remedy!.est_time}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-2.5">
          <VerifiedStamp
            sourceUrl={program.source.url}
            verifiedDate={program.source.verified_date}
            sourceDate={program.source.source_date}
            confidence={program.source.confidence}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function PlanDocument({
  profile,
  evaluated,
  steps,
  stats,
  locale,
  className,
}: {
  profile: Profile;
  evaluated: EvaluatedProgram[];
  steps: RoadmapStep[];
  stats: ProgressStats;
  locale: Locale;
  className?: string;
}) {
  const t = ui(locale);
  const ar = locale === "ar";
  const open = stats.hasOpenEndedAmounts;
  const plus = open ? "+" : "";
  const today = localizeDate(new Date().toISOString().slice(0, 10), locale);

  const eligible = evaluated.filter((e) => e.status === "eligible" && isCurrentlyAvailable(e.program));
  const almost = evaluated.filter((e) => e.status === "almost" && isCurrentlyAvailable(e.program));
  const gatherFrom = [...eligible, ...almost];

  // Every required document across the matched programs, deduped (one to-gather list).
  const docMap = new Map<string, { text: string; format?: string }>();
  for (const ev of gatherFrom) {
    for (const d of ev.program.required_documents) {
      const key = d.en.toLowerCase().trim();
      if (!docMap.has(key)) docMap.set(key, { text: ar ? d.ar : d.en, format: d.format });
    }
  }
  const docs = [...docMap.values()];

  const delta = stats.aedReachableAfterSteps - stats.aedReachableNow;
  const isEmpty = !eligible.length && !almost.length && !steps.length;

  const snapshot: [string, string][] = [
    [ar ? "القطاع" : "Sector", enumLabel("sector", profile.sector, locale)],
    [ar ? "المرحلة" : "Stage", enumLabel("stage", profile.stage, locale)],
    [ar ? "الموقع" : "Location", enumLabel("location", profile.location, locale)],
    [ar ? "الملكية" : "Ownership", enumLabel("nationality_ownership", profile.nationality_ownership, locale)],
    [ar ? "التسجيل" : "Registration", enumLabel("registration", profile.registration, locale)],
    [ar ? "نوع التمويل" : "Funding", enumLabel("funding_type", profile.funding_type, locale)],
  ];

  return (
    <div dir={ar ? "rtl" : "ltr"} className={cn("plan-print hidden p-[12mm] text-ink print:block", className)}>
      <div className="sadu-band" aria-hidden />

      {/* Masthead */}
      <header className="mt-4 flex items-start justify-between gap-4">
        <Logo variant="lockup" />
        <div className="text-end">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">{ar ? "وثيقة" : "Document"}</p>
          <p className="mt-0.5 font-display text-base font-bold leading-tight text-ink">
            {ar ? "خطة الجاهزية للتمويل" : "Funding Readiness Plan"}
          </p>
        </div>
      </header>

      {/* Cover hero — the cited "within reach" ledger (the dashboard's funding-sky
          signature is a screen-only flourish, omitted from the printed worksheet). */}
      <Card data-top-stripe className="mt-4 overflow-hidden p-0 break-inside-avoid">
        <div className="sadu-band" aria-hidden />
        <div className="grid grid-cols-3 gap-4 p-5">
          <Stat
            tone="amber"
            label={t.withinReach}
            value={
              <span className="inline-flex items-baseline">
                <Money aed={stats.aedReachableNow} locale={locale} />
                {plus}
              </span>
            }
            sub={open ? `${t.withinReachHint} · ${t.amountVaries}` : t.withinReachHint}
          />
          <Stat
            tone="oasis"
            label={t.programsEligibleLabel}
            value={
              <span className="font-mono tabular-nums" dir="ltr">
                {toLocaleDigits(stats.programsEligible, locale)} / {toLocaleDigits(stats.programsTotal, locale)}
              </span>
            }
            sub={
              delta > 0 ? (
                <span className="inline-flex items-center gap-1">
                  {ar ? "بالخطوات حتى" : "With steps up to"} <Money aed={stats.aedReachableAfterSteps} locale={locale} />
                  {plus}
                </span>
              ) : (
                t.potentialReach
              )
            }
          />
          <Stat
            tone="ink"
            label={t.stepsLabel}
            value={
              <span className="font-mono tabular-nums" dir="ltr">
                {toLocaleDigits(stats.stepsDone, locale)} / {toLocaleDigits(stats.stepsTotal, locale)}
              </span>
            }
            sub={
              steps.length > 0
                ? ar
                  ? `${toLocaleDigits(steps.length, locale)} خطوة تفتح المزيد`
                  : `${steps.length} ${steps.length === 1 ? "step unlocks more" : "steps unlock more"}`
                : ar
                  ? "لا خطوات متبقية"
                  : "no steps left"
            }
          />
        </div>
      </Card>

      {/* Founder snapshot */}
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          {ar ? "أُعدّت لـ" : "Prepared for"} · {today}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {snapshot.map(([label, value]) => (
            <SnapshotChip key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      {isEmpty && (
        <EmptyState
          className="mt-6"
          title={ar ? "أكمل الأسئلة لبناء خطتك." : "Answer the questionnaire to build your plan."}
        />
      )}

      {/* Action checklist — ONE prioritised, pen-tickable worksheet. */}
      {(steps.length > 0 || docs.length > 0) && (
        <Section
          eyebrow={ar ? "قائمة المهام" : "Action checklist"}
          title={ar ? "خطواتك القادمة" : "Your next moves"}
          tone="ink"
          count={steps.length || undefined}
          locale={locale}
        >
          <p className="text-[11px] text-ink-faint">
            {ar
              ? "علّم كل بند بالقلم وأنت تنجزه. احمل هذه الصفحة إلى المصرف أو مركز تم."
              : "Tick each item with a pen as you go. Take this page to the bank or a TAMM centre."}
          </p>

          {steps.length > 0 && (
            <>
              <SubLabel tone="oasis">{ar ? "خطوات تفتح لك التمويل" : "Steps that unlock funding"}</SubLabel>
              <ol className="space-y-1.5">
                {steps.map((s, i) => {
                  const hasCost = typeof s.est_cost_aed === "number" && s.est_cost_aed > 0;
                  return (
                    <li key={s.key} className="flex break-inside-avoid items-start justify-between gap-3">
                      <span className="flex min-w-0 items-start gap-2.5">
                        <TickBox tone="oasis" />
                        <span className="text-[12.5px] leading-snug text-ink-soft">
                          <span dir="ltr" className="font-mono font-bold text-oasis">
                            {toLocaleDigits(i + 1, locale)}.
                          </span>{" "}
                          {pick(s.action, locale)}
                        </span>
                      </span>
                      {(s.est_time || hasCost) && (
                        <MetaPill tone="oasis">
                          {s.est_time ? <span>≈ {s.est_time}</span> : null}
                          {s.est_time && hasCost ? <span>·</span> : null}
                          {hasCost ? <Money aed={s.est_cost_aed!} locale={locale} /> : null}
                        </MetaPill>
                      )}
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          {docs.length > 0 && (
            <>
              <SubLabel tone="amber">{ar ? "مستندات تجهّزها" : "Documents to gather"}</SubLabel>
              <ul className="space-y-1">
                {docs.map((d, i) => (
                  <li key={i} className="flex break-inside-avoid items-start justify-between gap-3">
                    <span className="flex min-w-0 items-start gap-2.5">
                      <TickBox tone="amber" />
                      <span className="text-[12px] leading-snug text-ink-soft">{d.text}</span>
                    </span>
                    {d.format && <MetaPill tone="faint">{d.format}</MetaPill>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>
      )}

      {/* Apply now — eligible programs */}
      {eligible.length > 0 && (
        <Section eyebrow={ar ? "قدّم الآن" : "Apply now"} title={t.eligibleNow} tone="palm" count={eligible.length} locale={locale}>
          {eligible.map((ev) => (
            <EligibleCard key={ev.program.id} ev={ev} locale={locale} />
          ))}
        </Section>
      )}

      {/* One step away — almost programs */}
      {almost.length > 0 && (
        <Section
          eyebrow={ar ? "بخطوة واحدة" : "One step away"}
          title={t.almostEligible}
          tone="almost"
          count={almost.length}
          locale={locale}
        >
          {almost.map((ev) => (
            <AlmostCard key={ev.program.id} ev={ev} profile={profile} locale={locale} />
          ))}
        </Section>
      )}

      {/* Footer */}
      <footer className="mt-6 break-inside-avoid border-t border-sand-line pt-3">
        <p className="text-[11.5px] font-semibold text-ink-soft">{t.cited}</p>
        <p className="mt-1 text-[10px] text-ink-faint">
          {t.appName} · {t.tagline} · {today}
        </p>
      </footer>

      <div className="mt-4 sadu-band" aria-hidden />
    </div>
  );
}
