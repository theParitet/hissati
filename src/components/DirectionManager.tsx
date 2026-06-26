"use client";

import { useEffect } from "react";
import { useHissati } from "@/lib/store";
import { DIR } from "@/lib/i18n";

/** Reflects the persisted locale onto <html dir/lang> after hydration (FR-H1). */
export function DirectionManager() {
  const locale = useHissati((s) => s.locale);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = DIR[locale];
  }, [locale]);
  return null;
}
