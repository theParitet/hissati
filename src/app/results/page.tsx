"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Undo2, Sparkles, FileDown, Share2, GitCompare, X } from "lucide-react";
import { Button, Card, Eyebrow, Badge } from "@/components/ui";
import { ProgramCard } from "@/components/ProgramCard";
import { RoadmapStepCard } from "@/components/RoadmapStepCard";
import { ChecklistDialog } from "@/components/ChecklistDialog";
import { CompareView } from "@/components/CompareView";
import { AskBar } from "@/components/AskBar";
import {
  useHissati,
  useLocale,
  useHydrated,
  isProfileComplete,
  effectiveProfile,
} from "@/lib/store";
import { ui, pick, toLocaleDigits } from "@/lib/i18n";
import { PROGRAMS, getProgramById } from "@/lib/programs";
import { evaluateAllFull } from "@/lib/engine";
import { matchScore } from "@/lib/scoring";
import { progressStats } from "@/lib/metrics";
import { deriveRoadmap } from "@/lib/roadmap";
import { buildComparison } from "@/lib/compare";
import { exportPlanPdf } from "@/lib/pdf";
import type { Profile } from "@/lib/schema";

export default function Results() {
  const router = useRouter();
  const locale = useLocale();
  const hydrated = useHydrated();
  const t = ui(locale);
  const answers = useHissati((s) => s.answers);
  const doneSteps = useHissati((s) => s.doneSteps);
  const markStep = useHissati((s) => s.markStep);
  const unmarkStep = useHissati((s) => s.unmarkStep);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  if (!hydrated) {
    return <div className="mx-auto max-w-5xl px-6 py-20 text-ink-faint">…</div>;
  }

  if (!isProfileComplete(answers)) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl">{t.noResultsTitle}</h1>
        <p className="mt-3 text-ink-soft">{t.noResultsBody}</p>
        <Button className="mt-7" size="lg" onClick={() => router.push("/questionnaire")}>
          {t.startCta}
        </Button>
      </div>
    );
  }

  const profile = effectiveProfile(answers, doneSteps) as Profile;
  const evaluated = evaluateAllFull(profile, PROGRAMS);
  const stats = progressStats(profile, evaluated, doneSteps);
  const scored = evaluated.map((ev) => ({
    ev,
    pct: matchScore(profile, ev.program, ev.status, ev.rules),
  }));
  const eligible = scored.filter((x) => x.ev.status === "eligible").sort((a, b) => b.pct - a.pct);
  const almost = scored.filter((x) => x.ev.status === "almost").sort((a, b) => b.pct - a.pct);
  const notFit = scored.filter((x) => x.ev.status === "not_fit");
  const steps = deriveRoadmap(evaluated);

  const checklistProgram = checklistId ? getProgramById(checklistId) : undefined;

  const toggleCompare = (id: string) =>
    setCompareIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 3 ? cur : [...cur, id]
    );
  const compareRows = buildComparison(
    profile,
    compareIds
      .map((id) => evaluated.find((e) => e.program.id === id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
  );

  const downloadPdf = () =>
    exportPlanPdf({ profile, evaluated, steps, stats, locale });
  const reach = toLocaleDigits(stats.aedReachableNow, locale) + (stats.hasOpenEndedAmounts ? "+" : "");
  const waSummary =
    locale === "ar"
      ? `حِصّتي · ضمن متناولي: ${reach} درهم عبر ${toLocaleDigits(stats.programsEligible, locale)} برنامج. مؤهّل الآن: ${
          eligible.map((x) => pick(x.ev.program.name, locale)).slice(0, 3).join("، ") || "—"
        }.`
      : `Hissati · Within reach: AED ${reach} across ${stats.programsEligible} programs. Eligible now: ${
          eligible.map((x) => pick(x.ev.program.name, locale)).slice(0, 3).join(", ") || "—"
        }.`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waSummary)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow>{t.resultsFor}</Eyebrow>
          <h1 className="mt-1.5 text-3xl">{t.appName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={downloadPdf}>
            <FileDown className="h-4 w-4" aria-hidden /> {t.downloadPdf}
          </Button>
          <a href={waHref} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4" aria-hidden /> {t.shareWhatsapp}
            </Button>
          </a>
        </div>
      </div>

      {/* One-line prompt → routes to the full assistant tab (always shown). */}
      <AskBar className="mt-6" />

      {/* Gauge + roadmap */}
      <section className="mt-6 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          {/* Placeholder stat block — the Dashboard leaf (L1) replaces this with
              the funding-sky Overview + Stat/Money primitives. */}
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            {locale === "ar" ? "ضمن متناولك" : "Within reach"}
          </div>
          <div className="mt-2 text-3xl font-bold text-oasis">
            {locale === "ar" ? "" : "AED "}
            {toLocaleDigits(stats.aedReachableNow, locale)}
            {stats.hasOpenEndedAmounts ? "+" : ""}
          </div>
          <div className="mt-1 text-sm text-ink-soft">
            {toLocaleDigits(stats.programsEligible, locale)} / {toLocaleDigits(stats.programsTotal, locale)}{" "}
            {locale === "ar" ? "برنامج مؤهَّل" : "programs eligible"}
            {" · "}
            {toLocaleDigits(stats.stepsDone, locale)} / {toLocaleDigits(stats.stepsTotal, locale)}{" "}
            {locale === "ar" ? "خطوة" : "steps"}
          </div>
        </Card>

        <div>
          <h2 className="text-xl">{t.roadmapTitle}</h2>
          <p className="mt-1 text-sm text-ink-soft">{t.roadmapLead}</p>

          <div className="mt-4 space-y-3">
            {steps.map((step, i) => (
              <RoadmapStepCard
                key={step.key}
                step={step}
                index={i}
                locale={locale}
                onDone={() => markStep({ key: step.key, mutate: step.mutate, label: step.action })}
              />
            ))}

            {steps.length === 0 && (
              <Card className="flex items-center gap-3 p-4 text-sm text-ink-soft">
                <Sparkles className="h-5 w-5 text-palm" aria-hidden />
                <span className="tb-trim">
                  {locale === "ar"
                    ? "لا توجد خطوات قريبة متبقية — راجع البرامج المؤهّلة بالأسفل."
                    : "No near-term steps left — see your eligible programs below."}
                </span>
              </Card>
            )}

            {/* Completed steps trail (undoable — replay the climb in the demo) */}
            {doneSteps.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {doneSteps.map((d) => (
                  <li
                    key={d.key}
                    className="flex items-center gap-2 rounded-pill bg-palm-100 px-3 py-1.5 text-sm text-palm"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate tb-trim">{d.label ? pick(d.label, locale) : d.key}</span>
                    <button
                      onClick={() => unmarkStep(d.key)}
                      className="no-print inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ink"
                    >
                      <Undo2 className="h-3.5 w-3.5" aria-hidden /> <span className="tb-trim">{t.undo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Program groups */}
      <ProgramGroup title={t.eligibleNow} tone="palm" count={eligible.length} locale={locale}>
        {eligible.map(({ ev }) => (
          <ProgramCard
            key={ev.program.id}
            ev={ev}
            profile={profile}
            locale={locale}
            onOpenChecklist={setChecklistId}
            selected={compareIds.includes(ev.program.id)}
            onToggleSelect={toggleCompare}
          />
        ))}
      </ProgramGroup>

      <ProgramGroup title={t.almostEligible} tone="almost" count={almost.length} locale={locale}>
        {almost.map(({ ev }) => (
          <ProgramCard
            key={ev.program.id}
            ev={ev}
            profile={profile}
            locale={locale}
            onOpenChecklist={setChecklistId}
            selected={compareIds.includes(ev.program.id)}
            onToggleSelect={toggleCompare}
          />
        ))}
      </ProgramGroup>

      {notFit.length > 0 && (
        <ProgramGroup title={t.notAFit} tone="clay" count={notFit.length} locale={locale}>
          {notFit.map(({ ev }) => (
            <ProgramCard
            key={ev.program.id}
            ev={ev}
            profile={profile}
            locale={locale}
            onOpenChecklist={setChecklistId}
            selected={compareIds.includes(ev.program.id)}
            onToggleSelect={toggleCompare}
          />
          ))}
        </ProgramGroup>
      )}

      {/* Sticky compare bar — appears once you select programs to compare */}
      {compareIds.length > 0 && (
        <div className="no-print fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
          <div className="flex items-center gap-3 rounded-pill border border-sand-line bg-sand-100/95 px-3 py-2 shadow-lift backdrop-blur">
            {compareIds.length < 2 && (
              <span className="hidden ps-1 text-xs text-ink-faint sm:inline">{t.compareHint}</span>
            )}
            <Button size="sm" disabled={compareIds.length < 2} onClick={() => setCompareOpen(true)}>
              <GitCompare className="h-4 w-4" aria-hidden />
              {`${t.compareCount} (${toLocaleDigits(compareIds.length, locale)})`}
            </Button>
            <button
              onClick={() => {
                setCompareIds([]);
                setCompareOpen(false);
              }}
              aria-label={t.clearAll}
              className="inline-flex h-9 w-9 items-center justify-center rounded-pill text-ink-soft hover:bg-sand-200"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {compareOpen && compareRows.length >= 2 && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-night/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setCompareOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t.compareTitle}
        >
          <div
            className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-card border border-sand-line bg-sand-100 shadow-lift sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-sand-line bg-sand-100 p-5">
              <h2 className="text-lg">{t.compareTitle}</h2>
              <button
                onClick={() => setCompareOpen(false)}
                aria-label={t.close}
                className="inline-flex h-9 w-9 items-center justify-center rounded-pill text-ink-soft hover:bg-sand-200"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="p-3 sm:p-4">
              <CompareView
                rows={compareRows}
                locale={locale}
                onOpenChecklist={(id) => {
                  setCompareOpen(false);
                  setChecklistId(id);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {checklistProgram && (
        <ChecklistDialog
          program={checklistProgram}
          profile={profile}
          locale={locale}
          onClose={() => setChecklistId(null)}
          onDownloadPdf={downloadPdf}
        />
      )}
    </div>
  );
}

function ProgramGroup({
  title,
  tone,
  count,
  locale,
  children,
}: {
  title: string;
  tone: "palm" | "almost" | "clay";
  count: number;
  locale: "ar" | "en";
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2.5">
        <h2 className="text-xl">{title}</h2>
        <Badge tone={tone}>{toLocaleDigits(count, locale)}</Badge>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}
