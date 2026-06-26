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
        {toLocaleDigits(index + 1, locale)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{pick(step.action, locale)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
          {step.est_cost_aed != null && step.est_cost_aed > 0 && (
            <span className="inline-flex items-center gap-1">
              <Coins className="h-3.5 w-3.5" aria-hidden /> {locale === "ar" ? "درهم" : "AED"}{" "}
              {toLocaleDigits(step.est_cost_aed, locale)}
            </span>
          )}
          {step.est_time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {step.est_time}
            </span>
          )}
        </div>
        <p className="mt-2 inline-flex flex-wrap items-center gap-1 text-xs text-ink-faint">
          <ArrowUpRight className="h-3.5 w-3.5 text-palm" aria-hidden />
          {locale === "ar" ? "يفتح:" : "Unlocks:"}{" "}
          {step.unlocks.map((p) => pick(p.name, locale)).join(locale === "ar" ? "، " : ", ")}
        </p>
      </div>
      <Button size="sm" className="no-print shrink-0" onClick={onDone}>
        <Check className="h-4 w-4" aria-hidden /> {t.markDone}
      </Button>
    </Card>
  );
}
