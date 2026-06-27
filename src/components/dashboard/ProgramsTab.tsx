"use client";

/**
 * Programs tab — every matched program in detail, grouped eligible / almost /
 * not-a-fit. Each card names the blocking rule + cited remedy (no dead-ends) and
 * carries the compare flow: select 2–3 programs → a side-by-side CompareView.
 */
import { useState } from "react";
import { GitCompare, X } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { ProgramCard } from "@/components/ProgramCard";
import { CompareView } from "@/components/CompareView";
import { ui, toLocaleDigits, type Locale } from "@/lib/i18n";
import { buildComparison } from "@/lib/compare";
import type { EvaluatedProgram, Profile } from "@/lib/schema";

type Scored = { ev: EvaluatedProgram; pct: number };

export function ProgramsTab({
  locale,
  profile,
  eligible,
  almost,
  notFit,
  evaluated,
  onOpenChecklist,
}: {
  locale: Locale;
  profile: Profile;
  eligible: Scored[];
  almost: Scored[];
  notFit: Scored[];
  evaluated: EvaluatedProgram[];
  onOpenChecklist: (id: string) => void;
}) {
  const t = ui(locale);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

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

  const renderGroup = (items: Scored[]) =>
    items.map(({ ev, pct }) => (
      <ProgramCard
        key={ev.program.id}
        ev={ev}
        pct={pct}
        profile={profile}
        locale={locale}
        onOpenChecklist={onOpenChecklist}
        selected={compareIds.includes(ev.program.id)}
        onToggleSelect={toggleCompare}
      />
    ));

  return (
    <div>
      <Group title={t.eligibleNow} tone="palm" count={eligible.length} locale={locale}>
        {renderGroup(eligible)}
      </Group>
      <Group title={t.almostEligible} tone="almost" count={almost.length} locale={locale}>
        {renderGroup(almost)}
      </Group>
      <Group title={t.notAFit} tone="clay" count={notFit.length} locale={locale}>
        {renderGroup(notFit)}
      </Group>

      {/* Sticky compare bar — appears once programs are selected. */}
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
                  onOpenChecklist(id);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  tone,
  count,
  locale,
  children,
}: {
  title: string;
  tone: "palm" | "almost" | "clay";
  count: number;
  locale: Locale;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="mt-8 first:mt-0">
      <div className="flex items-center gap-2.5">
        <h2 className="text-xl">{title}</h2>
        <Badge tone={tone}>{toLocaleDigits(count, locale)}</Badge>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}
