import { Eyebrow } from "@/components/ui";
import { ui, type Locale, toLocaleDigits } from "@/lib/i18n";

/** The flow in three real, ordered steps (judging: Readiness). Numbered because
 *  the order is the product — answer, then see, then act. */
export function HowItWorks({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const ar = locale === "ar";

  const steps = [
    {
      title: ar ? "أجب عن ٦ أسئلة قصيرة" : "Answer 6 short questions",
      sub: ar ? "عن مشروعك — في أقل من دقيقة." : "About your business — under a minute.",
    },
    {
      title: ar ? "اعرف موقعك" : "See where you stand",
      sub: ar
        ? "مؤهّل، أو قريب، أو ليس بعد — مع القاعدة المانعة بالضبط."
        : "Eligible, almost, or not yet — with the exact blocking rule.",
    },
    {
      title: ar ? "اتبع المسار الموثّق" : "Follow the cited path",
      sub: ar
        ? "خارطة طريق، ومبلغ «ضمن متناولك» يرتفع، وخطة قابلة للتنزيل."
        : "A roadmap, an AED-within-reach total that climbs, and a downloadable plan.",
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <Eyebrow>{ar ? "كيف تعمل" : "How it works"}</Eyebrow>
      <h2 className="mt-3 text-3xl sm:text-4xl">{ar ? "ثلاث خطوات إلى مسارك" : "Three steps to your path"}</h2>

      <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={i} className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-pill bg-oasis font-mono text-base font-semibold leading-none text-sand-100">
              <span className="tb-trim">{toLocaleDigits(i + 1, locale)}</span>
            </div>
            <h3 className="mt-4 text-lg">{s.title}</h3>
            <p className="mt-1.5 text-sm text-ink-soft">{s.sub}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
