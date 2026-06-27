"use client";

/**
 * Overview — the dashboard hero. Leads with the cited "within reach" stat strip,
 * then the signature funding sky (one hero card: a ledger on top, the sky below),
 * then the 1–3 highest-impact next actions and plan-level share / PDF. Marking a
 * step here re-flows the engine → the AED climbs and stars rise (the demo beat).
 */
import { CheckCircle2, Undo2, FileDown, Sparkles } from "lucide-react";
import { Card, Stat, Money, Eyebrow, Button, EmptyState } from "@/components/ui";
import { ShareSheet } from "@/components/ShareSheet";
import { FundingSky, type SkyStar } from "@/components/dashboard/FundingSky";
import { RoadmapStepCard } from "@/components/RoadmapStepCard";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { buildSharePayload } from "@/lib/share";
import type { ProgressStats } from "@/lib/metrics";
import type { RoadmapStep } from "@/lib/roadmap";
import type { DoneStep } from "@/lib/store";

const MAX_NEXT = 3;

export function Overview({
  locale,
  stats,
  stars,
  steps,
  doneSteps,
  onMarkStep,
  onUnmarkStep,
  onDownloadPdf,
}: {
  locale: Locale;
  stats: ProgressStats;
  stars: SkyStar[];
  steps: RoadmapStep[];
  doneSteps: DoneStep[];
  onMarkStep: (step: RoadmapStep) => void;
  onUnmarkStep: (key: string) => void;
  onDownloadPdf: () => void;
}) {
  const t = ui(locale);
  const open = stats.hasOpenEndedAmounts;
  const nextSteps = steps.slice(0, MAX_NEXT);
  const plus = open ? "+" : "";

  return (
    <div className="space-y-6">
      {/* Hero: cited ledger (light) + funding sky (dark) in one card. */}
      <Card className="overflow-hidden p-0">
        <div className="sadu-band" aria-hidden />
        <div className="grid gap-5 p-5 sm:grid-cols-3 sm:gap-4 sm:p-6">
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
              stats.aedReachableAfterSteps > stats.aedReachableNow ? (
                <span className="inline-flex items-center gap-1">
                  {locale === "ar" ? "بالخطوات حتى" : "With steps up to"}{" "}
                  <Money aed={stats.aedReachableAfterSteps} locale={locale} />
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
                ? locale === "ar"
                  ? `${toLocaleDigits(steps.length, locale)} خطوة تفتح المزيد`
                  : `${steps.length} ${steps.length === 1 ? "step unlocks more" : "steps unlock more"}`
                : locale === "ar"
                  ? "لا خطوات متبقية"
                  : "no steps left"
            }
          />
        </div>
        <FundingSky
          stars={stars}
          locale={locale}
          aedReachableNow={stats.aedReachableNow}
          hasOpenEnded={open}
        />
      </Card>

      {/* Next actions — the highest-impact, cited roadmap steps. */}
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl">{locale === "ar" ? "خطواتك التالية" : "Your next steps"}</h2>
          {steps.length > MAX_NEXT && (
            <span className="text-xs text-ink-faint">
              {locale === "ar"
                ? `+${toLocaleDigits(steps.length - MAX_NEXT, locale)} في البرامج`
                : `+${steps.length - MAX_NEXT} more`}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-soft">{t.roadmapLead}</p>

        <div className="mt-4 space-y-3">
          {nextSteps.map((step, i) => (
            <RoadmapStepCard
              key={step.key}
              step={step}
              index={i}
              locale={locale}
              onDone={() => onMarkStep(step)}
            />
          ))}

          {steps.length === 0 && (
            <EmptyState
              icon={<Sparkles className="h-6 w-6 text-palm" aria-hidden />}
              title={locale === "ar" ? "لا خطوات قريبة متبقية" : "No near-term steps left"}
              desc={
                locale === "ar"
                  ? "راجع البرامج المؤهّلة في تبويب البرامج وابدأ التقديم."
                  : "Review your eligible programs in the Programs tab and start applying."
              }
            />
          )}

          {/* Completed steps trail — undoable so the climb can be replayed in the demo. */}
          {doneSteps.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {doneSteps.map((d) => (
                <li
                  key={d.key}
                  className="flex items-center gap-2 rounded-pill bg-palm-100 px-3 py-1.5 text-sm text-palm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    {d.label ? pick(d.label, locale) : d.key}
                  </span>
                  <button
                    onClick={() => onUnmarkStep(d.key)}
                    className="no-print inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ink"
                  >
                    <Undo2 className="h-3.5 w-3.5" aria-hidden /> <span className="tb-trim">{t.undo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Plan-level take-away: share the cited plan + carry it as a PDF. */}
      <Card className="no-print flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <Eyebrow>{locale === "ar" ? "خطتي" : "My plan"}</Eyebrow>
          <p className="mt-0.5 text-sm text-ink-soft">
            {locale === "ar"
              ? "شارك خطتك الموثّقة أو احملها كملف PDF إلى تَم أو البنك."
              : "Share your cited plan, or carry it as a PDF to TAMM or a bank."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShareSheet payload={buildSharePayload({ kind: "plan", locale, stats })} locale={locale} />
          <Button size="sm" onClick={onDownloadPdf}>
            <FileDown className="h-4 w-4" aria-hidden /> {t.downloadPdf}
          </Button>
        </div>
      </Card>
    </div>
  );
}
