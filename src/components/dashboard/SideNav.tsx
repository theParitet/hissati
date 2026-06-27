"use client";

/**
 * Vertical dashboard nav — the dashboard's own chrome, distinct from the global
 * marketing header. Calm left rail on desktop (mirrors to the right in RTL via
 * logical `start-*`), a horizontal scroll strip on mobile. Roving tabindex with
 * arrow keys; the active item carries a hairline accent bar like a horizon line.
 */
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { toLocaleDigits, type Locale } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Optional trailing count (e.g. eligible programs). 0 hides itself. */
  count?: number;
  tone?: "palm" | "neutral";
}

export function SideNav({
  items,
  active,
  onChange,
  locale,
}: {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
  locale: Locale;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, dir: 1 | -1) => {
    const next = (from + dir + items.length) % items.length;
    onChange(items[next].id);
    refs.current[next]?.focus();
  };

  return (
    <nav
      aria-label={locale === "ar" ? "أقسام اللوحة" : "Dashboard sections"}
      role="tablist"
      aria-orientation="vertical"
      className="flex flex-col gap-1"
    >
      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map((item, i) => {
          const selected = item.id === active;
          const Icon = item.icon;
          const countTone =
            item.tone === "palm" ? "bg-palm-100 text-palm" : "bg-sand-200 text-ink-soft";
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  e.preventDefault();
                  move(i, 1);
                } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  move(i, -1);
                }
              }}
              className={cn(
                "group relative inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 lg:w-full",
                selected
                  ? "bg-sand-100 font-semibold text-oasis shadow-card"
                  : "font-medium text-ink-soft hover:bg-sand-200/70 hover:text-ink"
              )}
            >
              {/* Horizon accent — desktop only; the bg pill carries the state on mobile. */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-2 start-0 hidden w-[3px] rounded-e-pill bg-amber transition-opacity lg:block",
                  selected ? "opacity-100" : "opacity-0"
                )}
              />
              <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" aria-hidden />
              <span className="tb-trim">{item.label}</span>
              {item.count ? (
                <span
                  className={cn(
                    "ms-auto inline-flex min-w-5 items-center justify-center rounded-pill px-1.5 py-0.5 font-mono text-[11px] leading-none tabular-nums",
                    countTone
                  )}
                  dir="ltr"
                >
                  {toLocaleDigits(item.count, locale)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
