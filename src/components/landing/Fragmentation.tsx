"use client";

/**
 * The real problem, made legible: UAE funding is scattered across many portals.
 * Hissati's job is to TIE THEM TOGETHER — one match, one checklist, no dead-ends.
 * Left: the scatter (real portals as disconnected chips). Right: the one place.
 */
import { Layers, ListChecks, CornerDownRight, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui";
import { scatteredSources } from "@/components/landing/demo";
import { type Locale } from "@/lib/i18n";

export function Fragmentation({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const sources = scatteredSources(locale);

  // Deterministic, gentle scatter (no randomness → no hydration drift).
  const tilts = [-5, 3, -2, 4, -4, 2, -3, 5];

  const ties: { icon: React.ReactNode; title: string; body: string }[] = [
    {
      icon: <Layers className="h-4 w-4 text-oasis" aria-hidden />,
      title: ar ? "مطابقة واحدة" : "One match",
      body: ar
        ? "كل البرامج تُقاس على ملفك دفعةً واحدة: مؤهَّل، قريب، أو غير مناسب."
        : "Every program scored against your profile at once: eligible, almost, or not a fit.",
    },
    {
      icon: <ListChecks className="h-4 w-4 text-oasis" aria-hidden />,
      title: ar ? "قائمة واحدة" : "One checklist",
      body: ar
        ? "المستندات والخطوات في مكان واحد قابل للتتبّع — لا تنقّل بين البوابات."
        : "Documents and steps in one trackable place — no hopping between portals.",
    },
    {
      icon: <CornerDownRight className="h-4 w-4 text-oasis" aria-hidden />,
      title: ar ? "لا طريق مسدود" : "No dead-ends",
      body: ar
        ? "كل «لا» يحمل القاعدة المانعة بالاسم وخطوة تالية موثّقة بمصدرها."
        : "Every “no” names the blocking rule and a cited next step with its source.",
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
          {ar ? "المشكلة الحقيقية" : "The real problem"}
        </p>
        <h2 className="mt-2 text-3xl sm:text-4xl">
          {ar ? "التمويل مبعثر. المسار غير واضح." : "Funding is scattered. The path isn't obvious."}
        </h2>
        <p className="mt-3 text-lg text-ink-soft">
          {ar
            ? "لكل جهة بوابتها وقواعدها. مؤسِّس لأول مرة لا يرى ما يؤهَّل له ولا ما عليه فعله. حِصّتي تربطها كلها."
            : "Each authority has its own portal and rules. A first-time founder can't see what they qualify for, or what to do. Hissati ties it all together."}
        </p>
      </div>

      <div className="mt-10 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        {/* The scatter */}
        <div className="flex flex-wrap content-center gap-2.5 rounded-card border border-dashed border-sand-line bg-sand-200/30 p-5 sm:min-h-44">
          {sources.map((s, i) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1.5 rounded-pill border border-sand-line bg-sand-100 px-3 py-1.5 text-sm text-ink-soft shadow-card"
              style={{ transform: `rotate(${tilts[i % tilts.length]}deg)` }}
            >
              <span className="font-medium text-ink">{s.name}</span>
              <span className="font-mono text-[10px] text-ink-faint">{s.kind}</span>
            </span>
          ))}
        </div>

        {/* Connector */}
        <div className="flex items-center justify-center text-ink-faint" aria-hidden>
          <ArrowDown className="h-6 w-6 md:hidden" />
          <span className="hidden font-mono text-lg md:inline">{ar ? "←" : "→"}</span>
        </div>

        {/* The one place */}
        <Card className="border-oasis-100 bg-oasis-100/30 p-5 sm:min-h-44">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-oasis">
            {ar ? "مكان واحد" : "One place"}
          </p>
          <ul className="mt-3 space-y-3">
            {ties.map((tie) => (
              <li key={tie.title} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-sand-100">
                  {tie.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{tie.title}</p>
                  <p className="text-sm text-ink-soft">{tie.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
