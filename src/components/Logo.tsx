/**
 * Hissati brand logo — the single source of truth for the mark.
 *
 * SWAPPABLE BY DESIGN (dev-side): to change the logo, edit the <BrandMark>
 * SVG in `components/BrandMark.tsx`; every usage (header, landing, PDF) updates
 * at once.
 *
 * The mark's lines use `currentColor`, so it adapts to context — light on the
 * green app bar (`text-sand-100`), oasis-green on light surfaces (default).
 * The top arc is the one fixed gold accent. The wordmark is rendered in the
 * app's own faces (Fraunces + Tajawal) so the logo always matches the product.
 */
import { cn } from "@/lib/cn";
import { BrandMark } from "@/components/BrandMark";

export function Logo({
  variant = "mark",
  className,
}: {
  variant?: "mark" | "lockup" | "stacked";
  className?: string;
}) {
  if (variant === "mark") {
    return <BrandMark className={cn("h-8 w-8 text-oasis", className)} />;
  }

  if (variant === "stacked") {
    return (
      <span className={cn("inline-flex flex-col items-center gap-1 leading-none text-oasis", className)}>
        <BrandMark className="h-10 w-10" />
        <span className="font-display text-lg font-semibold tracking-tight tb-trim">Hissati</span>
        <span className="font-sans text-sm text-amber-600 tb-trim">حصتي</span>
      </span>
    );
  }

  // lockup (horizontal)
  return (
    <span className={cn("inline-flex items-center gap-2 leading-none text-oasis", className)}>
      <BrandMark className="h-9 w-9 shrink-0" />
      <span className="inline-flex items-baseline gap-1.5">
        <span className="font-display text-xl font-semibold tracking-tight tb-trim">Hissati</span>
        <span className="font-sans text-base text-amber-600 tb-trim">حصتي</span>
      </span>
    </span>
  );
}
