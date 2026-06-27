"use client";

/**
 * ChecklistBody — the shared contents of an application checklist: amount + how
 * to apply, the required documents the founder ticks off (persisted), the
 * requirements the engine already met, and the cited source. Reused by the
 * ChecklistDialog modal (opened from the assistant) and the dashboard Checklist
 * tab so both read identical numbers.
 */
import { Clock, FileText, CheckCircle2, Circle, Wallet, ListChecks } from "lucide-react";
import { Badge, VerifiedStamp } from "@/components/ui";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { formatAmountRange, isCostInstrument } from "@/lib/format";
import { programProgress } from "@/lib/checklist";
import { useHissati } from "@/lib/store";
import type { EvaluatedProgram } from "@/lib/schema";

export function ChecklistBody({ ev, locale }: { ev: EvaluatedProgram; locale: Locale }) {
  const t = ui(locale);
  const { program } = ev;
  const checkedAll = useHissati((s) => s.checkedDocs);
  const toggleDoc = useHissati((s) => s.toggleDoc);
  const checked = checkedAll[program.id] ?? [];
  const cost = isCostInstrument(program.instrument);
  const prog = programProgress(ev, checked);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className={`font-semibold ${cost ? "text-ink" : "text-oasis"}`}>
          {formatAmountRange(program.amount, locale)}
        </span>
        {cost && (
          <Badge tone="clay">
            <Wallet className="h-3 w-3" aria-hidden /> {t.youPay}
          </Badge>
        )}
        <Badge tone="neutral">{t[`instrument_${program.instrument}`]}</Badge>
      </div>

      {/* Requirements the engine already met — the eligibility signal. */}
      <div className="flex items-center gap-2 rounded-xl bg-palm-100/50 px-3 py-2 text-sm text-palm">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        <span className="tb-trim">{t.requirements}</span>
        <span className="ms-auto font-mono tabular-nums" dir="ltr">
          {toLocaleDigits(prog.reqMet, locale)}/{toLocaleDigits(prog.reqTotal, locale)}
        </span>
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <FileText className="h-4 w-4 text-oasis" aria-hidden /> <span className="tb-trim">{t.requiredDocs}</span>
          <span className="ms-auto font-mono text-xs font-normal text-ink-soft tb-trim" dir="ltr">
            {toLocaleDigits(checked.length, locale)}/{toLocaleDigits(program.required_documents.length, locale)}
          </span>
        </h3>
        <ul className="mt-2 space-y-0.5">
          {program.required_documents.map((d, i) => {
            const done = checked.includes(i);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggleDoc(program.id, i)}
                  aria-pressed={done}
                  className="flex w-full items-start gap-2.5 rounded-md px-1.5 py-1.5 text-start text-sm transition-colors hover:bg-sand-200"
                >
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-palm" aria-hidden />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                  )}
                  <span className={done ? "tb-trim text-ink-faint line-through" : "tb-trim text-ink-soft"}>
                    {locale === "ar" ? d.ar : d.en}
                    {d.format && <span className="text-ink-faint"> · {d.format}</span>}
                  </span>
                </button>
              </li>
            );
          })}
          {program.required_documents.length === 0 && (
            <li className="flex items-center gap-2 px-1.5 py-1.5 text-sm text-ink-soft">
              <ListChecks className="h-4 w-4 text-palm" aria-hidden />
              {locale === "ar" ? "لا مستندات محددة مسبقاً." : "No documents listed up front."}
            </li>
          )}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-ink-faint">{t.introMethod}</p>
          <p className="mt-0.5 text-ink">{t[`intro_${program.intro_method}`]}</p>
        </div>
        {program.processing_time && (
          <div>
            <p className="inline-flex items-center gap-1 text-xs text-ink-faint">
              <Clock className="h-3.5 w-3.5" aria-hidden /> <span className="tb-trim">{t.processingTime}</span>
            </p>
            <p className="mt-0.5 text-ink">{program.processing_time}</p>
          </div>
        )}
      </div>

      <VerifiedStamp
        sourceUrl={program.source.url}
        verifiedDate={program.source.verified_date}
        locale={locale}
      />
    </div>
  );
}
