/** Hand-rolled, accessible UI primitives styled in the Al Qua'a palette. */
import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { ui, type Locale } from "@/lib/i18n";
import { localizeDate } from "@/lib/format";
import type { Program } from "@/lib/schema";

type ButtonVariant = "primary" | "accent" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium leading-none transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2";
const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-oasis text-sand-100 hover:bg-oasis-700",
  accent: "bg-amber text-ink hover:bg-amber-600 hover:text-sand-100",
  outline: "border border-sand-line bg-sand-100 text-ink hover:bg-sand-200",
  ghost: "text-ink-soft hover:bg-sand-200",
};
const BTN_SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-7 text-base",
};

/**
 * Wrap text labels so they can be optically centered against icons (.tb-trim).
 * text-box-trim only acts on a real text element, never on a bare flex text
 * child — so the icon (an element) is left alone and each text run is boxed.
 * Whitespace-only runs are dropped; the flex `gap` provides icon↔label spacing.
 */
export function trimLabels(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") return child.trim() ? <span className="tb-trim">{child}</span> : null;
    if (typeof child === "number") return <span className="tb-trim">{child}</span>;
    return child;
  });
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)} {...props}>
      {trimLabels(children)}
    </button>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-sand-line bg-sand-100 shadow-card",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "palm" | "almost" | "clay" | "oasis" | "night";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-sand-200 text-ink-soft",
    palm: "bg-palm-100 text-palm",
    almost: "bg-almost-100 text-almost",
    clay: "bg-clay-100 text-clay",
    oasis: "bg-oasis-100 text-oasis",
    night: "bg-night text-sand-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium leading-none",
        tones[tone],
        className
      )}
      {...props}
    >
      {trimLabels(children)}
    </span>
  );
}

/** An eyebrow label — encodes section identity, set in the utility face. */
export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint",
        className
      )}
      {...props}
    />
  );
}

/* ==========================================================================
 * Overhaul contract primitives (spec §6.2). Money/data render in the mono
 * "ledger" voice, always dir="ltr" regardless of document direction.
 * ======================================================================== */

/** Group an AED integer and (in Arabic) render Eastern-Arabic numerals. Never inflates. */
export function formatAED(aed: number, locale: Locale): string {
  const grouped = Math.round(aed).toLocaleString("en-US");
  return locale === "ar"
    ? grouped.replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)])
    : grouped;
}

/** An AED amount in the ledger voice. Always LTR + mono. */
export function Money({
  aed,
  locale,
  prefix = true,
  className,
}: {
  aed: number;
  locale: Locale;
  prefix?: boolean;
  className?: string;
}) {
  return (
    <span dir="ltr" className={cn("font-mono tabular-nums", className)}>
      {prefix ? "AED " : ""}
      {formatAED(aed, locale)}
    </span>
  );
}

/** Accessible tab strip (roving tabindex + arrow keys). Selection-only; the
 *  parent renders the active panel from `active`. */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const move = (dir: 1 | -1) => {
    const i = tabs.findIndex((t) => t.id === active);
    if (i < 0) return;
    const next = (i + dir + tabs.length) % tabs.length;
    onChange(tabs[next].id);
  };
  return (
    <div
      role="tablist"
      className={cn("inline-flex gap-1 rounded-pill bg-sand-200 p-1", className)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
      }}
    >
      {tabs.map((tb) => {
        const selected = tb.id === active;
        return (
          <button
            key={tb.id}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tb.id)}
            className={cn(
              "rounded-pill px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
              selected ? "bg-sand-100 text-oasis shadow-card" : "text-ink-soft hover:text-ink"
            )}
          >
            {trimLabels(tb.label)}
          </button>
        );
      })}
    </div>
  );
}

