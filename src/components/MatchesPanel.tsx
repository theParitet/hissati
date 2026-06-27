"use client";

import { PROGRAMS } from "@/lib/programs";
import { isStillMatching } from "@/lib/wizard";
import { ui, pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import type { Profile } from "@/lib/schema";

/**
 * Compact pill label: the brand/operator before the first " — " separator, with
 * any "(...)" parenthetical dropped. Data-driven (no per-program map), so it stays
 * correct as the KB changes — e.g. "Khalifa Fund — SME Funding (…)" → "Khalifa Fund".
 */
function shortName(name: string): string {
  return name
    .split(/\s[—–-]\s/)[0]
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
}

/**
 * Live shortlist (FR-A, item 9): every program as a chip that visibly drops out
 * the moment an answered rule rules it out (hard, no-remedy). Driven entirely by
 * the KB + engine — add or edit a program and this re-derives with no changes.
 */
export function MatchesPanel({ answers, locale }: { answers: Partial<Profile>; locale: Locale }) {
  const t = ui(locale);
  const total = PROGRAMS.length;
  const surviving = PROGRAMS.filter((p) => isStillMatching(answers, p)).length;
  const pct = total ? Math.round((surviving / total) * 100) : 0;

  return (
    <div className="rounded-card border border-sand-line bg-sand-100/60 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">{t.stillInRunning}</p>
        <p className="text-sm tabular-nums">
          <span className="font-semibold text-palm tb-trim">{toLocaleDigits(surviving, locale)}</span>
          <span className="text-ink-faint tb-trim"> / {toLocaleDigits(total, locale)}</span>
        </p>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-pill bg-sand-200">
        <div
          className="h-full rounded-pill bg-palm transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {PROGRAMS.map((p) => {
          const inRun = isStillMatching(answers, p);
          return (
            <li
              key={p.id}
              className={[
                "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[11px] leading-none transition-all duration-300",
                inRun
                  ? "border-palm/30 bg-palm-100 text-palm"
                  : "border-sand-line bg-sand-200/40 text-ink-faint line-through opacity-55",
              ].join(" ")}
            >
              {inRun && <span className="h-1.5 w-1.5 shrink-0 rounded-pill bg-palm" aria-hidden />}
              <span className="max-w-[8.5rem] truncate tb-trim">{shortName(pick(p.name, locale))}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
