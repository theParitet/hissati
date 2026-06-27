/**
 * Hissati brand logo — the single source of truth for the mark.
 *
 * SWAPPABLE BY DESIGN (dev-side): to change the logo later, either
 *   (a) edit the <Glyph> SVG below, or
 *   (b) replace <Glyph/> with <img src="/logo-mark.svg" .../> (atomic asset),
 * and every usage (header, landing, PDF) updates at once.
 *
 * The mark's lines use `currentColor`, so it adapts to context — light on the
 * green app bar (`text-sand-100`), oasis-green on light surfaces (default).
 * The top arc is the one fixed gold accent. The wordmark is rendered in the
 * app's own faces (Fraunces + Tajawal) so the logo always matches the product.
 */
import { cn } from "@/lib/cn";

function Glyph({ className }: { className?: string }) {
  return (
    <svg viewBox="14 14 72 72" fill="none" className={cn("block", className)} aria-hidden focusable="false">
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

export function Logo({
  variant = "mark",
  className,
}: {
  variant?: "mark" | "lockup" | "stacked";
  className?: string;
}) {
  if (variant === "mark") {
    return <Glyph className={cn("h-8 w-8 text-oasis", className)} />;
  }

  if (variant === "stacked") {
    return (
      <span className={cn("inline-flex flex-col items-center gap-1 leading-none text-oasis", className)}>
        <Glyph className="h-10 w-10" />
        <span className="font-display text-lg font-semibold tracking-tight tb-trim">Hissati</span>
        <span className="font-sans text-sm text-amber-600 tb-trim">حصتي</span>
      </span>
    );
  }

  // lockup (horizontal)
  return (
    <span className={cn("inline-flex items-center gap-2 leading-none text-oasis", className)}>
      <Glyph className="h-9 w-9 shrink-0" />
      <span className="inline-flex items-baseline gap-1.5">
        <span className="font-display text-xl font-semibold tracking-tight tb-trim">Hissati</span>
        <span className="font-sans text-base text-amber-600 tb-trim">حصتي</span>
      </span>
    </span>
  );
}
