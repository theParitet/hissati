"use client";

import Link from "next/link";
import { Languages, WifiOff } from "lucide-react";
import { useHissati, useLocale } from "@/lib/store";
import { ui } from "@/lib/i18n";

export function AppHeader() {
  const locale = useLocale();
  const toggleLocale = useHissati((s) => s.toggleLocale);
  const t = ui(locale);

  return (
    <header className="sticky top-0 z-30 border-b border-sand-line/70 bg-sand/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2.5">
          <span className="font-display text-2xl font-bold leading-none text-oasis">{t.appName}</span>
          <span className="hidden text-sm text-ink-faint sm:inline">{t.tagline}</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-pill bg-sand-200 px-2.5 py-1 text-xs text-ink-soft sm:inline-flex">
            <WifiOff className="h-3.5 w-3.5" aria-hidden />
            {t.offlineReady}
          </span>
          <button
            onClick={toggleLocale}
            className="inline-flex items-center gap-2 rounded-pill border border-sand-line bg-sand-100 px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Languages className="h-4 w-4" aria-hidden />
            {t.langName}
          </button>
        </div>
      </div>
    </header>
  );
}
