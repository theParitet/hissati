"use client";

/**
 * Embedded, TOUCHABLE product — not a screenshot. It reuses the real engine + the
 * shared primitives, but keeps everything in LOCAL component state so clicking here
 * never touches the global store or the visitor's real plan.
 *
 * Two live interactions, both tied to the same beat the dashboard owns:
 *  · tick the Khalifa Fund documents → the checklist bar fills, "ready to apply" lights;
 *  · flip "Launched my MVP" → Khalifa flips almost→eligible and "within reach" jumps
 *    to the cited AED 2,000,000, live.
 */
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Rocket,
  ListChecks,
  CornerDownRight,
} from "lucide-react";
import { Card, Button, StatusPill, Money, VerifiedStamp } from "@/components/ui";
import { evalFor, DEMO_PROFILES, statsFor, KHALIFA_ID } from "@/components/landing/demo";
import { ui, pick, toLocaleDigits, enumLabel, type Locale } from "@/lib/i18n";
import { formatAmountRange } from "@/lib/format";

export function LivePreview({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const ar = locale === "ar";

  const [mvpDone, setMvpDone] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);

  const profile = mvpDone ? DEMO_PROFILES.MVP : DEMO_PROFILES.REGISTERED;
  const { khalifa, stats } = useMemo(() => {
    const ev = evalFor(profile);
    return {
      khalifa: ev.find((e) => e.program.id === KHALIFA_ID)!,
      stats: statsFor(profile),
    };
  }, [profile]);

  const { program, status } = khalifa;
  const docs = program.required_documents;
  const ready = checked.length;
  const allReady = ready === docs.length;
  const pct = docs.length ? Math.round((ready / docs.length) * 100) : 0;
  const toggle = (idx: number) =>
    setChecked((c) => (c.includes(idx) ? c.filter((x) => x !== idx) : [...c, idx]));

  const remediable = khalifa.rules.filter((r) => !r.passed && r.remediable);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
          {ar ? "جرّبه الآن" : "Try it, right here"}
        </p>
        <h2 className="mt-2 text-3xl sm:text-4xl">
          {ar ? "ليست صورة — هذه الواجهة الحقيقية" : "Not a screenshot — the real interface"}
        </h2>
        <p className="mt-2 text-ink-soft">
          {ar
            ? "اشطب المستندات، وأعلِن إطلاق منتجك — وشاهد «ضمن متناولك» يقفز فوراً."
            : "Tick the documents, mark your MVP launched — and watch “within reach” jump."}
        </p>
      </div>

      {/* Faux app chrome so it reads as the product, not a marketing card. */}
      <div className="mt-8 overflow-hidden rounded-card border border-sand-line bg-sand-200/40 shadow-lift">
        <div className="flex items-center gap-2 border-b border-sand-line bg-sand-100 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-clay/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-almost/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-palm/50" />
          </span>
          <span className="ms-2 font-mono text-xs text-ink-faint">
            Hissati · {t.navPlan}
          </span>
        </div>

        <div className="p-4 sm:p-6">
          {/* Live metric strip + the one toggle that drives the beat. */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-night p-4 text-sand-100 sm:p-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-100/70">
                {t.withinReach}
              </p>
              <Money
                aed={stats.aedReachableNow}
                locale={locale}
                className="text-3xl font-semibold text-amber-100 sm:text-4xl"
              />
              <span className="ms-2 font-mono text-xs text-sand-100/55" dir="ltr">
                {toLocaleDigits(stats.programsEligible, locale)}/
                {toLocaleDigits(stats.programsTotal, locale)} {ar ? "مؤهَّل" : "eligible"}
              </span>
            </div>
            <Button
              variant={mvpDone ? "primary" : "accent"}
              onClick={() => setMvpDone((v) => !v)}
              aria-pressed={mvpDone}
            >
              {mvpDone ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden />
              ) : (
                <Rocket className="h-4 w-4" aria-hidden />
              )}
              {mvpDone
                ? ar
                  ? "المنتج مُطلق ✓"
                  : "MVP launched ✓"
                : ar
                  ? "أعلِن إطلاق المنتج"
                  : "Mark MVP launched"}
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Live program card. */}
            <Card className="relative overflow-hidden p-5 ps-6">
              <span
                className={`absolute inset-y-0 start-0 w-1.5 ${
                  status === "eligible" ? "bg-palm" : "bg-almost"
                }`}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg leading-snug">{pick(program.name, locale)}</h3>
                  <p className="mt-0.5 text-sm text-ink-faint">{program.operator}</p>
                </div>
                <StatusPill status={status} locale={locale} />
              </div>
              <p className="mt-3 text-xl font-semibold text-oasis">
                {formatAmountRange(program.amount, locale)}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {[program.sector_tags[0], program.sector_tags[1]]
                  .filter(Boolean)
                  .map((s) => (
                    <span
                      key={s}
                      className="rounded-pill bg-sand-200 px-2.5 py-1 text-xs font-medium leading-none text-ink-soft"
                    >
                      {enumLabel("sector", s, locale)}
                    </span>
                  ))}
              </div>

              {status === "almost" ? (
                <div className="mt-4 rounded-xl bg-almost-100/60 p-3.5 text-sm">
                  <p className="font-semibold text-almost">{t.youCouldQualify}</p>
                  {remediable.map((r, idx) => (
                    <p key={idx} className="mt-1.5 inline-flex items-start gap-1.5 text-ink-soft">
                      <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-almost" aria-hidden />
                      <span>{pick(r.blocking_message, locale)}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-palm-100/60 p-3 text-sm font-semibold text-palm">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  {ar ? "كل القواعد مستوفاة — جاهز للتقديم." : "All rules met — ready to apply."}
                </p>
              )}

              <div className="mt-4 border-t border-sand-line pt-3">
                <VerifiedStamp
                  sourceUrl={program.source.url}
                  verifiedDate={program.source.verified_date}
                  locale={locale}
                />
              </div>
            </Card>

            {/* Live, tappable checklist. */}
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  <FileText className="h-4 w-4 text-amber" aria-hidden /> {t.requiredDocs}
                </h3>
                <span
                  className={`font-mono text-sm leading-none tabular-nums ${allReady ? "text-palm" : "text-ink-soft"}`}
                  dir="ltr"
                >
                  {toLocaleDigits(ready, locale)}/{toLocaleDigits(docs.length, locale)}
                </span>
              </div>
              <span className="mt-2 block h-2 overflow-hidden rounded-pill bg-sand-200">
                <span
                  className={`block h-full rounded-pill transition-[width] duration-500 ${allReady ? "bg-palm" : "bg-amber"}`}
                  style={{ width: `${pct}%` }}
                />
              </span>

              <ul className="mt-3 space-y-1">
                {docs.map((d, idx) => {
                  const done = checked.includes(idx);
                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => toggle(idx)}
                        aria-pressed={done}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-start text-sm transition-colors ${
                          done
                            ? "border-palm-100 bg-palm-100/50"
                            : "border-sand-line bg-sand-100 hover:bg-sand-200/60"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-palm" aria-hidden />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden />
                        )}
                        <span className={done ? "text-ink-faint line-through" : "text-ink"}>
                          {pick(d, locale)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <p
                className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${allReady ? "text-palm" : "text-ink-faint"}`}
              >
                {allReady ? (
                  <>
                    <ListChecks className="h-4 w-4" aria-hidden /> {t.readyToApply}
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" aria-hidden />
                    {ar ? "اشطب لتتبّع تقدّمك" : "Tick to track your progress"}
                  </>
                )}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
