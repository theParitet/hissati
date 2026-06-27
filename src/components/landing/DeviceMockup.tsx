/**
 * DeviceMockup — a CSS-drawn laptop or phone frame wrapping a screenshot.
 *
 * The frame is drawn in markup; only the SCREEN `src` changes. That keeps the
 * device looking real while the orchestrator swaps placeholder art in
 * `public/screenshots/*` for real Playwright captures in Wave 2 — just point
 * `src` at the new file, nothing else moves.
 *
 * Offline-safe: plain same-origin <img> (the service worker caches it
 * cache-first), no next/image SVG config, no runtime CDN.
 */
import { cn } from "@/lib/cn";

export interface DeviceMockupProps {
  /** Screen image path under /public (swapped for a real screenshot later). */
  src: string;
  /** Which chrome to draw around the screen. */
  device: "laptop" | "phone";
  /** Describe the screen for assistive tech (the frame itself is decorative). */
  alt?: string;
  className?: string;
  /** Eager-load above-the-fold (hero) images. */
  priority?: boolean;
}

export function DeviceMockup({ src, device, alt = "", className, priority }: DeviceMockupProps) {
  const loading = priority ? "eager" : "lazy";

  if (device === "phone") {
    return (
      <div className={cn("relative", className)}>
        <div className="rounded-[2.2rem] border border-night-100/60 bg-night-700 p-[6px] shadow-lift">
          <div className="relative overflow-hidden rounded-[1.8rem] bg-night">
            {/* notch */}
            <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
              <div className="mt-1.5 h-1.5 w-16 rounded-full bg-night-100/80" />
            </div>
            <img
              src={src}
              alt={alt}
              loading={loading}
              decoding="async"
              className="block aspect-[9/19.5] w-full object-cover object-top"
            />
            {/* glass sheen */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-transparent"
            />
          </div>
        </div>
      </div>
    );
  }

  // laptop
  return (
    <div className={cn("relative", className)}>
      <div className="rounded-2xl border border-night-100/60 bg-night-700 p-2 shadow-lift">
        <div className="relative overflow-hidden rounded-lg bg-night">
          <img
            src={src}
            alt={alt}
            loading={loading}
            decoding="async"
            className="block aspect-[16/10] w-full object-cover object-top"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
          />
        </div>
      </div>
      {/* hinge + base */}
      <div className="mx-auto h-2 w-[112%] -translate-x-[1%] rounded-b-xl border-x border-b border-night-100/50 bg-night-700" />
      <div className="mx-auto h-1 w-10 rounded-b-md bg-night-100/70" />
    </div>
  );
}
