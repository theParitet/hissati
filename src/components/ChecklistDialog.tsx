"use client";

import { useEffect } from "react";
import { X, ExternalLink, FileDown, Share2, ShieldCheck, Clock, FileText, CheckCircle2, Circle, Wallet } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import { formatAmountRange, localizeDate, isCostInstrument } from "@/lib/format";
import { useHissati } from "@/lib/store";
import type { Profile, Program } from "@/lib/schema";

export function ChecklistDialog({
  program,
  locale,
  onClose,
  onDownloadPdf,
}: {
  program: Program;
  profile: Profile;
  locale: Locale;
  onClose: () => void;
  onDownloadPdf?: () => void;
}) {
  const t = ui(locale);
  const checkedAll = useHissati((s) => s.checkedDocs);
  const toggleDoc = useHissati((s) => s.toggleDoc);
  const checked = checkedAll[program.id] ?? [];
  const cost = isCostInstrument(program.instrument);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const summary =
    locale === "ar"
      ? `حِصّتي: مشروعي مهتم ببرنامج «${pick(program.name, locale)}» (${formatAmountRange(program.amount, locale)}). ${program.application_url}`
      : `Hissati: I'm exploring "${pick(program.name, locale)}" (${formatAmountRange(program.amount, locale)}). ${program.application_url}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(summary)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-night/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={pick(program.name, locale)}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-card border border-sand-line bg-sand-100 shadow-lift sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-sand-line bg-sand-100 p-5">
          <div>
            <h2 className="text-lg leading-snug">{pick(program.name, locale)}</h2>
            <p className="mt-0.5 text-sm text-ink-faint">{program.operator}</p>
          </div>
          <button onClick={onClose} aria-label={t.close} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-ink-soft hover:bg-sand-200">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 p-5">
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

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FileText className="h-4 w-4 text-oasis" aria-hidden /> <span className="tb-trim">{t.requiredDocs}</span>
              <span className="ms-auto text-xs font-normal text-ink-soft tb-trim">
                {toLocaleDigits(checked.length, locale)}/{toLocaleDigits(program.required_documents.length, locale)}{" "}
                {t.docsProgress}
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

          <a
            href={program.source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-oasis"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            <span className="tb-trim">{t.source} · {t.verified} {localizeDate(program.source.verified_date, locale)}</span>
          </a>
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-sand-line bg-sand-100 p-4">
          <a href={program.application_url} target="_blank" rel="noreferrer" className="flex-1">
            <Button className="w-full">
              {t.apply} <ExternalLink className="h-4 w-4" aria-hidden />
            </Button>
          </a>
          {onDownloadPdf && (
            <Button variant="outline" onClick={onDownloadPdf}>
              <FileDown className="h-4 w-4" aria-hidden /> {t.downloadPdf}
            </Button>
          )}
          <a href={waHref} target="_blank" rel="noreferrer">
            <Button variant="ghost">
              <Share2 className="h-4 w-4" aria-hidden /> {t.shareWhatsapp}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
