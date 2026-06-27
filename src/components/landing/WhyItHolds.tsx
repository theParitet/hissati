import { WifiOff, Languages, BadgeCheck, Globe } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui";
import { type Locale } from "@/lib/i18n";

/** Four pillars, each tagged with the judging criterion it answers — so the
 *  rubric is legible at a glance. The tag encodes a true fact (which criterion a
 *  feature proves), not decoration. */
export function WhyItHolds({ locale }: { locale: Locale }) {
  const ar = locale === "ar";

  const pillars = [
    {
      icon: WifiOff,
      crit: ar ? "الجدوى" : "Feasibility",
      title: ar ? "يعمل دون اتصال" : "Offline-first",
      desc: ar
        ? "المسار كامل في وضع الطيران — مصمَّم لضعف التغطية في القوع."
        : "The whole flow runs in airplane mode — built for Al Qua'a's weak connectivity.",
    },
    {
      icon: Languages,
      crit: ar ? "الملاءمة" : "Relevance",
      title: ar ? "العربية أولاً" : "Arabic-first",
      desc: ar
        ? "واجهة عربية كاملة من اليمين لليسار، والإنجليزية بنقرة."
        : "Full right-to-left Arabic, English one tap away.",
    },
    {
      icon: BadgeCheck,
      crit: ar ? "الأدلة" : "Evidence",
      title: ar ? "كل رقم موثّق" : "Every figure cited",
      desc: ar
        ? "كل مبلغ وقاعدة يعرض مصدره الرسمي وتاريخ التحقق — لا أرقام مخترعة."
        : "Each amount and rule shows its official source and verified date — nothing invented.",
    },
    {
      icon: Globe,
      crit: ar ? "قابلية التوسّع" : "Scalability",
      title: ar ? "يتوسّع عبر الإمارات" : "Scales across the UAE",
      desc: ar
        ? "بدّل القواعد لكل إمارة — المحرّك نفسه، بيانات جديدة."
        : "Swap the rules per emirate — same engine, new data.",
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <Eyebrow>{ar ? "لماذا تصمد" : "Why it holds up"}</Eyebrow>
      <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">
        {ar ? "مبنيّة لهذا المكان، ومُثبتة بالأدلة" : "Built for this place, proven with evidence"}
      </h2>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p) => (
          <Card key={p.title} className="flex flex-col gap-3 p-5">
            <p.icon className="h-6 w-6 text-oasis" aria-hidden />
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-600">{p.crit}</span>
              <h3 className="text-lg leading-tight">{p.title}</h3>
            </div>
            <p className="text-sm text-ink-soft">{p.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
