"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count a number up from 0 → `target` the first time the returned `ref` scrolls
 * into view. This animates the landing's headline beat — the founder's "AED
 * within reach" climbing — the same emotional moment the dashboard owns live.
 *
 * Honours `prefers-reduced-motion`: shows the final value immediately, no rAF.
 * SSR-safe: renders 0 until mounted, then animates client-side (no hydration
 * mismatch — the change happens in an effect after hydration).
 */
export function useCountUp(target: number, durationMs = 1300) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / durationMs);
              const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
              setValue(Math.round(target * eased));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, durationMs]);

  return { ref, value };
}
