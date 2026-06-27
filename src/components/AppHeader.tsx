"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Sparkles, UserRound, Languages, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { useHissati, useLocale } from "@/lib/store";
import { ui } from "@/lib/i18n";

/**
 * Sticky app frame. Brand → home on the start side; the three persistent
 * surfaces (plan / assistant / details) in the middle; status + language on the
 * end. One consistent vocabulary — "My plan", never "matches"/"readiness".
 *
 * Light surface by design: the Logo renders in its own oasis/gold palette here
 * (cn() is a plain joiner, so its baked-in colour isn't reliably overridable),
 * and the one bold move is spent on the dashboard's funding-sky, not the chrome.
 * Everything mirrors in RTL via flex + logical utilities.
 */
export function AppHeader() {
  const locale = useLocale();
  const pathname = usePathname();
  const toggleLocale = useHissati((s) => s.toggleLocale);
  const t = ui(locale);

  const nav: { href: string; label: string; icon: LucideIcon }[] = [
    // /results prompts the questionnaire if the profile isn't done yet.
    { href: "/results", label: t.navPlan, icon: Compass },
    // /assistant shows an off-state when no API key is configured.
    { href: "/assistant", label: t.assistant, icon: Sparkles },
    { href: "/questionnaire", label: t.navDetails, icon: UserRound },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-sand-line/70 bg-sand/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={t.appName}
          className="inline-flex shrink-0 items-center rounded-pill leading-none transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Logo variant="lockup" />
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          <nav aria-label={locale === "ar" ? "رئيسي" : "Primary"} className="flex min-w-0 items-center gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill px-2.5 text-sm leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-3",
                    active
                      ? "bg-oasis-100 font-semibold text-oasis"
                      : "font-medium text-ink-soft hover:bg-sand-200 hover:text-ink",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden tb-trim sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Divider sets navigation apart from the language control. */}
          <span className="hidden h-5 w-px bg-sand-line sm:block" aria-hidden />

          <Button
            variant="outline"
            size="sm"
            onClick={toggleLocale}
            aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            className="shrink-0"
          >
            <Languages className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden tb-trim sm:inline">{t.langName}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
