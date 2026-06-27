"use client";

import { Check, Coins, Clock, ArrowUpRight } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import type { RoadmapStep } from "@/lib/roadmap";

export function RoadmapStepCard({
  step,
  index,
  locale,
  onDone,
}: {
  step: RoadmapStep;
  index: number;
  locale: Locale;
  onDone: () => void;
}) {
  const t = ui(locale);
  return (
    <Card className="flex items-start gap-4 p-4 print-block">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-oasis text-sm font-bold text-sand-100">
        <span className="tb-trim">{toLocaleDigits(index + 1, locale)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <p className="min-w-0 font-medium text-ink sm:flex-1">{pick(step.action, locale)}</p>
          <Button size="sm" className="no-print w-full shrink-0 sm:w-auto" onClick={onDone}>
            <Check className="h-4 w-4" aria-hidden /> {t.markDone}
          </Button>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
          {step.est_cost_aed != null && step.est_cost_aed > 0 && (
            <span className="inline-flex items-center gap-1">
              <Coins className="h-3.5 w-3.5" aria-hidden />{" "}
              <span className="tb-trim">
                {locale === "ar" ? "درهم" : "AED"} {toLocaleDigits(step.est_cost_aed, locale)}
              </span>
            </span>
          )}
          {step.est_time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />{" "}
              <span className="tb-trim" dir="ltr">{step.est_time}</span>
            </span>
          )}
        </div>
        <p className="mt-2 inline-flex flex-wrap items-center gap-1 text-xs text-ink-faint">
          <ArrowUpRight className="h-3.5 w-3.5 text-palm" aria-hidden />
          {locale === "ar" ? "يفتح:" : "Unlocks:"}{" "}
          {step.unlocks.map((p) => pick(p.name, locale)).join(locale === "ar" ? "، " : ", ")}
        </p>
      </div>
    </Card>
  );
}
