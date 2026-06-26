"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, RotateCcw, CheckCircle2, Undo2, Sparkles, FileDown, Share2 } from "lucide-react";
import { Button, Card, Eyebrow, Badge } from "@/components/ui";
import { ReadinessGauge } from "@/components/ReadinessGauge";
import { ProgramCard } from "@/components/ProgramCard";
import { RoadmapStepCard } from "@/components/RoadmapStepCard";
import { ChecklistDialog } from "@/components/ChecklistDialog";
import { AgentChat } from "@/components/AgentChat";
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
import { matchScore, readinessBreakdown } from "@/lib/scoring";
import { deriveRoadmap } from "@/lib/roadmap";
import { exportReadinessPdf } from "@/lib/pdf";
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
  const resetAnswers = useHissati((s) => s.resetAnswers);
  const [checklistId, setChecklistId] = useState<string | null>(null);

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
  const breakdown = readinessBreakdown(profile, evaluated);
  const scored = evaluated.map((ev) => ({
    ev,
    pct: matchScore(profile, ev.program, ev.status, ev.rules),
  }));
  const eligible = scored.filter((x) => x.ev.status === "eligible").sort((a, b) => b.pct - a.pct);
  const almost = scored.filter((x) => x.ev.status === "almost").sort((a, b) => b.pct - a.pct);
  const notFit = scored.filter((x) => x.ev.status === "not_fit");
  const steps = deriveRoadmap(evaluated);

  const checklistProgram = checklistId ? getProgramById(checklistId) : undefined;

  const downloadPdf = () =>
    exportReadinessPdf({ profile, evaluated, steps, score: breakdown.score, locale });
  const waSummary =
    locale === "ar"
      ? `حِصّتي · درجة جاهزيتي للتمويل: ${toLocaleDigits(breakdown.score, locale)}/${toLocaleDigits(100, locale)}. مؤهّل الآن: ${
          eligible.map((x) => pick(x.ev.program.name, locale)).slice(0, 3).join("، ") || "—"
        }.`
      : `Hissati · My funding readiness: ${breakdown.score}/100. Eligible now: ${
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
          <Button variant="ghost" size="sm" onClick={() => router.push("/questionnaire")}>
            <Pencil className="h-4 w-4" aria-hidden /> {t.editAnswers}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetAnswers();
              router.push("/questionnaire");
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> {t.restart}
          </Button>
        </div>
      </div>

      {/* Gauge + roadmap */}
      <section className="mt-6 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <ReadinessGauge
            score={breakdown.score}
            locale={locale}
            label={t.yourReadiness}
            hint={t.readinessHint}
            breakdown={breakdown}
          />
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
                {locale === "ar"
                  ? "لا توجد خطوات قريبة متبقية — راجع البرامج المؤهّلة بالأسفل."
                  : "No near-term steps left — see your eligible programs below."}
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
                    <span className="min-w-0 flex-1 truncate">{d.label ? pick(d.label, locale) : d.key}</span>
                    <button
                      onClick={() => unmarkStep(d.key)}
                      className="no-print inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ink"
                    >
                      <Undo2 className="h-3.5 w-3.5" aria-hidden /> {t.undo}
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
        {eligible.map(({ ev, pct }) => (
          <ProgramCard key={ev.program.id} ev={ev} profile={profile} matchPct={pct} locale={locale} onOpenChecklist={setChecklistId} />
        ))}
      </ProgramGroup>

      <ProgramGroup title={t.almostEligible} tone="almost" count={almost.length} locale={locale}>
        {almost.map(({ ev, pct }) => (
          <ProgramCard key={ev.program.id} ev={ev} profile={profile} matchPct={pct} locale={locale} onOpenChecklist={setChecklistId} />
        ))}
      </ProgramGroup>

      {notFit.length > 0 && (
        <ProgramGroup title={t.notAFit} tone="clay" count={notFit.length} locale={locale}>
          {notFit.map(({ ev, pct }) => (
            <ProgramCard key={ev.program.id} ev={ev} profile={profile} matchPct={pct} locale={locale} onOpenChecklist={setChecklistId} />
          ))}
        </ProgramGroup>
      )}

      {/* Optional grounded assistant — renders nothing unless ANTHROPIC_API_KEY is set */}
      <AgentChat />

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
