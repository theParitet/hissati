"use client";

/**
 * Programs — a master-detail for *looking things up*. A scannable list (status
 * dot · name · amount · match) on the start side; the selected program in full on
 * the end side. Selecting for compare is a quiet per-row toggle that raises a
 * contextual bar → a clean side-by-side. No cramming everything onto a card.
 * Mobile collapses to one pane with a back step. Mirrors in RTL via logical props.
 */
import { useState } from "react";
import { GitCompare, X, ChevronLeft, ChevronRight, Check, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import { ProgramDetail } from "@/components/dashboard/ProgramDetail";
import { CompareView } from "@/components/CompareView";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { formatAmountRange, isCostInstrument } from "@/lib/format";
import { buildComparison } from "@/lib/compare";
import type { EvaluatedProgram, Profile, EligibilityStatus } from "@/lib/schema";

type Scored = { ev: EvaluatedProgram; pct: number };
const DOT: Record<EligibilityStatus, string> = {
  eligible: "bg-palm",
  almost: "bg-almost",
  not_fit: "bg-ink-faint/50",
};

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
  const groups = [
    { key: "eligible" as const, label: t.eligibleNow, items: eligible },
    { key: "almost" as const, label: t.almostEligible, items: almost },
    { key: "not_fit" as const, label: t.notAFit, items: notFit },
  ].filter((g) => g.items.length > 0);
  const flat = [...eligible, ...almost, ...notFit];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [view, setView] = useState<"detail" | "compare">("detail");
  const [mobilePane, setMobilePane] = useState<"list" | "detail">("list");

  const current =
    flat.find((x) => x.ev.program.id === selectedId) ?? flat[0] ?? null;
  const Back = locale === "ar" ? ChevronRight : ChevronLeft;

  const toggleCompare = (id: string) =>
    setCompareIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 3 ? cur : [...cur, id]
    );

  const select = (id: string) => {
    setSelectedId(id);
    setView("detail");
    setMobilePane("detail");
  };

  const compareRows = buildComparison(
    profile,
    compareIds
      .map((id) => evaluated.find((e) => e.program.id === id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
  );

  const comparing = view === "compare" && compareRows.length >= 2;

  return (
    <div className="overflow-hidden rounded-card border border-sand-line bg-sand-100 shadow-card">
      <div className={cn("grid", comparing ? "grid-cols-1" : "lg:grid-cols-[18rem_minmax(0,1fr)]")}>
        {/* MASTER — the list (hidden while comparing so the table gets full width) */}
        <div
          className={cn(
            "min-w-0 lg:border-e lg:border-sand-line",
            comparing ? "hidden" : mobilePane === "detail" ? "hidden lg:block" : "block"
          )}
        >
          {/* Contextual compare bar */}
          {compareIds.length > 0 && (
            <div className="flex items-center gap-2 border-b border-sand-line bg-sand-200/50 px-3 py-2">
              <span className="text-xs font-medium text-ink-soft">
                {toLocaleDigits(compareIds.length, locale)} {locale === "ar" ? "محدّد" : "selected"}
              </span>
              <Button
                size="sm"
                className="ms-auto h-8 px-3"
                disabled={compareIds.length < 2}
                onClick={() => {
                  setView("compare");
                  setMobilePane("detail");
                }}
              >
                <GitCompare className="h-3.5 w-3.5" aria-hidden /> {t.compareCount}
              </Button>
              <button
                onClick={() => setCompareIds([])}
                aria-label={t.clearAll}
                className="inline-flex h-8 w-8 items-center justify-center rounded-pill text-ink-soft hover:bg-sand-200"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}

          <div className="max-h-[34rem] overflow-y-auto p-2 lg:max-h-[40rem]">
            {groups.map((g) => (
              <div key={g.key} className="mb-1.5 last:mb-0">
                <div className="flex items-center gap-2 px-2 pb-1 pt-2">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint"
                  >
                    {g.label}
                  </span>
                  <span className="font-mono text-[11px] leading-none text-ink-faint" dir="ltr">
                    {toLocaleDigits(g.items.length, locale)}
                  </span>
                </div>
                <ul>
                  {g.items.map(({ ev, pct }) => {
                    const { program, status } = ev;
                    const active = current?.ev.program.id === program.id && view === "detail";
                    const inCompare = compareIds.includes(program.id);
                    const cost = isCostInstrument(program.instrument);
                    return (
                      <li key={program.id} className="flex items-stretch gap-1">
                        <button
                          type="button"
                          onClick={() => select(program.id)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "group flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-start transition-colors",
                            active ? "bg-oasis-100" : "hover:bg-sand-200/70"
                          )}
                        >
                          <span
                            className={cn("h-2 w-2 shrink-0 rounded-pill", DOT[status])}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block truncate text-sm leading-tight",
                                active ? "font-semibold text-oasis" : "font-medium text-ink"
                              )}
                            >
                              {pick(program.name, locale)}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-ink-faint">
                              {status === "not_fit" ? (
                                program.operator
                              ) : (
                                <span className={cost ? "" : "text-oasis"}>
                                  {formatAmountRange(program.amount, locale)}
                                </span>
                              )}
                            </span>
                          </span>
                          {status !== "not_fit" && (
                            <span
                              className="shrink-0 font-mono text-[11px] leading-none text-ink-faint"
                              dir="ltr"
                            >
                              {toLocaleDigits(pct, locale)}%
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCompare(program.id)}
                          aria-pressed={inCompare}
                          aria-label={`${t.compare} — ${pick(program.name, locale)}`}
                          title={t.compare}
                          className={cn(
                            "my-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                            inCompare
                              ? "border-oasis bg-oasis text-sand-100"
                              : "border-sand-line text-ink-faint hover:border-ink-faint hover:text-ink-soft"
                          )}
                        >
                          {inCompare ? (
                            <Check className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* DETAIL — the selected program, or the compare view */}
        <div
          className={cn(
            "min-w-0 p-5 sm:p-6",
            mobilePane === "list" ? "hidden lg:block" : "block"
          )}
        >
          {/* Mobile back */}
          <button
            type="button"
            onClick={() => {
              setMobilePane("list");
              if (view === "compare") setView("detail");
            }}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink lg:hidden"
          >
            <Back className="h-4 w-4" aria-hidden /> {locale === "ar" ? "القائمة" : "Programs"}
          </button>

          {view === "compare" && compareRows.length >= 2 ? (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg leading-none">{t.compareTitle}</h2>
                <button
                  type="button"
                  onClick={() => setView("detail")}
                  className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"
                >
                  <Back className="h-4 w-4" aria-hidden /> {locale === "ar" ? "رجوع" : "Back"}
                </button>
              </div>
              <CompareView
                rows={compareRows}
                locale={locale}
                onOpenChecklist={onOpenChecklist}
                onRemove={(id) => toggleCompare(id)}
              />
            </div>
          ) : current ? (
            <ProgramDetail
              key={current.ev.program.id}
              ev={current.ev}
              pct={current.pct}
              profile={profile}
              locale={locale}
              onOpenChecklist={onOpenChecklist}
              selected={compareIds.includes(current.ev.program.id)}
              onToggleSelect={toggleCompare}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
