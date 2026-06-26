"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, ShieldCheck, Loader2 } from "lucide-react";
import { Card } from "@/components/ui";
import { useLocale } from "@/lib/store";

interface Grounding {
  name: string;
  labelEn: string;
  labelAr: string;
}
interface Msg {
  role: "user" | "assistant";
  content: string;
  grounding?: Grounding[];
}

const T = {
  ar: {
    title: "اسأل حِصّتي",
    intro: "مساعد يعتمد على نفس المحرك — كل معلومة موثّقة من البرامج، لا اختراع.",
    placeholder: "مثال: أصنع التمور في المنزل، هل من تمويل؟",
    note: "معلومات لا نصيحة قانونية أو مالية.",
    checked: "تم التحقق",
    error: "المساعد غير متاح الآن — بقية التطبيق تعمل دون اتصال.",
  },
  en: {
    title: "Ask Hissati",
    intro: "Grounded in the same engine — every fact is cited from the programs, nothing invented.",
    placeholder: "e.g. I make dates at home — is there funding?",
    note: "Information, not legal or financial advice.",
    checked: "Checked",
    error: "The assistant is unavailable — the rest of the app works offline.",
  },
};

export function AgentChat() {
  const locale = useLocale();
  const t = T[locale];
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/agent")
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  if (!enabled) return null; // agent OFF by default → the app is unchanged

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMsgs((m) => [
        ...m,
        data.error
          ? { role: "assistant", content: t.error }
          : { role: "assistant", content: data.reply || "…", grounding: data.grounding },
      ]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: t.error }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 no-print">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-sand-line bg-sand-200/50 px-5 py-3">
          <Sparkles className="h-5 w-5 text-amber" aria-hidden />
          <h2 className="text-lg">{t.title}</h2>
        </div>

        <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto px-5 py-4">
          {msgs.length === 0 && <p className="text-sm text-ink-soft">{t.intro}</p>}
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-end" : "text-start"}>
              <div
                className={[
                  "inline-block max-w-[85%] whitespace-pre-wrap rounded-card px-3.5 py-2 text-sm",
                  m.role === "user" ? "bg-oasis text-sand-100" : "bg-sand-200 text-ink",
                ].join(" ")}
              >
                {m.content}
              </div>
              {m.grounding && m.grounding.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.grounding.map((g, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1 rounded-pill bg-palm-100 px-2 py-0.5 text-xs text-palm"
                    >
                      <ShieldCheck className="h-3 w-3" aria-hidden />
                      {t.checked}: {locale === "ar" ? g.labelAr : g.labelEn}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="inline-flex items-center gap-2 rounded-card bg-sand-200 px-3.5 py-2 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            </div>
          )}
        </div>

        <div className="border-t border-sand-line px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t.placeholder}
              className="h-11 flex-1 rounded-pill border border-sand-line bg-sand-100 px-4 text-[15px] outline-none focus-visible:border-oasis"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-oasis text-sand-100 transition-colors hover:bg-oasis-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-faint">{t.note}</p>
        </div>
      </Card>
    </section>
  );
}
