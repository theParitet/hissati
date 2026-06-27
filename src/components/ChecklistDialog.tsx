"use client";

import { useEffect } from "react";
import { X, ExternalLink, FileDown } from "lucide-react";
import { Button } from "@/components/ui";
import { ChecklistBody } from "@/components/dashboard/ChecklistBody";
import { ShareSheet } from "@/components/ShareSheet";
import { ui, pick, type Locale } from "@/lib/i18n";
import { buildSharePayload } from "@/lib/share";
import { evaluateProgramFull } from "@/lib/engine";
import type { Profile, Program } from "@/lib/schema";

export function ChecklistDialog({
  program,
  profile,
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
  const ev = evaluateProgramFull(profile, program);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
          <button
            onClick={onClose}
            aria-label={t.close}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-ink-soft hover:bg-sand-200"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="p-5">
          <ChecklistBody ev={ev} locale={locale} />
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
          <ShareSheet payload={buildSharePayload({ kind: "program", locale, program })} locale={locale} />
        </div>
      </div>
    </div>
  );
}
