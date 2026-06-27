"use client";

/**
 * Checklist tab — the tangible take-away. For each program the founder can
 * actually act on (eligible first, then almost), an expandable application
 * checklist: documents to gather, requirements already met, how to apply, the
 * cited source, plus apply + per-program share. The list a founder carries to
 * TAMM or a bank.
 */
import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, ListChecks } from "lucide-react";
import { Card, Button, StatusPill, EmptyState } from "@/components/ui";
import { ChecklistBody } from "@/components/dashboard/ChecklistBody";
import { ShareSheet } from "@/components/ShareSheet";
import { ui, pick, type Locale } from "@/lib/i18n";
import { formatAmountRange, isCostInstrument } from "@/lib/format";
import { buildSharePayload } from "@/lib/share";
import type { EvaluatedProgram } from "@/lib/schema";

type Scored = { ev: EvaluatedProgram; pct: number };

export function ChecklistTab({
  locale,
  eligible,
  almost,
  selectedId,
}: {
  locale: Locale;
  eligible: Scored[];
  almost: Scored[];
  selectedId?: string | null;
}) {
  const t = ui(locale);
  const items = [...eligible, ...almost];
  const [openId, setOpenId] = useState<string | null>(
    selectedId ?? items[0]?.ev.program.id ?? null
  );

  // Reflect a cross-tab "view checklist" selection.
  useEffect(() => {
    if (selectedId) setOpenId(selectedId);
  }, [selectedId]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks className="h-6 w-6" aria-hidden />}
        title={locale === "ar" ? "لا توجد برامج للتقديم بعد" : "No programs to apply to yet"}
        desc={
          locale === "ar"
            ? "أنجِز خطوة في نظرة عامة لتفتح برنامجاً، ثم تظهر قائمة مستنداته هنا."
            : "Complete a step in Overview to unlock a program, then its document checklist appears here."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map(({ ev }) => {
        const { program, status } = ev;
        const opensTo = openId === program.id;
        const cost = isCostInstrument(program.instrument);
        return (
          <Card key={program.id} className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setOpenId(opensTo ? null : program.id)}
              aria-expanded={opensTo}
              className="flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-sand-200/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base leading-snug">{pick(program.name, locale)}</h3>
                  <StatusPill status={status} locale={locale} />
                </div>
                <p className="mt-0.5 text-sm text-ink-faint">
                  {program.operator}
                  <span className={`ms-2 ${cost ? "text-ink-soft" : "text-oasis"}`}>
                    · {formatAmountRange(program.amount, locale)}
                  </span>
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-ink-faint transition-transform ${opensTo ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {opensTo && (
              <div className="border-t border-sand-line p-5">
                <ChecklistBody ev={ev} locale={locale} />
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-sand-line pt-4">
                  <a href={program.application_url} target="_blank" rel="noreferrer">
                    <Button size="sm">
                      {t.apply} <ExternalLink className="h-4 w-4" aria-hidden />
                    </Button>
                  </a>
                  <ShareSheet
                    payload={buildSharePayload({ kind: "program", locale, program })}
                    locale={locale}
                  />
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
