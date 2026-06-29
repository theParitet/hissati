"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Layers, ListChecks } from "lucide-react";
import { Button } from "@/components/ui";
import { SideNav, type NavItem } from "@/components/dashboard/SideNav";
import { Overview } from "@/components/dashboard/Overview";
import { ProgramsTab } from "@/components/dashboard/ProgramsTab";
import { ChecklistTab } from "@/components/dashboard/ChecklistTab";
import type { SkyStar } from "@/components/dashboard/FundingSky";
import {
  useHissati,
  useLocale,
  useHydrated,
  isProfileComplete,
  doneKeysOf,
} from "@/lib/store";
import { ui } from "@/lib/i18n";
import { PROGRAMS } from "@/lib/programs";
import { evaluateAllFull } from "@/lib/engine";
import { matchScore } from "@/lib/scoring";
import { isCurrentlyAvailable, progressStats } from "@/lib/metrics";
import { deriveRoadmap, type RoadmapStep } from "@/lib/roadmap";
import { PlanDocument } from "@/components/print/PlanDocument";
import type { Profile } from "@/lib/schema";

/** The sky mirrors the metric's funding set exactly, so its lit/total == OPEN MATCHES. */
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

  const profile = answers as Profile;
  const doneKeys = doneKeysOf(doneSteps);
  const evaluated = evaluateAllFull(profile, PROGRAMS, doneKeys);
  const stats = progressStats(profile, evaluated, doneSteps);
  const scored = evaluated.map((ev) => ({
    ev,
    pct: matchScore(profile, ev.program, ev.status, ev.rules),
  }));
  const eligible = scored.filter((x) => x.ev.status === "eligible").sort((a, b) => b.pct - a.pct);
  const almost = scored.filter((x) => x.ev.status === "almost").sort((a, b) => b.pct - a.pct);
  const notFit = scored.filter((x) => x.ev.status === "not_fit");
  const steps = deriveRoadmap(evaluated);

  // Each star is one funding program (same set the OPEN MATCHES metric counts).
  const stars: SkyStar[] = scored
    .filter((x) => FUNDING.has(x.ev.program.instrument) && isCurrentlyAvailable(x.ev.program))
    .map((x) => ({ id: x.ev.program.id, name: x.ev.program.name, status: x.ev.status }));

  // Export = native browser print → "Save as PDF". The print-only <PlanDocument/>
  // below is the document; the dashboard is `print:hidden`, so this prints the same
  // plan from any tab. Wait for fonts so Arabic shaping has settled before the dialog.
  const downloadPdf = async () => {
    try {
      await document.fonts?.ready;
    } catch {
      /* fonts API unavailable — print anyway */
    }
    window.print();
  };
  const onMarkStep = (step: RoadmapStep) =>
    markStep({ key: step.key, label: step.action });
  const openChecklist = (id: string) => {
    setChecklistId(id);
    setTab("checklist");
  };

  const navItems: NavItem[] = [
    { id: "overview", label: t.tabOverview, icon: LayoutGrid },
    { id: "programs", label: t.tabPrograms, icon: Layers, count: stats.programsEligible, tone: "palm" },
    { id: "checklist", label: t.tabChecklist, icon: ListChecks, count: stats.programsEligible + stats.programsAlmost },
  ];

  return (
    <>
      {/* On screen: the interactive dashboard. Hidden when printing. */}
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 print:hidden">
      <div className="grid gap-5 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-8">
        {/* Dashboard chrome — vertical nav (mobile: horizontal strip). */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SideNav
            items={navItems}
            active={tab}
            onChange={(id) => setTab(id as TabId)}
            locale={locale}
          />
        </aside>

        {/* Isolated content panel */}
        <div className="min-w-0">
          <div key={tab} className="animate-rise">
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
              <ChecklistTab
                locale={locale}
                eligible={eligible}
                almost={almost}
                selectedId={checklistId}
                onDownloadPdf={downloadPdf}
              />
            )}
          </div>
        </div>
      </div>
      </div>

      {/* When printing: the faithful, vector "Funding Readiness Plan" document. */}
      <PlanDocument
        profile={profile}
        evaluated={evaluated}
        steps={steps}
        stats={stats}
        locale={locale}
      />
    </>
  );
}