/** A single headline stat (label · value · optional sub). */
export function Stat({
  label,
  value,
  sub,
  tone = "ink",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "ink" | "oasis" | "amber";
  className?: string;
}) {
  const valueTone = { ink: "text-ink", oasis: "text-oasis", amber: "text-amber-600" }[tone];
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </span>
      <span className={cn("text-2xl font-bold leading-none", valueTone)}>{value}</span>
      {sub ? <span className="text-xs text-ink-soft">{sub}</span> : null}
    </div>
  );
}

/** Access date + confidence stamp. Always LTR + mono. */
export function VerifiedStamp({
  sourceUrl,
  verifiedDate,
  sourceDate,
  confidence,
  locale,
  className,
}: {
  sourceUrl: string;
  verifiedDate: string;
  sourceDate?: string;
  confidence?: Program["source"]["confidence"];
  locale: Locale;
  className?: string;
}) {
  let host = sourceUrl;
  try {
    host = new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    /* keep raw */
  }
  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-clay-100 bg-clay-100/50 px-1.5 py-0.5 font-mono text-[10px] leading-none text-clay",
        className
      )}
    >
      <Check className="h-3 w-3 shrink-0" aria-hidden />
      <span className="min-w-0 break-all">
        checked · {host} · {localizeDate(verifiedDate, locale)}
        {sourceDate ? ` · source ${localizeDate(sourceDate, locale)}` : ""}
        {confidence ? ` · ${ui(locale)[`confidence_${confidence}`]}` : ""}
      </span>
    </span>
  );
}

export function AvailabilityPill({
  availability,
  locale,
  className,
}: {
  availability: Program["availability"];
  locale: Locale;
  className?: string;
}) {
  const tone = {
    open: "bg-palm-100 text-palm",
    rolling: "bg-palm-100 text-palm",
    closed: "bg-clay-100 text-clay",
    unknown: "bg-sand-200 text-ink-faint",
  }[availability.status];
  return (
    <span className={cn("inline-flex rounded-pill px-2 py-1 text-[11px] font-semibold leading-none", tone, className)}>
      {trimLabels(ui(locale)[`availability_${availability.status}`])}
    </span>
  );
}

/** Eligibility status pill (green = eligible, gold = almost, muted = not-fit). */
export function StatusPill({
  status,
  locale,
  className,
}: {
  status: "eligible" | "almost" | "not_fit";
  locale: Locale;
  className?: string;
}) {
  const t = ui(locale);
  const map = {
    eligible: { label: t.eligibleNow, cls: "bg-palm-100 text-palm", dot: "●" },
    almost: { label: t.almostEligible, cls: "bg-almost-100 text-almost", dot: "●" },
    not_fit: { label: t.notAFit, cls: "bg-sand-200 text-ink-faint", dot: "○" },
  }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold leading-none",
        map.cls,
        className
      )}
    >
      <span aria-hidden>{map.dot}</span>
      {trimLabels(map.label)}
    </span>
  );
}

/** Clarifies whether a displayed amount enters or leaves the founder's budget. */
export function AmountDirectionBadge({
  direction,
  locale,
  className,
}: {
  direction: "receive" | "pay";
  locale: Locale;
  className?: string;
}) {
  const receive = direction === "receive";
  const Icon = receive ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2 py-1 text-[11px] font-semibold leading-none",
        receive ? "bg-oasis-100 text-oasis" : "bg-clay-100 text-clay",
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="tb-trim">{receive ? ui(locale).youReceive : ui(locale).youPay}</span>
    </span>
  );
}

/** A pulsing placeholder block for async/slow content (PDF export, agent). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-sand-200", className)} aria-hidden />;
}

/** Friendly empty/zero state — never a dead-end. */
export function EmptyState({
  icon,
  title,
  desc,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  desc?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-sand-line bg-sand-100/50 px-6 py-12 text-center",
        className
      )}
    >
      {icon ? <div className="text-ink-faint">{icon}</div> : null}
      <div className="text-base font-semibold text-ink">{title}</div>
      {desc ? <p className="max-w-sm text-sm text-ink-soft">{desc}</p> : null}
      {action}
    </div>
  );
}
