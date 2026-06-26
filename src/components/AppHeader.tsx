"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, WifiOff, LayoutGrid, Pencil } from "lucide-react";
import { useHissati, useLocale, isProfileComplete } from "@/lib/store";
import { ui } from "@/lib/i18n";

export function AppHeader() {
  const locale = useLocale();
  const pathname = usePathname();
  const toggleLocale = useHissati((s) => s.toggleLocale);
  const answers = useHissati((s) => s.answers);
  const t = ui(locale);
  const complete = isProfileComplete(answers);

  return (
    <header className="sticky top-0 z-30 border-b border-sand-line/70 bg-sand/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-baseline gap-2.5">
          <span className="font-display text-2xl font-bold leading-none text-oasis">{t.appName}</span>
          <span className="hidden text-sm text-ink-faint md:inline">{t.tagline}</span>
        </Link>

        <nav className="flex min-w-0 items-center gap-1">
          {complete && (
            <NavLink href="/results" active={pathname === "/results"} icon={<LayoutGrid className="h-4 w-4" aria-hidden />}>
              {t.programs}
            </NavLink>
          )}
          <NavLink
            href="/questionnaire"
            active={pathname === "/questionnaire"}
            icon={<Pencil className="h-4 w-4" aria-hidden />}
          >
            {t.editAnswers}
          </NavLink>

          <span className="ms-1 hidden items-center gap-1.5 rounded-pill bg-sand-200 px-2.5 py-1 text-xs text-ink-soft lg:inline-flex">
            <WifiOff className="h-3.5 w-3.5" aria-hidden />
            {t.offlineReady}
          </span>
          <button
            onClick={toggleLocale}
            className="ms-1 inline-flex shrink-0 items-center gap-2 rounded-pill border border-sand-line bg-sand-100 px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Languages className="h-4 w-4" aria-hidden />
            {t.langName}
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={typeof children === "string" ? children : undefined}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-2 text-sm font-medium transition-colors sm:px-3",
        active ? "bg-oasis-100 text-oasis" : "text-ink-soft hover:bg-sand-200 hover:text-ink",
      ].join(" ")}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
