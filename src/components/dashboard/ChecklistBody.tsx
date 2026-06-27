"use client";

/**
 * ChecklistBody — the trackable contents of an application checklist. Leads with
 * the documents to gather (the thing the founder actually works), shown as a
 * satisfying progress bar + tappable rows that persist; then the requirements the
 * engine already met, how to apply, and the cited source. Reused by the assistant's
 * ChecklistDialog and the dashboard Checklist tab so both read identical numbers.
 */
import { Clock, FileText, CheckCircle2, Circle, Wallet, ListChecks } from "lucide-react";
import { Badge, VerifiedStamp } from "@/components/ui";
import { ui, toLocaleDigits, type Locale } from "@/lib/i18n";
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
  const docsTotal = program.required_documents.length;
  const docsPct = docsTotal ? Math.round((prog.docsReady / docsTotal) * 100) : 0;
  const allReady = docsTotal > 0 && prog.docsReady === docsTotal;

  return (
    <div className="space-y-5">
      {/* Documents — the thing you track. Lead with it. */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <FileText className="h-4 w-4 text-amber" aria-hidden /> {t.requiredDocs}
          </h3>
          <span
            className={`font-mono text-sm leading-none tabular-nums ${allReady ? "text-palm" : "text-ink-soft"}`}
            dir="ltr"
          >
            {toLocaleDigits(prog.docsReady, locale)}/{toLocaleDigits(docsTotal, locale)}
          </span>
        </div>
        <span className="mt-2 block h-2 overflow-hidden rounded-pill bg-sand-200">
          <span
            className={`block h-full rounded-pill transition-[width] duration-500 ${allReady ? "bg-palm" : "bg-amber"}`}
            style={{ width: `${docsPct}%` }}
          />
        </span>

        <ul className="mt-3 space-y-1">
          {program.required_documents.map((d, i) => {
            const done = checked.includes(i);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggleDoc(program.id, i)}
                  aria-pressed={done}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-start text-sm transition-colors ${
                    done
                      ? "border-palm-100 bg-palm-100/50"
                      : "border-sand-line bg-sand-100 hover:bg-sand-200/60"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-palm" aria-hidden />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden />
                  )}
                  <span className={done ? "text-ink-faint line-through" : "text-ink"}>
                    {locale === "ar" ? d.ar : d.en}
                    {d.format && <span className="text-ink-faint"> · {d.format}</span>}
                  </span>
                </button>
              </li>
            );
          })}
          {docsTotal === 0 && (
            <li className="inline-flex items-center gap-2 rounded-lg bg-palm-100/50 px-3 py-2.5 text-sm text-palm">
              <ListChecks className="h-4 w-4" aria-hidden />
              {locale === "ar" ? "لا مستندات محددة مسبقاً." : "No documents listed up front."}
            </li>
          )}
        </ul>
      </div>

      {/* Requirements the engine already met + amount context — secondary. */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-palm-100/60 px-2.5 py-1 leading-none text-palm">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {t.requirements}
          <span className="font-mono tabular-nums" dir="ltr">
            {toLocaleDigits(prog.reqMet, locale)}/{toLocaleDigits(prog.reqTotal, locale)}
          </span>
        </span>
        <span className={`font-semibold ${cost ? "text-ink" : "text-oasis"}`}>
          {formatAmountRange(program.amount, locale)}
        </span>
        {cost && (
          <Badge tone="clay">
            <Wallet className="h-3 w-3" aria-hidden /> {t.youPay}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-sand-line pt-4 text-sm">
        <div>
          <p className="text-xs text-ink-faint">{t.introMethod}</p>
          <p className="mt-0.5 text-ink">{t[`intro_${program.intro_method}`]}</p>
        </div>
        {program.processing_time && (
          <div>
            <p className="inline-flex items-center gap-1 text-xs text-ink-faint">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {t.processingTime}
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
