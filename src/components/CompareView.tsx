"use client";

import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { formatAmountRange, isCostInstrument } from "@/lib/format";
import type { CompareRow } from "@/lib/compare";

export function CompareView({
  rows,
  locale,
  onOpenChecklist,
}: {
  rows: CompareRow[];
  locale: Locale;
  onOpenChecklist?: (id: string) => void;
}) {
  const t = ui(locale);
  const tierLabel = (tier: number) => (tier === 1 ? t.tier1 : tier === 2 ? t.tier2 : t.tier3);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-28 p-2.5" />
            {rows.map((r) => (
              <th key={r.id} className="border-b border-sand-line p-2.5 text-start align-bottom">
                <div className="font-display text-base leading-snug text-ink">{pick(r.name, locale)}</div>
                <div className="mt-0.5 text-xs text-ink-faint">{r.operator}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Requirements progress is the eligibility signal — replaces the match % + status badge. */}
          <Row label={t.requirements}>
            {rows.map((r) => (
              <Cell key={r.id}>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-14 overflow-hidden rounded-pill bg-sand-200">
                    <span
                      className="block h-full rounded-pill bg-palm"
                      style={{ width: `${r.reqTotal ? (r.reqMet / r.reqTotal) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="tabular-nums text-ink-soft">
                    {toLocaleDigits(r.reqMet, locale)}/{toLocaleDigits(r.reqTotal, locale)}
                  </span>
                </div>
              </Cell>
            ))}
          </Row>

          <Row label={t.amountRange}>
            {rows.map((r) => {
              const cost = isCostInstrument(r.instrument);
              return (
                <Cell key={r.id}>
                  <span className={`font-medium ${cost ? "text-ink" : "text-oasis"}`}>
                    {formatAmountRange(r.amount, locale)}
                  </span>
                  {cost && <span className="ms-1 text-xs font-medium text-clay">· {t.youPay}</span>}
                </Cell>
              );
            })}
          </Row>

          <Row label={t.instrument}>
            {rows.map((r) => (
              <Cell key={r.id}>{t[`instrument_${r.instrument}`]}</Cell>
            ))}
          </Row>

          <Row label={t.tier}>
            {rows.map((r) => (
              <Cell key={r.id}>{tierLabel(r.tier)}</Cell>
            ))}
          </Row>

          <Row label={t.timeToQualify}>
            {rows.map((r) => (
              <Cell key={r.id}>{r.status === "eligible" ? t.eligibleNow : r.eta}</Cell>
            ))}
          </Row>

          <Row label={t.stackableShort}>
            {rows.map((r) => (
              <Cell key={r.id}>{r.stackable ? t.yes : t.no}</Cell>
            ))}
          </Row>

          {onOpenChecklist && (
            <Row label="">
              {rows.map((r) => (
                <Cell key={r.id}>
                  <Button size="sm" variant="outline" onClick={() => onOpenChecklist(r.id)}>
                    <ListChecks className="h-4 w-4" aria-hidden /> {t.viewChecklist}
                  </Button>
                </Cell>
              ))}
            </Row>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-sand-line/60">
      <th scope="row" className="p-2.5 text-start align-middle text-xs font-medium text-ink-faint">
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="p-2.5 align-middle">{children}</td>;
}
