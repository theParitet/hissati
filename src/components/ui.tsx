/** Hand-rolled, accessible UI primitives styled in the Al Qua'a palette. */
import * as React from "react";
import { cn } from "@/lib/cn";

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

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)} {...props} />;
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
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
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
