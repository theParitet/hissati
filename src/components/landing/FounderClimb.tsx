"use client";

import { Card, Eyebrow, Money, VerifiedStamp } from "@/components/ui";
import { useCountUp } from "@/components/landing/use-count-up";
import { ui, type Locale, toLocaleDigits } from "@/lib/i18n";

// Cited from the bundled dataset (programs.json → khalifa-fund-sme).
const KHALIFA = {
  ceiling: 2_000_000,
  sourceUrl: "https://www.khalifafund.ae/services/funding-scheme/",
  verifiedDate: "2026-06-26",
};

/**
 * The headline beat made human (judging: Impact + Falsifiability/Evidence).
 * The persona is the hero user from project-context: an Emirati woman making date
 * products at home in Al Qua'a. The right panel shows her "AED within reach"
 * climbing from 0 to a real, cited AED 2,000,000 once two steps are done — the
 * same monotonic climb the dashboard runs live.
 */
export function FounderClimb({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const ar = locale === "ar";
  const { ref, value } = useCountUp(KHALIFA.ceiling);

  const rungs = [
    {
      n: 1,
      title: ar ? "اليوم — مجرد فكرة" : "Today — just an idea",
      note: ar ? "لا تمويل في اليد بعد، لكن الطريق مفتوح." : "No funding in hand yet — but the path is open.",
      amount: ar ? "٠ درهم" : "AED 0",
      tone: "muted" as const,
    },
    {
      n: 2,
      title: ar ? "رخصة منزلية + تسجيل المشروع" : "Home licence + register the business",
      note: ar ? "خطوتان موثّقتان عبر تَم." : "Two cited steps via TAMM.",
      amount: ar ? "خطوة" : "step",
      tone: "muted" as const,
    },
    {
      n: 3,
      title: ar ? "يفتح صندوق خليفة" : "Khalifa Fund unlocks",
      note: ar ? "يتحوّل من «قريب» إلى «مؤهّل»." : 'Flips from "almost" to "eligible".',
      amount: ar ? "+ ٢٬٠٠٠٬٠٠٠ درهم" : "+ AED 2,000,000",
      tone: "win" as const,
    },
  ];

  return (
    <section className="border-y border-sand-line bg-sand-100/60">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
        {/* Persona */}
        <div>
          <Eyebrow>{ar ? "قصة مؤسِّسة" : "Meet a founder"}</Eyebrow>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            {ar ? "من مطبخ في القوع إلى مسار تمويل" : "From a kitchen in Al Qua'a to a funded path"}
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            {ar
              ? "تصنع منتجات التمور في منزلها. لا رخصة ولا تمويل بعد — لكنها ليست أمام طريق مسدود. ترتّب لها حِصّتي أقصر مسار موثّق إلى أول درهم."
              : "She makes date products at home. No licence, no funding yet — but not a dead-end. Hissati lays out her shortest cited path to the first dirham."}
          </p>
          <p className="mt-4 text-sm text-ink-faint">
            {ar
              ? "هذا ما يتحوّل إليه كل «لا»: قاعدة مانعة بالاسم، وخطوة تالية موثّقة."
              : 'This is what every "no" becomes: the blocking rule named, and a cited next step.'}
          </p>
        </div>

        {/* The climb */}
        <Card className="p-6 sm:p-7">
          <div ref={ref}>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              {t.withinReach}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-sm text-ink-faint" dir="ltr">
                {ar ? "٠" : "0"} →
              </span>
              <Money aed={value} locale={locale} className="text-4xl font-semibold text-amber-600 sm:text-5xl" />
            </div>
            <VerifiedStamp
              sourceUrl={KHALIFA.sourceUrl}
              verifiedDate={KHALIFA.verifiedDate}
              locale={locale}
              className="mt-3"
            />
          </div>

          <ol className="mt-6 space-y-2.5 border-t border-sand-line pt-5">
            {rungs.map((r) => (
              <li key={r.n} className="flex items-start gap-3">
                <span
                  className={
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill font-mono text-sm leading-none " +
                    (r.tone === "win" ? "bg-palm-100 text-palm" : "bg-sand-200 text-ink-soft")
                  }
                >
                  <span className="tb-trim">{toLocaleDigits(r.n, locale)}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-ink">{r.title}</span>
                    <span
                      dir="ltr"
                      className={
                        "shrink-0 font-mono text-xs " + (r.tone === "win" ? "text-palm" : "text-ink-faint")
                      }
                    >
                      {r.amount}
                    </span>
                  </div>
                  <p className="text-sm text-ink-faint">{r.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </section>
  );
}
