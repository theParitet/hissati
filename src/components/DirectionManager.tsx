"use client";

import { useHissati, useIsomorphicLayoutEffect } from "@/lib/store";
import { DIR } from "@/lib/i18n";

/**
 * Reflects the persisted locale onto <html dir/lang> (FR-H1) and reveals the body
 * the locale-bootstrap script hid for a returning English user (see layout.tsx).
 * A layout effect lands the reveal in the same pre-paint commit as React's English
 * re-render, so the first visible frame is English, never Arabic. The 3s failsafe is
 * fire-and-forget: it only ever sets opacity back to "", so a late firing is a no-op.
 * On Arabic loads the body was never hidden → the reveal is a no-op too.
 */
export function DirectionManager() {
  const locale = useHissati((s) => s.locale);
  useIsomorphicLayoutEffect(() => {
    const el = document.documentElement;
    el.lang = locale;
    el.dir = DIR[locale];
    document.body.style.opacity = "";
  }, [locale]);
  return null;
}
