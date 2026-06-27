"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/store";
import { useAssistant } from "@/lib/assistant-store";
import { ui } from "@/lib/i18n";

/**
 * One-line "Ask Hissati" prompt (FR-I). Always rendered — a missing key or no
 * network never hides it; it simply routes to /assistant, which explains the
 * off-state there. When the assistant is on, the typed question is seeded so the
 * answer is waiting on arrival.
 */
export function AskBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = ui(locale);
  const enabled = useAssistant((s) => s.enabled);
  const checkEnabled = useAssistant((s) => s.checkEnabled);
  const send = useAssistant((s) => s.send);
  const [v, setV] = useState("");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

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
      <div className="flex items-center gap-2 rounded-pill border border-sand-line bg-sand-100 p-1.5 shadow-card transition-colors focus-within:border-oasis">
        <Sparkles className="ms-2 h-4 w-4 shrink-0 text-amber" aria-hidden />
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder={t.askLandingPlaceholder}
          aria-label={t.askLandingLabel}
          className="h-9 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-faint"
        />
        <button
          onClick={go}
          aria-label={t.askLandingLabel}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-oasis text-sand-100 transition-colors hover:bg-oasis-700"
        >
          <Arrow className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
