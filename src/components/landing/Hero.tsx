"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Star, WifiOff, Languages, ShieldCheck } from "lucide-react";
import { Button, Money } from "@/components/ui";
import { AskBar } from "@/components/AskBar";
import { DawnSky } from "@/components/landing/DawnSky";
import { DeviceMockup } from "@/components/landing/DeviceMockup";
import { useHissati, useLocale, useHydrated, isProfileComplete } from "@/lib/store";
import { ui, toLocaleDigits } from "@/lib/i18n";
import { PROGRAMS } from "@/lib/programs";

export function Hero() {
  const router = useRouter();
  const locale = useLocale();
  const hydrated = useHydrated();
  const t = ui(locale);
  const answers = useHissati((s) => s.answers);
  const hasProgress = hydrated && isProfileComplete(answers);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative isolate overflow-hidden">
      <DawnSky className="absolute inset-0 -z-10 h-full w-full" />

      <div className="mx-auto max-w-5xl px-4 pb-32 pt-14 sm:px-6 sm:pb-40 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
          {/* Copy */}
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/85">
              <Star className="h-3.5 w-3.5 fill-amber-100/80 text-amber-100/80" aria-hidden />
              <span className="tb-trim">{t.builtFor}</span>
            </p>

            <h1 className="mt-5 max-w-xl text-4xl leading-[1.06] text-sand-100 sm:text-5xl">
              {t.heroPromiseTitle}
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-sand-200/85">{t.heroLead}</p>

            {/* The one cited claim, as crisp text (the screenshot echoes it). */}
            <div className="mt-6 inline-flex items-center gap-2.5 rounded-pill border border-amber/30 bg-night-700/40 py-1.5 pe-3 ps-3.5 backdrop-blur-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-100/70">
                {t.withinReach}
              </span>
              <Money aed={2_000_000} locale={locale} className="text-base font-semibold text-amber-100" />
              <span className="rounded-full bg-clay-100/80 px-1.5 py-0.5 font-mono text-[10px] leading-none text-clay">
                ✓ {t.cited}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => router.push("/questionnaire")}>
                {hasProgress ? t.continueCta : t.startCta}
                <Arrow className="h-5 w-5" aria-hidden />
              </Button>
              {hasProgress && (
                <Button size="lg" variant="outline" onClick={() => router.push("/results")}>
                  {t.seeMatchesCta}
                </Button>
              )}
            </div>

            {/* Secondary CTA: ask the assistant (routes to /assistant). */}
            <div className="mt-6 max-w-md">
              <label className="mb-2 block text-sm text-sand-200/80">{t.askLandingLabel}</label>
              <AskBar />
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-sand-200/80">
              <li className="inline-flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-amber-100/80" aria-hidden />
                <span className="tb-trim">{t.offlineReady}</span>
              </li>
              <li className="inline-flex items-center gap-2">
                <Languages className="h-4 w-4 text-amber-100/80" aria-hidden />
                <span className="tb-trim">{locale === "ar" ? "عربي أولاً" : "Arabic-first"}</span>
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-100/80" aria-hidden />
                <span className="tb-trim">
                  {locale === "ar"
                    ? `${toLocaleDigits(PROGRAMS.length, locale)} برنامجاً موثّقاً`
                    : `${PROGRAMS.length} cited programs`}
                </span>
              </li>
            </ul>
          </div>

          {/* Product preview: laptop with the phone tucked into the start corner */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <DeviceMockup
              device="laptop"
              src="/screenshots/overview-laptop.png"
              alt={locale === "ar" ? "خطة حِصّتي على الحاسوب" : "Hissati plan on a laptop"}
              priority
            />
            <DeviceMockup
              device="phone"
              src="/screenshots/overview-phone.png"
              alt={locale === "ar" ? "حِصّتي على الهاتف" : "Hissati on a phone"}
              priority
              className="absolute -bottom-8 -start-5 w-[30%] sm:-start-8 sm:w-[28%]"
            />
          </div>
        </div>
      </div>

      {/* The single Al Sadu accent: a woven hem at the horizon. */}
      <div className="sadu-band absolute inset-x-0 bottom-0" />
    </section>
  );
}
