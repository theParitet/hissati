import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Atomic compass mark shared by the UI and generated brand images. */
export function BrandMark({
  className,
  style,
  label,
}: {
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  return (
    <svg
      viewBox="14 14 72 72"
      fill="none"
      className={cn("block", className)}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="13" />
      <path d="M 26.25 35.16 A 28 28 0 0 1 73.75 35.16" stroke="#cba35c" strokeWidth="13" />
      <path d="M50 57 L50 38" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M50 47 Q 46 40 41 40.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M50 47 Q 54 40 59 40.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M50 47 Q 44.5 44 38.5 46" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M50 47 Q 55.5 44 61.5 46" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="47.2" cy="46.2" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="52.8" cy="46.2" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

