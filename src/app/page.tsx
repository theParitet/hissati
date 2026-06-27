"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, WifiOff, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Eyebrow } from "@/components/ui";
import { AskBar } from "@/components/AskBar";
import { useHissati, useLocale, isProfileComplete } from "@/lib/store";
import { ui, toLocaleDigits } from "@/lib/i18n";
import { PROGRAMS } from "@/lib/programs";

export default function Home() {
  const router = useRouter();
  const locale = useLocale();
  const t = ui(locale);
  const answers = useHissati((s) => s.answers);
  const hasProgress = isProfileComplete(answers);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const tiers = new Set(PROGRAMS.map((p) => p.tier)).size;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* Hero */}
      <section className="grid items-center gap-10 py-12 sm:py-16 md:grid-cols-[1.15fr_0.85fr] md:py-20">
        <div className="animate-rise">
          <Eyebrow>{t.builtFor}</Eyebrow>
          <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl">{t.heroPromiseTitle}</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">{t.heroLead}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => router.push("/questionnaire")}>
              {hasProgress ? t.continueCta : t.startCta}
              <Arrow className="h-5 w-5" aria-hidden />
            </Button>
            {hasProgress && (
              <Button size="lg" variant="outline" onClick={() => router.push("/results")}>
                {t.seeResults}
              </Button>
            )}
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-soft">
            <li className="inline-flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-oasis" aria-hidden /> <span className="tb-trim">{t.offlineReady}</span>
            </li>
            <li className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-oasis" aria-hidden /> <span className="tb-trim">{t.cited}</span>
            </li>
            <li className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4 text-oasis" aria-hidden />
              <span className="tb-trim">
                {locale === "ar"
                  ? `${toLocaleDigits(PROGRAMS.length, locale)} برنامجاً عبر ${toLocaleDigits(tiers, locale)} فئات`
                  : `${PROGRAMS.length} cited programs · ${tiers} tiers`}
              </span>
            </li>
          </ul>

          {/* Ask the assistant directly — always shown; routes to the /assistant tab. */}
          <div className="mt-9 max-w-xl border-t border-sand-line pt-7">
            <label className="mb-2.5 block text-sm text-ink-soft">{t.askLandingLabel}</label>
            <AskBar />
          </div>
        </div>

        {/* Signature: the sun rising over the dunes — readiness as a desert dawn */}
        <div className="relative hidden md:block" aria-hidden>
          <HeroSun />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-sand-line py-12">
        <ol className="grid gap-6 sm:grid-cols-3">
          {[
            {
              en: "Answer 6 short questions",
              ar: "أجب عن ٦ أسئلة قصيرة",
              sub: { en: "About your business — under a minute.", ar: "عن مشروعك — في أقل من دقيقة." },
            },
            {
              en: "See where you stand",
              ar: "اعرف موقعك",
              sub: {
                en: "Eligible now, almost, or not yet — with the exact blocking rule.",
                ar: "مؤهّل، أو قريب، أو ليس بعد — مع القاعدة المانعة بالضبط.",
              },
            },
            {
              en: "Follow the cited path",
              ar: "اتبع المسار الموثّق",
              sub: {
                en: "A roadmap, a readiness score that climbs, and a downloadable plan.",
                ar: "خارطة طريق، ودرجة جاهزية ترتفع، وخطة قابلة للتنزيل.",
              },
            },
          ].map((step, i) => (
            <li key={i} className="print-block">
              <div className="flex h-9 w-9 items-center justify-center rounded-pill bg-oasis text-sm font-bold leading-none text-sand-100">
                <span className="tb-trim">{toLocaleDigits(i + 1, locale)}</span>
              </div>
              <h3 className="mt-4 text-lg">{locale === "ar" ? step.ar : step.en}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{locale === "ar" ? step.sub.ar : step.sub.en}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function HeroSun() {
  return (
    <svg viewBox="0 0 400 360" className="w-full" role="presentation">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7e6c8" />
          <stop offset="1" stopColor="#f6f1e7" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#D98A1E" stopOpacity="0.5" />
          <stop offset="1" stopColor="#D98A1E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="400" height="360" rx="24" fill="url(#sky)" />
      <circle cx="200" cy="210" r="150" fill="url(#glow)" />
      <circle cx="200" cy="210" r="78" fill="#D98A1E" />
      <path
        d="M-10 250 C 90 200, 160 270, 250 244 C 320 224, 380 262, 410 246 L 410 360 L -10 360 Z"
        fill="#1F7A52"
        opacity="0.92"
      />
      <path
        d="M-10 292 C 110 250, 200 312, 300 286 C 360 270, 400 300, 410 292 L 410 360 L -10 360 Z"
        fill="#14584A"
      />
    </svg>
  );
}
