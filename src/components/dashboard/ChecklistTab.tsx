"use client";

/**
 * Checklist — the founder's tracker. A master-detail: every program worth acting
 * on (eligible first, then almost) listed with its live document progress; the
 * selected one opens its full, tickable checklist. The whole point is making
 * progress easy to see and satisfying to complete. Mobile collapses to one pane.
 */
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, ListChecks } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, StatusPill, EmptyState } from "@/components/ui";
import { ChecklistBody } from "@/components/dashboard/ChecklistBody";
import { ShareSheet } from "@/components/ShareSheet";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { formatAmountRange, isCostInstrument } from "@/lib/format";
import { programProgress } from "@/lib/checklist";
import { buildSharePayload } from "@/lib/share";
import { useHissati } from "@/lib/store";
import type { EvaluatedProgram, EligibilityStatus } from "@/lib/schema";

type Scored = { ev: EvaluatedProgram; pct: number };
const DOT: Record<EligibilityStatus, string> = {
  eligible: "bg-palm",
  almost: "bg-almost",
  not_fit: "bg-ink-faint/50",
};

export function ChecklistTab({
  locale,
  eligible,
  almost,
  selectedId,
}: {
  locale: Locale;
  eligible: Scored[];
  almost: Scored[];
  selectedId?: string | null;
}) {
  const t = ui(locale);
  const items = [...eligible, ...almost];
  const checkedDocs = useHissati((s) => s.checkedDocs);

  const [openId, setOpenId] = useState<string | null>(
    selectedId ?? items[0]?.ev.program.id ?? null
  );
  const [mobilePane, setMobilePane] = useState<"list" | "detail">("list");

  useEffect(() => {
    if (selectedId) {
      // Synchronize an explicit selection received from the parent dashboard.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenId(selectedId);
      setMobilePane("detail");
    }
  }, [selectedId]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks className="h-6 w-6" aria-hidden />}
        title={locale === "ar" ? "لا توجد برامج للتقديم بعد" : "No programs to apply to yet"}
        desc={
          locale === "ar"
            ? "أنجِز خطوة في نظرة عامة لتفتح برنامجاً، ثم تظهر قائمة مستنداته هنا."
            : "Complete a step in Overview to unlock a program, then its document checklist appears here."
        }
      />
    );
  }

  const current = items.find((x) => x.ev.program.id === openId) ?? items[0];
  const Back = locale === "ar" ? ChevronRight : ChevronLeft;

  // Overall documents-ready across actionable programs — the tracker's headline.
  const totals = items.reduce(
    (acc, { ev }) => {
      const p = programProgress(ev, checkedDocs[ev.program.id] ?? []);
      acc.ready += p.docsReady;
      acc.total += p.docsTotal;
      return acc;
    },
    { ready: 0, total: 0 }
  );
  const totalPct = totals.total ? Math.round((totals.ready / totals.total) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-card border border-sand-line bg-sand-100 shadow-card">
      <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* MASTER — programs + their progress */}
        <div
          className={cn(
            "min-w-0 lg:border-e lg:border-sand-line",
            mobilePane === "detail" ? "hidden lg:block" : "block"
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-sand-line bg-sand-200/40 px-4 py-2.5">
            <span className="text-xs font-medium text-ink-soft">
              {locale === "ar" ? "المستندات الجاهزة" : "Documents ready"}
            </span>
            <span className="font-mono text-xs leading-none tabular-nums text-ink-soft" dir="ltr">
              {toLocaleDigits(totals.ready, locale)}/{toLocaleDigits(totals.total, locale)} · {toLocaleDigits(totalPct, locale)}%
            </span>
          </div>

          <ul className="max-h-[34rem] overflow-y-auto p-2 lg:max-h-[40rem]">
            {items.map(({ ev }) => {
              const { program, status } = ev;
              const p = programProgress(ev, checkedDocs[program.id] ?? []);
              const pct = p.docsTotal ? Math.round((p.docsReady / p.docsTotal) * 100) : 0;
              const done = p.docsTotal > 0 && p.docsReady === p.docsTotal;
              const active = current?.ev.program.id === program.id;
              return (
                <li key={program.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(program.id);
                      setMobilePane("detail");
                    }}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "w-full rounded-lg px-2.5 py-2.5 text-start transition-colors",
                      active ? "bg-oasis-100" : "hover:bg-sand-200/70"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={cn("h-2 w-2 shrink-0 rounded-pill", DOT[status])} aria-hidden />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm leading-tight",
                          active ? "font-semibold text-oasis" : "font-medium text-ink"
                        )}
                      >
                        {pick(program.name, locale)}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-[11px] leading-none tabular-nums",
                          done ? "text-palm" : "text-ink-faint"
                        )}
                        dir="ltr"
                      >
                        {toLocaleDigits(p.docsReady, locale)}/{toLocaleDigits(p.docsTotal, locale)}
                      </span>
                    </span>
                    <span className="mt-2 ms-[1.125rem] block h-1.5 overflow-hidden rounded-pill bg-sand-200">
                      <span
                        className={cn(
                          "block h-full rounded-pill transition-[width] duration-500",
                          done ? "bg-palm" : "bg-amber"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* DETAIL — the active checklist */}
        <div
          className={cn(
            "min-w-0 p-5 sm:p-6",
            mobilePane === "list" ? "hidden lg:block" : "block"
          )}
        >
          <button
            type="button"
            onClick={() => setMobilePane("list")}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink lg:hidden"
          >
            <Back className="h-4 w-4" aria-hidden /> {t.tabChecklist}
          </button>

          {current && (
            <>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg leading-snug">{pick(current.ev.program.name, locale)}</h2>
                  <p className="mt-0.5 text-sm text-ink-faint">
                    {current.ev.program.operator}
                    <span
                      className={
                        isCostInstrument(current.ev.program.instrument) ? "" : "text-oasis"
                      }
                    >
                      {" · "}
                      {formatAmountRange(current.ev.program.amount, locale)}
                    </span>
                  </p>
                </div>
                <StatusPill status={current.ev.status} locale={locale} />
              </div>

              <ChecklistBody ev={current.ev} locale={locale} />

              <div className="no-print mt-5 flex flex-wrap items-center gap-2 border-t border-sand-line pt-4">
                <a href={current.ev.program.application_url} target="_blank" rel="noreferrer">
                  <Button size="sm">
                    {t.apply} <ExternalLink className="h-4 w-4" aria-hidden />
                  </Button>
                </a>
                <ShareSheet
                  payload={buildSharePayload({ kind: "program", locale, program: current.ev.program })}
                  locale={locale}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
