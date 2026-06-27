"use client";

/**
 * Side-by-side comparison. A real aligned grid (hairline rules from a 1px gap on
 * sand-line) so 2–3 programs read cleanly column-by-column: header, then one row
 * per dimension. Same deterministic engine/scoring as everywhere else — compare
 * never invents a second source of truth. Reused inline by the assistant, so the
 * extra controls (`onRemove`) are optional and back-compatible.
 */
import { ListChecks, X } from "lucide-react";
import { Button, StatusPill } from "@/components/ui";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { formatAmountRange, isCostInstrument } from "@/lib/format";
import type { CompareRow } from "@/lib/compare";

export function CompareView({
  rows,
  locale,
  onOpenChecklist,
  onRemove,
}: {
  rows: CompareRow[];
  locale: Locale;
  onOpenChecklist?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const t = ui(locale);
  const tierLabel = (tier: number) => (tier === 1 ? t.tier1 : tier === 2 ? t.tier2 : t.tier3);
  const cols = `minmax(6.5rem,0.85fr) repeat(${rows.length}, minmax(8.5rem,1fr))`;

  // One dimension = a label cell + one cell per program.
  const dim = (label: string, render: (r: CompareRow) => React.ReactNode) => (
    <>
      <div className="bg-sand-100 px-3 py-2.5 text-xs font-medium leading-snug text-ink-faint">
        {label}
      </div>
      {rows.map((r) => (
        <div key={r.id} className="bg-sand-100 px-3 py-2.5 text-sm text-ink">
          {render(r)}
        </div>
      ))}
    </>
  );

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[28rem] gap-px overflow-hidden rounded-xl border border-sand-line bg-sand-line"
        style={{ gridTemplateColumns: cols }}
      >
        {/* Header — program identity */}
        <div className="bg-sand-200/60" />
        {rows.map((r) => (
          <div key={r.id} className="relative bg-sand-200/60 px-3 py-3">
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(r.id)}
                aria-label={`${t.clearAll} — ${pick(r.name, locale)}`}
                className="absolute end-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-pill text-ink-faint hover:bg-sand-200 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
            <div className="pe-6 font-display text-sm font-semibold leading-snug text-ink">
              {pick(r.name, locale)}
            </div>
            <div className="mt-0.5 truncate text-xs text-ink-faint">{r.operator}</div>
          </div>
        ))}

        {dim(locale === "ar" ? "الحالة" : "Status", (r) => (
          <StatusPill status={r.status} locale={locale} />
        ))}

        {dim(t.match, (r) =>
          r.status === "not_fit" ? (
            <span className="text-ink-faint">—</span>
          ) : (
            <span className="font-mono leading-none tabular-nums" dir="ltr">
              {toLocaleDigits(r.matchPct, locale)}%
            </span>
          )
        )}

        {dim(t.amountRange, (r) => {
          const cost = isCostInstrument(r.instrument);
          return (
            <span>
              <span className={`font-medium ${cost ? "text-ink" : "text-oasis"}`}>
                {formatAmountRange(r.amount, locale)}
              </span>
              {cost && <span className="mt-0.5 block text-xs font-medium text-clay">{t.youPay}</span>}
            </span>
          );
        })}

        {dim(t.instrument, (r) => t[`instrument_${r.instrument}`])}
        {dim(t.tier, (r) => tierLabel(r.tier))}

        {dim(t.requirements, (r) => (
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-12 overflow-hidden rounded-pill bg-sand-200">
              <span
                className="block h-full rounded-pill bg-palm"
                style={{ width: `${r.reqTotal ? (r.reqMet / r.reqTotal) * 100 : 0}%` }}
              />
            </span>
            <span className="font-mono text-xs leading-none tabular-nums text-ink-soft" dir="ltr">
              {toLocaleDigits(r.reqMet, locale)}/{toLocaleDigits(r.reqTotal, locale)}
            </span>
          </span>
        ))}

        {dim(t.timeToQualify, (r) =>
          r.status === "eligible" ? (
            <span className="text-palm">{t.eligibleNow}</span>
          ) : (
            <span dir="ltr">{r.eta}</span>
          )
        )}

        {dim(t.stackableShort, (r) => (r.stackable ? t.yes : t.no))}

        {onOpenChecklist &&
          dim("", (r) => (
            <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => onOpenChecklist(r.id)}>
              <ListChecks className="h-3.5 w-3.5" aria-hidden /> {t.viewChecklist}
            </Button>
          ))}
      </div>
    </div>
  );
}
