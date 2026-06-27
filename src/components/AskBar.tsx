"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/store";
import { useAssistant } from "@/lib/assistant-store";
import { ui } from "@/lib/i18n";

/**
 * One-line "Ask Hissati" prompt (FR-I). Always rendered — a missing key or no
 * network never hides it; it simply routes to /assistant, which explains the
 * off-state there. When the assistant is on, the typed question is seeded so the
 * answer is waiting on arrival.
 *
 * Props are a frozen cross-leaf contract (landing + dashboard consume it):
 *  - `seed`    pre-fill the input (e.g. a suggested question on the landing hero)
 *  - `variant` "hero" reads larger for the landing; "inline" is the compact default
 *  - `className`
 */
export function AskBar({
  seed = "",
  variant = "inline",
  className = "",
}: {
  seed?: string;
  variant?: "hero" | "inline";
  className?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = ui(locale);
  const enabled = useAssistant((s) => s.enabled);
  const checkEnabled = useAssistant((s) => s.checkEnabled);
  const send = useAssistant((s) => s.send);
  const [v, setV] = useState(seed);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const hero = variant === "hero";

  useEffect(() => {
    checkEnabled();
  }, [checkEnabled]);

  function go() {
    const val = v.trim();
    if (val && enabled) void send(val, locale);
    setV("");
    router.push("/assistant");
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-pill border border-sand-line bg-sand-100 shadow-card transition-colors focus-within:border-oasis",
          hero ? "p-2" : "p-1.5"
        )}
      >
        <Sparkles className={cn("ms-2 shrink-0 text-amber", hero ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder={t.askLandingPlaceholder}
          aria-label={t.askLandingLabel}
          className={cn(
            "min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-faint",
            hero ? "h-11 text-base" : "h-9 text-[15px]"
          )}
        />
        <button
          onClick={go}
          aria-label={t.askLandingLabel}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-pill bg-oasis text-sand-100 transition-colors hover:bg-oasis-700",
            hero ? "h-11 w-11" : "h-9 w-9"
          )}
        >
          <Arrow className={hero ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
        </button>
      </div>
    </div>
  );
}
