"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Star, WifiOff, Languages, ShieldCheck } from "lucide-react";
import { Button, Money } from "@/components/ui";
import { AskBar } from "@/components/AskBar";
import { DawnSky } from "@/components/landing/DawnSky";
import { FundingSky } from "@/components/dashboard/FundingSky";
import { fundingStars, statsFor, DEMO_PROFILES } from "@/components/landing/demo";
import { useHissati, useLocale, useHydrated, isProfileComplete } from "@/lib/store";
import { ui, toLocaleDigits } from "@/lib/i18n";
import { PROGRAMS } from "@/lib/programs";

/**
 * Hero / thesis. The real problem is FRAGMENTATION: UAE funding is scattered across
 * a dozen portals, so a first-time founder can't see what they qualify for or track
 * what to do. Hissati ties it into one place — one matched, cited, trackable plan.
 * The visual is the live "funding sky": every program a star, in one constellation.
 */
export function Hero() {
  const router = useRouter();
  const locale = useLocale();
  const hydrated = useHydrated();
  const t = ui(locale);
  const ar = locale === "ar";
  const answers = useHissati((s) => s.answers);
  const hasProgress = hydrated && isProfileComplete(answers);
  const Arrow = ar ? ArrowLeft : ArrowRight;

  const stars = fundingStars(DEMO_PROFILES.MVP);
  const skyStats = statsFor(DEMO_PROFILES.MVP);

  return (
    <section className="relative isolate overflow-hidden">
      <DawnSky className="absolute inset-0 -z-10 h-full w-full" />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-14 sm:px-6 sm:pb-36 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Copy */}
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/85">
              <Star className="h-3.5 w-3.5 fill-amber-100/80 text-amber-100/80" aria-hidden />
              <span className="tb-trim">{t.builtFor}</span>
            </p>

            <h1 className="mt-5 max-w-xl text-4xl leading-[1.05] text-sand-100 sm:text-5xl">
              {ar ? (
                <>
                  كل تمويل إماراتي.
                  <br />
                  خطة واحدة يمكنك <span className="text-amber-100">تتبّعها</span>.
                </>
              ) : (
                <>
                  Every UAE fund.
                  <br />
                  One plan you can <span className="text-amber-100">actually track</span>.
                </>
              )}
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-sand-200/85">
              {ar
                ? "المنح والقروض والمسرّعات مبعثرة بين صندوق خليفة، ومَعاً، وأبوظبي للاقتصاد، وتَم، وHub71. تجمعها حِصّتي في مكان واحد — تطابق ما أنت مؤهَّل له، وتحوّل كل «لا» إلى خطوة موثّقة في قائمة واحدة."
                : "Grants, loans and accelerators are scattered across Khalifa Fund, Ma'an, ADDED, TAMM and Hub71. Hissati ties them into one place — matches what you qualify for, and turns every “no” into a cited next step on one checklist."}
            </p>

            {/* The one cited claim, in the ledger voice. */}
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

            {/* Secondary CTA: ask the assistant. */}
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
                <span className="tb-trim">{ar ? "عربي أولاً" : "Arabic-first"}</span>
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-100/80" aria-hidden />
                <span className="tb-trim">
                  {ar
                    ? `${toLocaleDigits(PROGRAMS.length, locale)} برنامجاً موثّقاً`
                    : `${PROGRAMS.length} cited programs`}
                </span>
              </li>
            </ul>
          </div>

          {/* The live funding sky — the product's signature surface, embedded. */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <FundingSky
              stars={stars}
              locale={locale}
              aedReachableNow={skyStats.aedReachableNow}
              hasOpenEnded={skyStats.hasOpenEndedAmounts}
              className="rounded-card border border-amber/20 shadow-lift"
            />
          </div>
        </div>
      </div>

      {/* The single Al Sadu accent: a woven hem at the horizon. */}
      <div className="sadu-band absolute inset-x-0 bottom-0" />
    </section>
  );
}
