"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { useLocale } from "@/lib/store";
import { ui } from "@/lib/i18n";

/** Final call to action — re-brands with the full lockup and sends the founder
 *  into the flow (primary) or the assistant (secondary). */
export function ClosingCta() {
  const router = useRouter();
  const locale = useLocale();
  const t = ui(locale);
  const ar = locale === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <section className="mx-auto max-w-5xl px-4 pb-20 pt-4 sm:px-6 sm:pb-24">
      <div className="flex flex-col items-center gap-5 rounded-card border border-oasis-100 bg-oasis-100/30 px-6 py-12 text-center sm:py-14">
        <Logo variant="lockup" />
        <h2 className="max-w-xl text-3xl sm:text-4xl">
          {ar ? "ابدأ رحلتك إلى التمويل" : "Start your path to funding"}
        </h2>
        <p className="max-w-md text-ink-soft">
          {ar ? "ستة أسئلة. مسار موثّق. خطة في يدك." : "Six questions. A cited path. A plan in hand."}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => router.push("/questionnaire")}>
            {t.startCta}
            <Arrow className="h-5 w-5" aria-hidden />
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push("/assistant")}>
            <Sparkles className="h-4 w-4" aria-hidden />
            {ar ? "اسأل المساعد" : "Ask the assistant"}
          </Button>
        </div>
      </div>
    </section>
  );
}
