"use client";

import { ExternalLink, ListChecks, Clock, Layers, GitCompare, CheckCircle2, FileText, Pencil } from "lucide-react";
import { AmountDirectionBadge, AvailabilityPill, Card, Button, StatusPill, VerifiedStamp, trimLabels } from "@/components/ui";
import { CostContext } from "@/components/CostContext";
import { ui, enumLabel, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { formatAmountRange, isCostInstrument } from "@/lib/format";
import { estimateTimeToEligibility } from "@/lib/scoring";
import { programProgress } from "@/lib/checklist";
import { useHissati } from "@/lib/store";
import type { EvaluatedProgram, Profile } from "@/lib/schema";

const CARD_TONE = {
  eligible: "border-palm-100 bg-palm-100/25",
  almost: "border-almost-100 bg-almost-100/30",
  not_fit: "border-clay-100 bg-clay-100/25",
} as const;

export function ProgramCard({
  ev,
  pct,
  profile,
  locale,
  onOpenChecklist,
  selected,
  onToggleSelect,
}: {
  ev: EvaluatedProgram;
  /** Match score 0–100 (optional; hidden for not-a-fit). */
  pct?: number;
  profile: Profile;
  locale: Locale;
  onOpenChecklist: (id: string) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const t = ui(locale);
  const { program, status } = ev;
  const tierLabel = program.tier === 1 ? t.tier1 : program.tier === 2 ? t.tier2 : t.tier3;
  const eta = estimateTimeToEligibility(profile, program, ev.rules);
  const failedRemediable = ev.rules.filter((r) => !r.passed && r.remediable);
  const failedHard = ev.rules.filter((r) => !r.passed && !r.remediable);
  const checkedDocs = useHissati((s) => s.checkedDocs);
  const prog = programProgress(ev, checkedDocs[program.id] ?? []);
  const stackable = program.concurrent_compatible_with.length > 0 && status !== "not_fit";
  const cost = isCostInstrument(program.instrument);
  const showPct = status !== "not_fit" && typeof pct === "number";

  return (
    <Card
      className={`relative min-w-0 max-w-full overflow-hidden p-5 print-block transition-shadow ${CARD_TONE[status]} ${
        selected ? "shadow-lift ring-2 ring-oasis ring-offset-2 ring-offset-sand" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug">{pick(program.name, locale)}</h3>
          <p className="mt-0.5 text-sm text-ink-faint">{program.operator}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusPill status={status} locale={locale} />
          <AvailabilityPill availability={program.availability} locale={locale} />
          {showPct && (
            <span className="font-mono text-xs text-ink-faint" dir="ltr">
              {toLocaleDigits(pct!, locale)}% {t.match}
            </span>
          )}
        </div>
      </div>

      {/* Amount headline — direction is always explicit, for both income and costs. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <AmountDirectionBadge direction={cost ? "pay" : "receive"} locale={locale} />
        <span className={`text-xl font-semibold ${cost ? "text-ink" : "text-oasis"}`}>
          {formatAmountRange(program.amount, locale)}
        </span>
      </div>
      {cost && <CostContext program={program} locale={locale} className="mt-3" />}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <MetaChip>{t[`instrument_${program.instrument}`]}</MetaChip>
        <MetaChip>{tierLabel}</MetaChip>
        {program.sector_tags.slice(0, 3).map((s) => (
          <MetaChip key={s}>{enumLabel("sector", s, locale)}</MetaChip>
        ))}
        {stackable && (
          <MetaChip>
            <Layers className="h-3 w-3" aria-hidden /> {t.stackableShort}
          </MetaChip>
        )}
      </div>

      {/* Progress: requirements met (engine) + documents ready (founder's ticks). */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <ProgressMeter
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-palm" aria-hidden />}
          label={t.requirements}
          value={prog.reqMet}
          total={prog.reqTotal}
          tone="palm"
          locale={locale}
        />
        <button
          type="button"
          onClick={() => onOpenChecklist(program.id)}
          aria-label={t.documentsReady}
          className="no-print rounded-md text-start transition-colors hover:bg-sand-200"
        >
          <ProgressMeter
            icon={<FileText className="h-3.5 w-3.5 text-amber" aria-hidden />}
            label={t.documentsReady}
            value={prog.docsReady}
            total={prog.docsTotal}
            tone="amber"
            locale={locale}
            affordance={<Pencil className="h-3 w-3 text-ink-faint" aria-hidden />}
          />
        </button>
      </div>

      {/* Almost: you could qualify if… (cited remedies, no dead-end) */}
      {status === "almost" && (
        <div className="mt-4 rounded-xl bg-almost-100/60 p-3.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-almost">
            {t.youCouldQualify}
            <span className="ms-auto inline-flex items-center gap-1 font-normal text-ink-soft">
              <Clock className="h-3.5 w-3.5" aria-hidden /> <span className="tb-trim" dir="ltr">{eta}</span>
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sand-line pt-3">
        <VerifiedStamp
          sourceUrl={program.source.url}
          verifiedDate={program.source.verified_date}
          sourceDate={program.source.source_date}
          confidence={program.source.confidence}
          locale={locale}
        />
        <div className="flex items-center gap-2 no-print">
          {onToggleSelect && (
            <Button
              size="sm"
              variant={selected ? "primary" : "outline"}
              onClick={() => onToggleSelect(program.id)}
              aria-pressed={selected}
            >
              <GitCompare className="h-4 w-4" aria-hidden /> {t.compare}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onOpenChecklist(program.id)}>
            <ListChecks className="h-4 w-4" aria-hidden /> {t.viewChecklist}
          </Button>
          <a href={program.application_url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost">
              {["open", "rolling"].includes(program.availability.status) ? t.apply : t.source} <ExternalLink className="h-4 w-4" aria-hidden />
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}

/** Uniform metadata chip — instrument, tier, sector, stackable all share one look. */
function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-sand-200 px-2.5 py-1 text-xs font-medium leading-none text-ink-soft">
      {trimLabels(children)}
    </span>
  );
}

/** Compact "x / y" meter with a bar — the card's progress signal. */
function ProgressMeter({
  icon,
  label,
  value,
  total,
  tone,
  locale,
  affordance,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  tone: "palm" | "amber";
  locale: Locale;
  affordance?: React.ReactNode;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <span className="flex items-center gap-1.5 py-0.5 text-xs text-ink-soft" title={label}>
      {icon}
      <span className="tabular-nums leading-none tb-trim">
        {toLocaleDigits(value, locale)}/{toLocaleDigits(total, locale)}
      </span>
      <span className="text-ink-faint tb-trim">{label}</span>
      <span className="h-1.5 w-10 overflow-hidden rounded-pill bg-sand-200">
        <span
          className={`block h-full rounded-pill ${tone === "palm" ? "bg-palm" : "bg-amber"} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </span>
      {affordance}
    </span>
  );
}
