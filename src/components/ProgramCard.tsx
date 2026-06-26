"use client";

import { ExternalLink, ListChecks, Clock, ShieldCheck, Layers } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { ui, enumLabel, pick, type Locale } from "@/lib/i18n";
import { formatAmountRange, localizeDate } from "@/lib/format";
import { estimateTimeToEligibility } from "@/lib/scoring";
import type { EvaluatedProgram, Profile } from "@/lib/schema";

const STATUS_TONE = { eligible: "palm", almost: "almost", not_fit: "clay" } as const;
const STRIPE = { eligible: "bg-palm", almost: "bg-almost", not_fit: "bg-clay" } as const;

export function ProgramCard({
  ev,
  profile,
  matchPct,
  locale,
  onOpenChecklist,
}: {
  ev: EvaluatedProgram;
  profile: Profile;
  matchPct: number;
  locale: Locale;
  onOpenChecklist: (id: string) => void;
}) {
  const t = ui(locale);
  const { program, status } = ev;
  const statusLabel = status === "eligible" ? t.eligibleNow : status === "almost" ? t.almostEligible : t.notAFit;
  const tierLabel = program.tier === 1 ? t.tier1 : program.tier === 2 ? t.tier2 : t.tier3;
  const eta = estimateTimeToEligibility(profile, program, ev.rules);
  const failedRemediable = ev.rules.filter((r) => !r.passed && r.remediable);
  const failedHard = ev.rules.filter((r) => !r.passed && !r.remediable);

  return (
    <Card className="relative overflow-hidden p-5 ps-6 print-block">
      <span className={`absolute inset-y-0 start-0 w-1.5 ${STRIPE[status]}`} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug">{pick(program.name, locale)}</h3>
          <p className="mt-0.5 text-sm text-ink-faint">{program.operator}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone={STATUS_TONE[status]}>{statusLabel}</Badge>
          {status !== "not_fit" && (
            <span className="text-sm font-semibold text-ink">
              {matchPct}% <span className="font-normal text-ink-faint">{t.match}</span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-soft">
        <span className="font-semibold text-oasis">{formatAmountRange(program.amount, locale)}</span>
        <span aria-hidden>·</span>
        <span>{t[`instrument_${program.instrument}`]}</span>
        <span aria-hidden>·</span>
        <Badge tone="neutral">{tierLabel}</Badge>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {program.sector_tags.slice(0, 4).map((s) => (
          <span key={s} className="rounded-pill bg-sand-200 px-2 py-0.5 text-xs text-ink-soft">
            {enumLabel("sector", s, locale)}
          </span>
        ))}
      </div>

      {/* Almost: you could qualify if… (cited remedies, no dead-end) */}
      {status === "almost" && (
        <div className="mt-4 rounded-xl bg-almost-100/60 p-3.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-almost">
            {t.youCouldQualify}
            <span className="ms-auto inline-flex items-center gap-1 font-normal text-ink-soft">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {eta}
            </span>
          </p>
          <ul className="mt-2 space-y-2">
            {failedRemediable.map((r, i) => (
              <li key={i} className="text-sm">
                <p className="text-ink">{pick(r.blocking_message, locale)}</p>
                {r.remedy && (
                  <p className="mt-0.5 text-ink-soft">
                    → {pick(r.remedy.action, locale)}
                    {r.remedy.est_time ? ` · ${r.remedy.est_time}` : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Not a fit: name the blocking rule(s) honestly */}
      {status === "not_fit" && (
        <div className="mt-4 rounded-xl bg-clay-100/50 p-3.5">
          <p className="text-sm font-semibold text-clay">{t.whyNot}</p>
          <ul className="mt-1.5 space-y-1 text-sm text-ink-soft">
            {[...failedHard, ...failedRemediable].slice(0, 3).map((r, i) => (
              <li key={i}>• {pick(r.blocking_message, locale)}</li>
            ))}
          </ul>
        </div>
      )}

      {program.concurrent_compatible_with.length > 0 && status !== "not_fit" && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-faint">
          <Layers className="h-3.5 w-3.5" aria-hidden /> {t.stackable}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sand-line pt-3">
        <a
          href={program.source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-oasis"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {t.source} · {t.verified} {localizeDate(program.source.verified_date, locale)}
        </a>
        <div className="flex items-center gap-2 no-print">
          <Button size="sm" variant="outline" onClick={() => onOpenChecklist(program.id)}>
            <ListChecks className="h-4 w-4" aria-hidden /> {t.viewChecklist}
          </Button>
          <a href={program.application_url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost">
              {t.apply} <ExternalLink className="h-4 w-4" aria-hidden />
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}
