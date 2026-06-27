"use client";

/**
 * ProgramDetail — the master-detail right pane. One program, read in full:
 * the headline facts, the eligibility verdict (requirements met + any cited
 * blocking rule & remedy — never a dead-end), the cited source, and the actions
 * (apply · open checklist · add to compare). Ticking documents lives in the
 * Checklist tab; here we only surface progress + a way in, so Programs stays a
 * place to *understand* a program, not manage it.
 */
import {
  ExternalLink,
  ListChecks,
  GitCompare,
  CheckCircle2,
  Layers,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { AmountDirectionBadge, AvailabilityPill, Button, StatusPill, VerifiedStamp } from "@/components/ui";
import { CostContext } from "@/components/CostContext";
import { ShareSheet } from "@/components/ShareSheet";
import { ui, enumLabel, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { formatAmountRange, isCostInstrument } from "@/lib/format";
import { estimateTimeToEligibility } from "@/lib/scoring";
import { programProgress } from "@/lib/checklist";
import { buildSharePayload } from "@/lib/share";
import { useHissati } from "@/lib/store";
import type { EvaluatedProgram, Profile } from "@/lib/schema";

export function ProgramDetail({
  ev,
  pct,
  profile,
  locale,
  onOpenChecklist,
  selected,
  onToggleSelect,
}: {
  ev: EvaluatedProgram;
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
  const cost = isCostInstrument(program.instrument);
  const stackable = program.concurrent_compatible_with.length > 0 && status !== "not_fit";
  const showPct = status !== "not_fit" && typeof pct === "number";
  const reqPct = prog.reqTotal ? Math.round((prog.reqMet / prog.reqTotal) * 100) : 0;

  return (
    <div>
      {/* Headline */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl leading-snug">{pick(program.name, locale)}</h2>
          <p className="mt-0.5 text-sm text-ink-faint">{program.operator}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusPill status={status} locale={locale} />
          <AvailabilityPill availability={program.availability} locale={locale} />
          {showPct && (
            <span className="font-mono text-xs leading-none text-ink-faint" dir="ltr">
              {toLocaleDigits(pct!, locale)}% {t.match}
            </span>
          )}
        </div>
      </div>

      {/* Amount + facts */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <AmountDirectionBadge direction={cost ? "pay" : "receive"} locale={locale} />
        <span className={`text-2xl font-semibold leading-none ${cost ? "text-ink" : "text-oasis"}`}>
          {formatAmountRange(program.amount, locale)}
        </span>
      </div>
      {cost && <CostContext program={program} locale={locale} className="mt-3" />}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip>{t[`instrument_${program.instrument}`]}</Chip>
        <Chip>{tierLabel}</Chip>
        {program.sector_tags.slice(0, 3).map((s) => (
          <Chip key={s}>{enumLabel("sector", s, locale)}</Chip>
        ))}
        {stackable && (
          <Chip>
            <Layers className="h-3 w-3" aria-hidden /> {t.stackableShort}
          </Chip>
        )}
      </div>

      {/* Requirements met — the eligibility signal */}
      <div className="mt-5 rounded-xl border border-sand-line bg-sand-100 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
            <CheckCircle2 className="h-4 w-4 text-palm" aria-hidden /> {t.requirements}
          </span>
          <span className="font-mono text-sm leading-none tabular-nums text-ink-soft" dir="ltr">
            {toLocaleDigits(prog.reqMet, locale)}/{toLocaleDigits(prog.reqTotal, locale)}
          </span>
        </div>
        <span className="mt-2.5 block h-1.5 overflow-hidden rounded-pill bg-sand-200">
          <span
            className="block h-full rounded-pill bg-palm transition-[width] duration-500"
            style={{ width: `${reqPct}%` }}
          />
        </span>

        {status === "eligible" && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-palm">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {["open", "rolling"].includes(program.availability.status)
              ? locale === "ar"
                ? "تستوفي الشروط المنشورة — يمكنك فتح مسار التقديم."
                : "Published criteria met — you can open the application route."
              : locale === "ar"
                ? "تستوفي الشروط المنشورة، لكن نافذة التقديم ليست مفتوحة حالياً."
                : "Published criteria met, but the application window is not currently open."}
          </p>
        )}

        {status === "almost" && (
          <div className="mt-3.5 border-t border-sand-line pt-3.5">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-almost">
              {t.youCouldQualify}
              <span className="ms-auto inline-flex items-center gap-1 font-normal text-ink-soft">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                <span dir="ltr">{eta}</span>
              </span>
            </p>
            <ul className="mt-2.5 space-y-2.5">
              {failedRemediable.map((r, i) => (
                <li key={i} className="text-sm">
                  <p className="text-ink">{pick(r.blocking_message, locale)}</p>
                  {r.remedy && (
                    <p className="mt-0.5 inline-flex items-start gap-1 text-ink-soft">
                      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-palm" aria-hidden />
                      <span>
                        {pick(r.remedy.action, locale)}
                        {r.remedy.est_time ? ` · ${r.remedy.est_time}` : ""}
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status === "not_fit" && (
          <div className="mt-3.5 border-t border-sand-line pt-3.5">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-clay">
              <AlertTriangle className="h-4 w-4" aria-hidden /> {t.whyNot}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
              {[...failedHard, ...failedRemediable].slice(0, 4).map((r, i) => (
                <li key={i} className="flex gap-1.5">
                  <span aria-hidden className="text-clay">•</span>
                  <span>{pick(r.blocking_message, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Documents — progress only; ticking lives in the Checklist tab */}
      <button
        type="button"
        onClick={() => onOpenChecklist(program.id)}
        className="no-print mt-3 flex items-center gap-3 rounded-xl border border-sand-line bg-sand-100 p-3.5 text-start transition-colors hover:bg-sand-200/60"
      >
        <FileText className="h-4 w-4 shrink-0 text-amber" aria-hidden />
        <span className="min-w-0 flex-1 text-sm font-medium text-ink">{t.requiredDocs}</span>
        <span className="font-mono text-sm leading-none tabular-nums text-ink-soft" dir="ltr">
          {toLocaleDigits(prog.docsReady, locale)}/{toLocaleDigits(prog.docsTotal, locale)}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
      </button>

      {/* Source + actions */}
      <div className="mt-6 border-t border-sand-line pt-4">
        <VerifiedStamp
          sourceUrl={program.source.url}
          verifiedDate={program.source.verified_date}
          sourceDate={program.source.source_date}
          confidence={program.source.confidence}
          locale={locale}
        />
        <div className="no-print mt-3 flex flex-wrap items-center gap-2">
          <a href={program.application_url} target="_blank" rel="noreferrer">
            <Button size="sm">
              {["open", "rolling"].includes(program.availability.status) ? t.apply : t.source} <ExternalLink className="h-4 w-4" aria-hidden />
            </Button>
          </a>
          <Button size="sm" variant="outline" onClick={() => onOpenChecklist(program.id)}>
            <ListChecks className="h-4 w-4" aria-hidden /> {t.viewChecklist}
          </Button>
          {onToggleSelect && (
            <Button
              size="sm"
              variant={selected ? "primary" : "ghost"}
              onClick={() => onToggleSelect(program.id)}
              aria-pressed={selected}
            >
              <GitCompare className="h-4 w-4" aria-hidden /> {t.compare}
            </Button>
          )}
          <ShareSheet payload={buildSharePayload({ kind: "program", locale, program })} locale={locale} />
        </div>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-sand-200 px-2.5 py-1 text-xs font-medium leading-none text-ink-soft">
      {children}
    </span>
  );
}
