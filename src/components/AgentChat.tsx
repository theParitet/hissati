"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, ShieldCheck, Loader2, PowerOff } from "lucide-react";
import { Card } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { ProgramCard } from "@/components/ProgramCard";
import { ChecklistDialog } from "@/components/ChecklistDialog";
import { useHissati, useLocale, effectiveProfile, isProfileComplete } from "@/lib/store";
import { getProgramById } from "@/lib/programs";
import { evaluateProgramFull } from "@/lib/engine";
import { matchScore } from "@/lib/scoring";
import type { Profile } from "@/lib/schema";

interface Grounding {
  name: string;
  labelEn: string;
  labelAr: string;
}
interface Msg {
  role: "user" | "assistant";
  content: string;
  grounding?: Grounding[];
  programIds?: string[];
}

const T = {
  ar: {
    title: "اسأل حِصّتي",
    intro: "مساعد يعتمد على نفس المحرك — كل معلومة موثّقة من البرامج، لا اختراع.",
    placeholder: "مثال: أصنع التمور في المنزل، هل من تمويل؟",
    placeholderOff: "المساعد غير متاح حالياً",
    note: "معلومات لا نصيحة قانونية أو مالية.",
    checked: "تم التحقق",
    error: "المساعد غير متاح الآن — بقية التطبيق تعمل دون اتصال.",
    off: "غير مُفعّل",
    offNote:
      "المساعد ميزة اختيارية ومُطفأة حالياً. كل شيء آخر في حِصّتي — المطابقة، والخطوات، وخطة الـPDF — يعمل دون اتصال وبدونه.",
    starters: [
      "ما التمويل الذي يمكنني الحصول عليه؟",
      "ما خطوتي الأولى للتأهّل؟",
      "أصنع التمور في المنزل، هل من منح؟",
    ],
  },
  en: {
    title: "Ask Hissati",
    intro: "Grounded in the same engine — every fact is cited from the programs, nothing invented.",
    placeholder: "e.g. I make dates at home — is there funding?",
    placeholderOff: "Assistant is currently unavailable",
    note: "Information, not legal or financial advice.",
    checked: "Checked",
    error: "The assistant is unavailable — the rest of the app works offline.",
    off: "Off",
    offNote:
      "The assistant is an optional add-on and currently off. Everything else in Hissati — matching, steps, and the PDF plan — works offline without it.",
    starters: ["What funding can I get?", "What's my first step to qualify?", "I make dates at home — any grants?"],
  },
};

export function AgentChat() {
  const locale = useLocale();
  const t = T[locale];
  const answers = useHissati((s) => s.answers);
  const doneSteps = useHissati((s) => s.doneSteps);
  const complete = isProfileComplete(answers);
  const profile = effectiveProfile(answers, doneSteps) as Profile;

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [checklistId, setChecklistId] = useState<string | null>(null);
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

  if (enabled === null) return null; // brief — while we check availability

  const off = !enabled;
  const checklistProgram = checklistId ? getProgramById(checklistId) : undefined;

  async function send(textArg?: string) {
    if (off) return;
    const text = (textArg ?? input).trim();
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
          : { role: "assistant", content: data.reply || "…", grounding: data.grounding, programIds: data.programIds },
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
          <Sparkles className={off ? "h-5 w-5 text-ink-faint" : "h-5 w-5 text-amber"} aria-hidden />
          <h2 className="text-lg">{t.title}</h2>
          {off && (
            <span className="ms-auto inline-flex items-center gap-1 rounded-pill bg-sand-200 px-2.5 py-1 text-xs text-ink-faint">
              <PowerOff className="h-3 w-3" aria-hidden />
              {t.off}
            </span>
          )}
        </div>

        {off ? (
          <div className="px-5 py-6 text-sm text-ink-soft">{t.offNote}</div>
        ) : (
          <div ref={scrollRef} className="min-h-[18rem] max-h-[34rem] space-y-4 overflow-y-auto px-5 py-4">
            {msgs.length === 0 && (
              <div>
                <p className="text-sm text-ink-soft">{t.intro}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.starters.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      className="rounded-pill border border-sand-line bg-sand-100 px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-oasis/40 hover:text-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-end" : "text-start"}>
                {m.role === "user" ? (
                  <div className="inline-block max-w-[85%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-card bg-oasis px-3.5 py-2 text-sm text-sand-100">
                    {m.content}
                  </div>
                ) : (
                  <div className="block w-fit max-w-[92%] rounded-card bg-sand-200 px-3.5 py-2.5 text-ink [&_*]:break-words">
                    <Markdown>{m.content}</Markdown>
                  </div>
                )}

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

                {/* Inline structured result — real ProgramCards from the SAME engine (FR-I, items 5/12) */}
                {m.role === "assistant" && m.programIds && m.programIds.length > 0 && complete && (
                  <div className="mt-3 grid gap-3">
                    {m.programIds.map((id) => {
                      const program = getProgramById(id);
                      if (!program) return null;
                      const ev = evaluateProgramFull(profile, program);
                      const pct = matchScore(profile, program, ev.status, ev.rules);
                      return (
                        <ProgramCard
                          key={id}
                          ev={ev}
                          profile={profile}
                          matchPct={pct}
                          locale={locale}
                          onOpenChecklist={setChecklistId}
                        />
                      );
                    })}
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
        )}

        <div className="border-t border-sand-line px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={off ? t.placeholderOff : t.placeholder}
              disabled={off || loading}
              aria-disabled={off}
              className="h-11 flex-1 rounded-pill border border-sand-line bg-sand-100 px-4 text-[15px] outline-none focus-visible:border-oasis disabled:cursor-not-allowed disabled:border-sand-line disabled:bg-sand-200/60 disabled:text-ink-faint"
            />
            <button
              onClick={() => send()}
              disabled={off || loading || !input.trim()}
              aria-label="Send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-oasis text-sand-100 transition-colors hover:bg-oasis-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {!off && <p className="mt-2 text-xs text-ink-faint">{t.note}</p>}
        </div>
      </Card>

      {checklistProgram && (
        <ChecklistDialog
          program={checklistProgram}
          profile={profile}
          locale={locale}
          onClose={() => setChecklistId(null)}
        />
      )}
    </section>
  );
}
