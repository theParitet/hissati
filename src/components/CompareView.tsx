"use client";

import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { formatAmountRange } from "@/lib/format";
import type { CompareRow } from "@/lib/compare";

const STATUS_TONE = { eligible: "palm", almost: "almost", not_fit: "clay" } as const;

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
  const statusLabel = (s: CompareRow["status"]) =>
    s === "eligible" ? t.eligibleNow : s === "almost" ? t.almostEligible : t.notAFit;
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
                <div className="mt-1.5">
                  <Badge tone={STATUS_TONE[r.status]}>{statusLabel(r.status)}</Badge>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label={t.match}>
            {rows.map((r) => (
              <Cell key={r.id}>
                <span className="font-semibold text-ink">{toLocaleDigits(r.matchPct, locale)}%</span>
              </Cell>
            ))}
          </Row>

          <Row label={t.amountRange}>
            {rows.map((r) => (
              <Cell key={r.id}>
                <span className="font-medium text-oasis">{formatAmountRange(r.amount, locale)}</span>
              </Cell>
            ))}
          </Row>

          <Row label={t.tier}>
            {rows.map((r) => (
              <Cell key={r.id}>
                {t[`instrument_${r.instrument}`]} · {tierLabel(r.tier)}
              </Cell>
            ))}
          </Row>

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
                  <span className="text-ink-soft">
                    {toLocaleDigits(r.reqMet, locale)}/{toLocaleDigits(r.reqTotal, locale)}
                  </span>
                </div>
              </Cell>
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
                  <button
                    onClick={() => onOpenChecklist(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-sand-line bg-sand-100 px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sand-200"
                  >
                    <ListChecks className="h-3.5 w-3.5" aria-hidden /> {t.viewChecklist}
                  </button>
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
      <th scope="row" className="p-2.5 text-start align-top text-xs font-medium text-ink-faint">
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="p-2.5 align-top">{children}</td>;
}
