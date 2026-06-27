import { Link2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { pick, ui, type Locale } from "@/lib/i18n";
import { programsUnlockedBy } from "@/lib/programs";
import type { Program } from "@/lib/schema";

/** Data-backed explanation for paid instruments: purpose + downstream dependencies. */
export function CostContext({
  program,
  locale,
  className,
}: {
  program: Program;
  locale: Locale;
  className?: string;
}) {
  const t = ui(locale);
  const unlocked = programsUnlockedBy(program.id);

  return (
    <div className={cn("rounded-xl border border-clay-100 bg-clay-100/35 p-3.5", className)}>
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-clay">
        <Link2 className="h-4 w-4 shrink-0" aria-hidden />
        {t.whatThisUnlocks}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{pick(program.description, locale)}</p>
      {unlocked.length > 0 && (
        <p className="mt-2 text-xs leading-relaxed text-clay">
          <span className="font-semibold">{t.requiredFor}:</span>{" "}
          {unlocked.map((item) => pick(item.name, locale)).join(locale === "ar" ? "، " : ", ")}.
        </p>
      )}
    </div>
  );
}
