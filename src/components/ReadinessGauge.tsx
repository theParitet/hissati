"use client";

import { useEffect, useRef, useState } from "react";
import { toLocaleDigits, type Locale } from "@/lib/i18n";

/** Animate an integer toward `target`; starts at 0 on mount → the dawn reveal. */
function useCountUp(target: number, duration = 700): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      fromRef.current = target;
      setDisplay(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

export function ReadinessGauge({
  score,
  locale,
  label,
  hint,
  breakdown,
}: {
  score: number;
  locale: Locale;
  label: string;
  hint: string;
  breakdown?: { eligible: number; roadmap: number; maturity: number };
}) {
  const display = useCountUp(score);
  // Sun rises from behind the dunes (low score) to high in the sky (high score).
  const cy = 182 - (score / 100) * 122;
  const glow = 38 + (score / 100) * 26;

  return (
    <div>
      <div className="relative overflow-hidden rounded-card">
        <svg viewBox="0 0 320 196" className="w-full" role="img" aria-label={`${label}: ${score} / 100`}>
          <defs>
            <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f7e6c8" />
              <stop offset="1" stopColor="#fbf8f1" />
            </linearGradient>
            <radialGradient id="g-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#D98A1E" stopOpacity="0.45" />
              <stop offset="1" stopColor="#D98A1E" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="320" height="196" fill="url(#g-sky)" />
          <circle cx="160" cy={cy} r={glow * 1.7} fill="url(#g-glow)" />
          <circle cx="160" cy={cy} r={glow} fill="#D98A1E" className="transition-all duration-700 ease-out" style={{ transitionProperty: "cy, r" }} />
          {/* dunes drawn over the sun so it rises from behind the horizon */}
          <path d="M-10 150 C 70 120, 150 168, 230 148 C 285 134, 320 160, 330 150 L 330 196 L -10 196 Z" fill="#1F7A52" opacity="0.9" />
          <path d="M-10 176 C 90 150, 180 192, 270 172 C 305 164, 330 182, 330 176 L 330 196 L -10 196 Z" fill="#14584A" />
        </svg>
      </div>

      <div className="mt-3 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span
            data-testid="readiness-score"
            data-score={score}
            className="font-display text-6xl font-semibold leading-none text-ink"
          >
            {toLocaleDigits(display, locale)}
          </span>
          <span className="text-2xl text-ink-faint">/ {toLocaleDigits(100, locale)}</span>
        </div>
        <p className="mt-2 font-medium text-ink">{label}</p>
        <p className="text-sm text-ink-soft">{hint}</p>
      </div>

      {breakdown && (
        <div className="mt-5 space-y-2.5">
          {[
            { key: "eligible", label: locale === "ar" ? "تمويل مؤهّل" : "Eligible funding", v: breakdown.eligible },
            { key: "roadmap", label: locale === "ar" ? "قرب التأهّل" : "Roadmap proximity", v: breakdown.roadmap },
            { key: "maturity", label: locale === "ar" ? "نضج المشروع" : "Profile maturity", v: breakdown.maturity },
          ].map((b) => (
            <div key={b.key} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-ink-soft">{b.label}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-pill bg-sand-200">
                <span
                  className="block h-full rounded-pill bg-palm transition-[width] duration-700"
                  style={{ width: `${Math.round(b.v * 100)}%` }}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
