"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Layers, ListChecks, Pencil, FileDown } from "lucide-react";
import { Button } from "@/components/ui";
import { SideNav, type NavItem } from "@/components/dashboard/SideNav";
import { Overview } from "@/components/dashboard/Overview";
import { ProgramsTab } from "@/components/dashboard/ProgramsTab";
import { ChecklistTab } from "@/components/dashboard/ChecklistTab";
import { ShareSheet } from "@/components/ShareSheet";
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
import { buildSharePayload } from "@/lib/share";
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

  const navItems: NavItem[] = [
    { id: "overview", label: t.tabOverview, icon: LayoutGrid },
    { id: "programs", label: t.tabPrograms, icon: Layers, count: eligible.length, tone: "palm" },
    { id: "checklist", label: t.tabChecklist, icon: ListChecks, count: eligible.length + almost.length },
  ];

  // Slim per-section actions for the dashboard top strip.
  const actions =
    tab === "overview" ? (
      <>
        <ShareSheet payload={buildSharePayload({ kind: "plan", locale, stats })} locale={locale} />
        <Button size="sm" onClick={downloadPdf}>
          <FileDown className="h-4 w-4" aria-hidden /> {t.downloadPdf}
        </Button>
      </>
    ) : tab === "checklist" ? (
      <Button size="sm" variant="outline" onClick={downloadPdf}>
        <FileDown className="h-4 w-4" aria-hidden /> {t.downloadPdf}
      </Button>
    ) : null;

  const profileSummary = [
    enumLabel("sector", profile.sector, locale),
    enumLabel("stage", profile.stage, locale),
    enumLabel("location", profile.location, locale),
  ].join(" · ");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-8">
        {/* Dashboard chrome — vertical nav (mobile: horizontal strip) + quiet profile */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SideNav
            items={navItems}
            active={tab}
            onChange={(id) => setTab(id as TabId)}
            locale={locale}
            footer={
              <div className="mt-4 rounded-xl border border-sand-line bg-sand-100/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  {locale === "ar" ? "ملفك" : "Your profile"}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{profileSummary}</p>
                <button
                  onClick={() => router.push("/questionnaire")}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-oasis transition-colors hover:text-oasis-700"
                >
                  <Pencil className="h-3 w-3" aria-hidden /> {t.editAnswers}
                </button>
              </div>
            }
          />
        </aside>

        {/* Isolated content panel + its slim action strip */}
        <div className="min-w-0">
          {actions && (
            <div className="no-print mb-4 flex items-center justify-end gap-2">{actions}</div>
          )}
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
      </div>
    </div>
  );
}
