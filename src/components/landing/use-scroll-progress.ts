"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-SCRUBBED progress (0→1) of how far a tall section has travelled through
 * the viewport. Unlike a one-shot count-up, this tracks the scroll position both
 * ways, so the founder chain lights and the AED ledger climbs in lockstep with the
 * scrollbar — the visitor performs the climb themselves.
 *
 * 0  = the section's top has just reached the top of the viewport.
 * 1  = the section's bottom has just reached the bottom of the viewport.
 *
 * Honours prefers-reduced-motion: returns a fixed 1 (the completed chain + final
 * AED, immediately) and never attaches a scroll listener. SSR-safe: 0 until mounted.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(1);
      return;
    }

    let raf = 0;
    const measure = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const p = travel <= 0 ? 1 : (0 - rect.top) / travel;
      setProgress(Math.max(0, Math.min(1, p)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { ref, progress };
}
