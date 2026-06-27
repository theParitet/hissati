import { XCircle, ArrowDown, CornerDownRight } from "lucide-react";
import { Card, Eyebrow, StatusPill, Money } from "@/components/ui";
import { ui, type Locale } from "@/lib/i18n";

/**
 * The thesis section (judging: Relevance). Contrasts the dead-end every other
 * tool produces with Hissati's cited next step — the product's whole reason to
 * exist, made legible side by side.
 */
export function ProblemInversion({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const ar = locale === "ar";

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="max-w-2xl">
        <Eyebrow>{ar ? "المشكلة الحقيقية" : "The real problem"}</Eyebrow>
        <h2 className="mt-3 text-3xl sm:text-4xl">{ar ? "كل أداة أخرى تتوقف عند «لا»." : 'Every other tool stops at "no."'}</h2>
        <p className="mt-4 text-lg text-ink-soft">
          {ar
            ? "حاسبة صندوق خليفة والقوائم الثابتة تخبر المؤسِّس لأول مرة أنه «غير مؤهّل» — ثم تصمت. حِصّتي تبدأ من تلك النقطة بالذات."
            : 'A single-fund calculator and static lists tell a first-time founder "you don\'t qualify" — then go quiet. Hissati starts exactly there.'}
        </p>
      </div>

      <div className="mt-10 grid items-stretch gap-5 md:grid-cols-[1fr_auto_1fr]">
        {/* The dead-end */}
        <Card className="flex flex-col gap-3 p-6 opacity-90">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            {ar ? "كل أداة أخرى" : "Every other tool"}
          </span>
          <div className="inline-flex items-center gap-2 text-clay">
            <XCircle className="h-6 w-6 shrink-0" aria-hidden />
            <span className="text-xl font-semibold tb-trim">{ar ? "غير مؤهّل." : "You don't qualify."}</span>
          </div>
          <p className="text-sm text-ink-faint">
            {ar ? "نهاية الطريق. لا سبب، ولا خطوة تالية." : "End of the road. No reason, no next step."}
          </p>
        </Card>

        {/* Connector */}
        <div className="flex items-center justify-center text-ink-faint" aria-hidden>
          <ArrowDown className="h-6 w-6 md:hidden" />
          <span className="hidden font-mono text-sm md:inline">{ar ? "←" : "→"}</span>
        </div>

        {/* The cited path */}
        <Card className="flex flex-col gap-3 border-oasis-100 bg-oasis-100/30 p-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-oasis">
            {ar ? "مع حِصّتي" : "With Hissati"}
          </span>
          <StatusPill status="almost" locale={locale} className="w-fit" />
          <p className="text-sm text-ink">
            <span className="font-semibold">{t.blockingRule}: </span>
            {ar ? "تحتاج إلى مشروع مسجّل ومرخّص." : "you need a registered, licensed business."}
          </p>
          <p className="inline-flex items-start gap-2 text-sm text-ink">
            <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-oasis" aria-hidden />
            <span>
              {ar ? "الخطوة التالية: رخصة " : "Next step: a "}
              <span className="font-medium">{ar ? "مبدِعة المنزلية" : "Mobdea home licence"}</span>
              {ar ? " → سجّل → يفتح صندوق خليفة حتى " : " → register → Khalifa Fund opens up to "}
              <Money aed={2_000_000} locale={locale} className="font-medium text-amber-600" />.
            </span>
          </p>
        </Card>
      </div>
    </section>
  );
}
