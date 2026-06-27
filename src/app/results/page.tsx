"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Layers, ListChecks, Pencil } from "lucide-react";
import { Button, Eyebrow, Tabs } from "@/components/ui";
import { AskBar } from "@/components/AskBar";
import { Overview } from "@/components/dashboard/Overview";
import { ProgramsTab } from "@/components/dashboard/ProgramsTab";
import { ChecklistTab } from "@/components/dashboard/ChecklistTab";
import type { SkyStar } from "@/components/dashboard/FundingSky";
import {
  useHissati,
  useLocale,
  useHydrated,
  isProfileComplete,
  effectiveProfile,
} from "@/lib/store";
import { ui, enumLabel } from "@/lib/i18n";
import { PROGRAMS } from "@/lib/programs";
import { evaluateAllFull } from "@/lib/engine";
import { matchScore } from "@/lib/scoring";
import { progressStats } from "@/lib/metrics";
import { deriveRoadmap, type RoadmapStep } from "@/lib/roadmap";
import { exportPlanPdf } from "@/lib/pdf";
import type { Profile } from "@/lib/schema";

/** Funding instruments only — licences are roadmap rungs, not stars in the sky. */
const FUNDING = new Set(["grant", "loan", "equity", "accelerator"]);
type TabId = "overview" | "programs" | "checklist";

export default function Results() {
  const router = useRouter();
  const locale = useLocale();
  const hydrated = useHydrated();
  const t = ui(locale);
  const answers = useHissati((s) => s.answers);
  const doneSteps = useHissati((s) => s.doneSteps);
  const markStep = useHissati((s) => s.markStep);
  const unmarkStep = useHissati((s) => s.unmarkStep);

  const [tab, setTab] = useState<TabId>("overview");
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
  const stats = progressStats(profile, evaluated, doneSteps);
  const scored = evaluated.map((ev) => ({
    ev,
    pct: matchScore(profile, ev.program, ev.status, ev.rules),
  }));
  const eligible = scored.filter((x) => x.ev.status === "eligible").sort((a, b) => b.pct - a.pct);
  const almost = scored.filter((x) => x.ev.status === "almost").sort((a, b) => b.pct - a.pct);
  const notFit = scored.filter((x) => x.ev.status === "not_fit");
  const steps = deriveRoadmap(evaluated);

  const stars: SkyStar[] = scored
    .filter((x) => FUNDING.has(x.ev.program.instrument))
    .map((x) => ({ id: x.ev.program.id, name: x.ev.program.name, status: x.ev.status }));

  const downloadPdf = () => exportPlanPdf({ profile, evaluated, steps, stats, locale });
  const onMarkStep = (step: RoadmapStep) =>
    markStep({ key: step.key, mutate: step.mutate, label: step.action });
  const openChecklist = (id: string) => {
    setChecklistId(id);
    setTab("checklist");
  };

  const tabs: { id: TabId; label: React.ReactNode }[] = [
    { id: "overview", label: <TabLabel icon={<LayoutGrid className="h-4 w-4" aria-hidden />} text={t.tabOverview} /> },
    { id: "programs", label: <TabLabel icon={<Layers className="h-4 w-4" aria-hidden />} text={t.tabPrograms} /> },
    { id: "checklist", label: <TabLabel icon={<ListChecks className="h-4 w-4" aria-hidden />} text={t.tabChecklist} /> },
  ];

  // Profile context chips — the answers this plan is computed from.
  const chips = [
    enumLabel("sector", profile.sector, locale),
    enumLabel("stage", profile.stage, locale),
    enumLabel("location", profile.location, locale),
    enumLabel("funding_type", profile.funding_type, locale),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>{t.resultsFor}</Eyebrow>
          <h1 className="mt-1.5 text-3xl">{t.navPlan}</h1>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {chips.map((c, i) => (
              <span
                key={i}
                className="rounded-pill bg-sand-200 px-2.5 py-1 text-xs font-medium text-ink-soft"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/questionnaire")}>
          <Pencil className="h-4 w-4" aria-hidden /> {t.editAnswers}
        </Button>
      </div>

      <AskBar className="mt-6" />

      <div className="no-print mt-6 flex justify-center sm:justify-start">
        <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />
      </div>

      <div className="mt-6 animate-rise" key={tab}>
        {tab === "overview" && (
          <Overview
            locale={locale}
            stats={stats}
            stars={stars}
            steps={steps}
            doneSteps={doneSteps}
            onMarkStep={onMarkStep}
            onUnmarkStep={unmarkStep}
            onDownloadPdf={downloadPdf}
          />
        )}
        {tab === "programs" && (
          <ProgramsTab
            locale={locale}
            profile={profile}
            eligible={eligible}
            almost={almost}
            notFit={notFit}
            evaluated={evaluated}
            onOpenChecklist={openChecklist}
          />
        )}
        {tab === "checklist" && (
          <ChecklistTab locale={locale} eligible={eligible} almost={almost} selectedId={checklistId} />
        )}
      </div>
    </div>
  );
}

function TabLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      <span className="tb-trim">{text}</span>
    </span>
  );
}
