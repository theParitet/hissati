"use client";

/**
 * Programs — a master-detail for *looking things up*. A scannable list (status
 * dot · name · amount · match) on the start side; the selected program in full on
 * the end side. Selecting for compare is a quiet per-row toggle that raises a
 * contextual bar → a clean side-by-side. No cramming everything onto a card.
 * Mobile collapses to one pane with a back step. Mirrors in RTL via logical props.
 */
import { useState } from "react";
import { GitCompare, X, ChevronLeft, ChevronRight, ChevronDown, Check, Pin } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import { ProgramDetail } from "@/components/dashboard/ProgramDetail";
import { InstrumentGlyph, STATUS_TONE, STATUS_ACTIVE_BG } from "@/components/dashboard/InstrumentGlyph";
import { CompareView } from "@/components/CompareView";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
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
  const flat = [...eligible, ...almost, ...notFit];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [view, setView] = useState<"detail" | "compare">("detail");
  const [mobilePane, setMobilePane] = useState<"list" | "detail">("list");
  // Collapsed section keys. Empty = all expanded; a key present = that group is folded.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const toggleGroup = (key: string) =>
    setCollapsed((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Pinned programs float into a "Pinned" group at the top and leave their status group.
  const isPinned = (id: string) => pinnedIds.includes(id);
  const pinnedItems = flat.filter((x) => isPinned(x.ev.program.id));
  const notPinned = (x: Scored) => !isPinned(x.ev.program.id);
  const groups = [
    { key: "pinned" as const, label: t.pinned, items: pinnedItems },
    { key: "eligible" as const, label: t.eligibleNow, items: eligible.filter(notPinned) },
    { key: "almost" as const, label: t.almostEligible, items: almost.filter(notPinned) },
    { key: "not_fit" as const, label: t.notAFit, items: notFit.filter(notPinned) },
  ].filter((g) => g.items.length > 0);

  const togglePin = (id: string) =>
    setPinnedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

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
        {/* MASTER — the list (hidden while comparing so the table gets full width).
            Keep lg:flex OUT of the always-on base: with it there, `hidden lg:flex`
            would un-hide the list on desktop and the compare view would never show. */}
        <div
          className={cn(
            "min-w-0 lg:border-e lg:border-sand-line",
            comparing
              ? "hidden"
              : mobilePane === "detail"
                ? "hidden lg:flex lg:flex-col"
                : "block lg:flex lg:flex-col"
          )}
        >
          {/* Contextual compare bar */}
          {compareIds.length > 0 && (
            <div className="flex items-center gap-2 border-b border-sand-line bg-sand-200/50 px-3 py-2">
              <span className="text-xs font-medium text-ink-soft">
                {locale === "ar"
                  ? `تم تحديد ${toLocaleDigits(compareIds.length, locale)}`
                  : `${compareIds.length} selected`}
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

          <div className="scrollbar-themed max-h-[34rem] overflow-y-auto p-2 lg:max-h-none lg:min-h-0 lg:flex-1">
            {groups.map((g) => {
              const isCollapsed = collapsed.has(g.key);
              return (
              <div key={g.key} className="mb-1.5 last:mb-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(g.key)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center gap-2 rounded-md px-2 pb-1 pt-2 text-start transition-colors hover:bg-sand-200/50"
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform",
                      isCollapsed && "-rotate-90 rtl:rotate-90"
                    )}
                    aria-hidden
                  />
                  <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-ink-faint tb-trim">
                    {g.label}
                  </span>
                  <span className="font-mono text-[11px] leading-none text-ink-faint" dir="ltr">
                    {toLocaleDigits(g.items.length, locale)}
                  </span>
                </button>
                {!isCollapsed && (
                <ul>
                  {g.items.map(({ ev, pct }) => {
                    const { program, status } = ev;
                    const active = current?.ev.program.id === program.id && view === "detail";
                    const inCompare = compareIds.includes(program.id);
                    const pinned = isPinned(program.id);
                    return (
                      <li key={program.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => select(program.id)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "group flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-start transition-colors",
                            active ? STATUS_ACTIVE_BG[status] : "hover:bg-sand-200/70"
                          )}
                        >
                          <InstrumentGlyph instrument={program.instrument} status={status} />
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-sm leading-tight",
                              active ? cn("font-semibold", STATUS_TONE[status]) : "font-medium text-ink"
                            )}
                          >
                            {pick(program.name, locale)}
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
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => toggleCompare(program.id)}
                            aria-pressed={inCompare}
                            aria-label={`${t.compare} — ${pick(program.name, locale)}`}
                            title={t.compare}
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                              inCompare
                                ? "border-oasis bg-oasis text-sand-100"
                                : "border-sand-line text-ink-faint hover:border-ink-faint hover:text-ink-soft"
                            )}
                          >
                            {inCompare ? (
                              <Check className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <GitCompare className="h-3.5 w-3.5" aria-hidden />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePin(program.id)}
                            aria-pressed={pinned}
                            aria-label={`${pinned ? t.unpin : t.pin} — ${pick(program.name, locale)}`}
                            title={pinned ? t.unpin : t.pin}
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                              pinned
                                ? "border-amber bg-amber-100 text-amber-600"
                                : "border-sand-line text-ink-faint hover:border-ink-faint hover:text-ink-soft"
                            )}
                          >
                            <Pin className={cn("h-3.5 w-3.5", pinned && "fill-current")} aria-hidden />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                )}
              </div>
              );
            })}
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
            <Back className="h-4 w-4" aria-hidden /> {locale === "ar" ? "البرامج" : "Programs"}
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
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
