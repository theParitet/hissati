"use client";

/**
 * The signature section: a scroll-SCRUBBED chain of the founder's funding path.
 *
 * As the visitor scrolls, each link of the chain ignites in turn (its glow tracks
 * the scroll position, both ways), and a mono "AED within reach" ledger climbs in
 * lockstep — easing through the engine's real per-rung numbers up to Khalifa Fund's
 * cited AED 2,000,000 when the MVP rung lights. The visitor performs the climb.
 *
 * Reduced motion: useScrollProgress returns 1, so the whole chain is lit and the
 * ledger reads the final AED immediately — no scroll dependency.
 */
import { Check, Wallet, Sparkle } from "lucide-react";
import { Money, VerifiedStamp } from "@/components/ui";
import { useScrollProgress } from "@/components/landing/use-scroll-progress";
import { RUNGS, KHALIFA, statsFor, DEMO_PROFILES } from "@/components/landing/demo";
import { ui, toLocaleDigits, pick, type Locale } from "@/lib/i18n";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const FUNDING_TOTAL = statsFor(DEMO_PROFILES.MVP).programsTotal;

export function FounderChain({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const ar = locale === "ar";
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  const n = RUNGS.length;
  const seg = progress * (n - 1); // 0 → n-1
  const i = Math.max(0, Math.min(n - 2, Math.floor(seg)));
  const f = seg - i;

  const aed = Math.round(lerp(RUNGS[i].aed, RUNGS[i + 1].aed, f));
  const eligible = Math.round(lerp(RUNGS[i].eligible, RUNGS[i + 1].eligible, f));
  const litFrac = (k: number) => clamp01(seg - k + 1); // 0..1 ignition of rung k

  const renderLedger = (compact = false) => (
    <div
      className="relative isolate overflow-hidden rounded-card border border-night-100/60 bg-night p-5 shadow-lift sm:p-6"
      style={{
        backgroundImage:
          "radial-gradient(120% 90% at 50% 120%, rgba(217,138,30,0.20), transparent 60%)",
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-100/70">
        {t.withinReach}
      </p>
      <Money
        aed={aed}
        locale={locale}
        className={`mt-1 block whitespace-nowrap font-semibold text-amber-100 ${compact ? "text-2xl" : "text-4xl"}`}
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <VerifiedStamp
          sourceUrl={KHALIFA.sourceUrl}
          verifiedDate={KHALIFA.verifiedDate}
          confidence={KHALIFA.confidence}
          locale={locale}
        />
        <span className="font-mono text-[11px] text-sand-100/60" dir="ltr">
          {toLocaleDigits(eligible, locale)}/{toLocaleDigits(FUNDING_TOTAL, locale)}{" "}
          {ar ? "مؤهَّل" : "eligible"}
        </span>
      </div>

      {/* Scroll-scrubbed progress rail. */}
      <div className="mt-4 h-1.5 overflow-hidden rounded-pill bg-night-100/70">
        <div
          className="h-full rounded-pill bg-gradient-to-r from-amber to-amber-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {!compact && (
        <p className="mt-3 text-xs leading-relaxed text-sand-100/55">
          {ar
            ? "كل برنامج يضيء حين تنجز خطوته الموثّقة — لا تشتّت بين البوابات."
            : "Each program lights as its cited step is done — no scattering across portals."}
        </p>
      )}
    </div>
  );

  return (
    <section ref={ref} className="relative border-t border-sand-line bg-sand-100/50">
      {/* Mobile ledger — pinned under the header while the chain scrolls. */}
      <div className="sticky top-16 z-20 px-4 pt-4 lg:hidden">
        {renderLedger(true)}
      </div>

      <div className="mx-auto grid max-w-6xl gap-x-12 px-4 sm:px-6 lg:grid-cols-[1fr_22rem]">
        {/* The chain */}
        <div className="relative py-16 sm:py-20">
          <header className="mb-4 max-w-md ps-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
              {ar ? "قصة مؤسِّسة" : "Meet a founder"}
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl">
              {ar ? "من مطبخ في القوع إلى مسار مموَّل" : "From a kitchen in Al Qua'a to a funded path"}
            </h2>
          </header>

          {/* Vertical spine: a track + a fill that follows the scroll. It spans the
              full section and fades at both ends, so it reads as coming from under
              the section above and continuing under the one below. */}
          <div
            className="absolute -bottom-16 -top-16 w-0.5 bg-sand-line sm:-bottom-20 sm:-top-20"
            style={{
              insetInlineStart: "calc(1rem - 1px)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, #000 6%, #000 94%, transparent)",
              maskImage:
                "linear-gradient(to bottom, transparent, #000 6%, #000 94%, transparent)",
            }}
            aria-hidden
          >
            <div
              className="w-full bg-gradient-to-b from-amber to-palm"
              style={{ height: `${progress * 100}%` }}
            />
          </div>

          <ol className="relative space-y-4">
            {RUNGS.map((r, k) => {
              const lit = litFrac(k);
              const on = lit > 0.55;
              const igniting = lit > 0.05 && lit < 0.95;
              return (
                <li
                  key={k}
                  className="flex min-h-[46vh] items-center gap-4 sm:min-h-[52vh]"
                  style={{ opacity: 0.32 + 0.68 * lit, transition: "opacity 200ms linear" }}
                >
                  {/* Node on the spine */}
                  <span
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm leading-none transition-colors duration-300 ${
                      r.win && on
                        ? "border-palm bg-palm text-sand-100"
                        : on
                          ? "border-amber bg-amber-100 text-amber-600"
                          : "border-sand-line bg-sand-100 text-ink-faint"
                    }`}
                    style={
                      on
                        ? {
                            boxShadow: r.win
                              ? "0 0 0 5px rgba(31,122,82,0.18)"
                              : "0 0 0 5px rgba(217,138,30,0.16)",
                          }
                        : undefined
                    }
                  >
                    {r.win && on ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <span className="tb-trim">{toLocaleDigits(k + 1, locale)}</span>
                    )}
                    {igniting && (
                      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-amber/40" />
                    )}
                  </span>

                  {/* Rung card */}
                  <div
                    className={`min-w-0 flex-1 rounded-card border p-4 shadow-card transition-colors duration-300 sm:p-5 ${
                      r.win && on
                        ? "border-palm-100 bg-palm-100/40"
                        : "border-sand-line bg-sand-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-ink sm:text-lg">
                        {pick(r.title, locale)}
                      </h3>
                      <span
                        dir="ltr"
                        className={`shrink-0 font-mono text-xs leading-none ${
                          r.win ? "text-palm" : "text-ink-faint"
                        }`}
                      >
                        {r.win ? (
                          <>+ <Money aed={KHALIFA.ceiling} locale={locale} prefix={false} /></>
                        ) : k === 1 ? (
                          <span className="inline-flex items-center gap-1">
                            <Wallet className="h-3 w-3" aria-hidden /> {t.youPay}
                          </span>
                        ) : r.eligible > 0 ? (
                          <span>
                            {toLocaleDigits(r.eligible, locale)} {ar ? "مؤهَّل" : "eligible"}
                          </span>
                        ) : (
                          <span>{ar ? "٠ درهم" : "AED 0"}</span>
                        )}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                      {pick(r.note, locale)}
                    </p>
                    {r.win && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-palm">
                        <Sparkle className="h-3.5 w-3.5" aria-hidden />
                        {ar ? "ضمن متناولك الآن" : "Within reach now"}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Desktop ledger — pinned beside the chain. */}
        <div className="hidden lg:block">
          <div className="sticky top-24 py-20">
            {renderLedger()}
          </div>
        </div>
      </div>
    </section>
  );
}
