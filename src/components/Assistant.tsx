"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, ShieldCheck, Loader2, PowerOff } from "lucide-react";
import { Card } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { ProgramCard } from "@/components/ProgramCard";
import { ChecklistDialog } from "@/components/ChecklistDialog";
import { CompareView } from "@/components/CompareView";
import { ProfileForm } from "@/components/ProfileForm";
import { useHissati, useLocale, effectiveProfile, isProfileComplete } from "@/lib/store";
import { useAssistant } from "@/lib/assistant-store";
import { getProgramById } from "@/lib/programs";
import { evaluateProgramFull } from "@/lib/engine";
import { buildComparison } from "@/lib/compare";
import { ui, enumLabel } from "@/lib/i18n";
import type { Profile } from "@/lib/schema";

const T = {
  ar: {
    title: "اسأل حِصّتي",
    intro: "مساعد يعتمد على نفس المحرك — كل معلومة موثّقة من البرامج، لا اختراع.",
    placeholder: "مثال: أصنع التمور في المنزل، هل من تمويل؟",
    placeholderOff: "المساعد غير متاح حالياً",
    note: "معلومات لا نصيحة قانونية أو مالية.",
    checked: "تم التحقق",
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
    off: "Off",
    offNote:
      "The assistant is an optional add-on and currently off. Everything else in Hissati — matching, steps, and the PDF plan — works offline without it.",
    starters: ["What funding can I get?", "What's my first step to qualify?", "I make dates at home — any grants?"],
  },
};

export function Assistant({ variant = "embedded" }: { variant?: "embedded" | "page" }) {
  const locale = useLocale();
  const t = T[locale];
  const answers = useHissati((s) => s.answers);
  const doneSteps = useHissati((s) => s.doneSteps);
  const setAnswer = useHissati((s) => s.setAnswer);
  const complete = isProfileComplete(answers);
  const profile = effectiveProfile(answers, doneSteps) as Profile;
  const uiT = ui(locale);

  const enabled = useAssistant((s) => s.enabled);
  const messages = useAssistant((s) => s.messages);
  const loading = useAssistant((s) => s.loading);
  const checkEnabled = useAssistant((s) => s.checkEnabled);
  const send = useAssistant((s) => s.send);

  const [input, setInput] = useState("");
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [formDone, setFormDone] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPage = variant === "page";

  useEffect(() => {
    checkEnabled();
  }, [checkEnabled]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (enabled === null && !isPage) return null; // embedded: stay quiet until we know

  const off = enabled === false;
  const empty = messages.length === 0;
  const checklistProgram = checklistId ? getProgramById(checklistId) : undefined;

  function submit(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    setInput("");
    void send(value, locale);
  }

  // Form submit (item 11): persist the answers to the store (helps the whole app),
  // then re-ask with a confirmation — send() now seeds the fuller profile.
  function handleFormSubmit(idx: number, patch: Partial<Profile>) {
    setFormDone((s) => new Set(s).add(idx));
    setAnswer(patch);
    const parts = Object.entries(patch).map(([k, v]) =>
      typeof v === "boolean" ? (v ? uiT.yes : uiT.no) : enumLabel(k, String(v), locale)
    );
    void send(`${uiT.myDetails} ${parts.join(locale === "ar" ? "، " : ", ")}`, locale);
  }

  const starters = (centered: boolean) => (
    <div className={"flex flex-wrap gap-2 " + (centered ? "justify-center" : "")}>
      {t.starters.map((s, i) => (
        <button
          key={i}
          onClick={() => submit(s)}
          className="inline-flex h-9 items-center rounded-pill border border-sand-line bg-sand-100 px-3 text-xs leading-none text-ink-soft transition-colors hover:border-oasis/40 hover:text-ink"
        >
          <span className="tb-trim">{s}</span>
        </button>
      ))}
    </div>
  );

  // The message bubbles + inline structured results — shared by both variants.
  const conversation = (
    <>
      {messages.map((m, i) => (
        <div key={i} className={m.role === "user" ? "text-end" : "text-start"}>
          {m.role === "user" ? (
            <div className="inline-block max-w-[85%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-card bg-oasis px-3.5 py-2 text-sm text-sand-100">
              {m.content}
            </div>
          ) : m.content ? (
            <div className="block w-fit max-w-[92%] rounded-card bg-sand-200 px-3.5 py-2.5 text-ink [&_*]:break-words">
              <Markdown>{m.content}</Markdown>
            </div>
          ) : null}

          {m.grounding && m.grounding.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {m.grounding.map((g, j) => (
                <span
                  key={j}
                  className="inline-flex items-center gap-1 rounded-pill bg-palm-100 px-2 py-0.5 text-xs text-palm"
                >
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  <span className="tb-trim">{t.checked}: {locale === "ar" ? g.labelAr : g.labelEn}</span>
                </span>
              ))}
            </div>
          )}

          {/* Inline structured result — real ProgramCards from the SAME engine */}
          {m.role === "assistant" && m.programIds && m.programIds.length > 0 && complete && (
            <div className="mt-3 grid gap-3">
              {m.programIds.map((id) => {
                const program = getProgramById(id);
                if (!program) return null;
                const ev = evaluateProgramFull(profile, program);
                return (
                  <ProgramCard
                    key={id}
                    ev={ev}
                    profile={profile}
                    locale={locale}
                    onOpenChecklist={setChecklistId}
                  />
                );
              })}
            </div>
          )}

          {/* Inline compare table — same CompareView as /results */}
          {m.role === "assistant" && m.compareIds && m.compareIds.length >= 2 && complete && (
            <div className="mt-3 rounded-card border border-sand-line bg-sand-100 p-3">
              <CompareView
                rows={buildComparison(
                  profile,
                  m.compareIds
                    .map((id) => getProgramById(id))
                    .filter((p): p is NonNullable<typeof p> => Boolean(p))
                    .map((p) => evaluateProgramFull(profile, p))
                )}
                locale={locale}
                onOpenChecklist={setChecklistId}
              />
            </div>
          )}

          {/* collect_profile form — tap to answer; the founder can also just type */}
          {m.role === "assistant" && m.form && m.form.fields.length > 0 && !formDone.has(i) && (
            <ProfileForm
              fields={m.form.fields}
              reason={m.form.reason}
              locale={locale}
              onSubmit={(patch) => handleFormSubmit(i, patch)}
            />
          )}
        </div>
      ))}

      {loading && (
        <div className="inline-flex items-center gap-2 rounded-card bg-sand-200 px-3.5 py-2 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        </div>
      )}
    </>
  );

  /* ---------------------------------------------------------------------- */
  /* Page variant — chat only, full-bleed, with a floating centered input.  */
  /* ---------------------------------------------------------------------- */
  if (isPage) {
    return (
      <>
        <div className="flex h-full flex-col">
          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div
              className={
                "mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 " +
                (off || empty ? "items-center justify-center text-center" : "space-y-4")
              }
            >
              {off ? (
                <div className="max-w-md">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-pill bg-sand-200 text-ink-faint">
                    <PowerOff className="h-6 w-6" aria-hidden />
                  </div>
                  <h2 className="text-lg">{t.title}</h2>
                  <p className="mt-2 text-sm text-ink-soft">{t.offNote}</p>
                </div>
              ) : empty ? (
                <div className="max-w-md">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-amber/15 text-amber">
                    <Sparkles className="h-6 w-6" aria-hidden />
                  </div>
                  <h2 className="text-xl">{t.title}</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{t.intro}</p>
                  <div className="mt-5">{starters(true)}</div>
                </div>
              ) : (
                conversation
              )}
            </div>
          </div>

          {/* Floating, centered composer — not edge-to-edge. */}
          {!off && (
            <div className="mx-auto w-full max-w-2xl px-4 pb-5">
              <div className="flex items-center gap-2 rounded-pill border border-sand-line bg-sand-100 p-2 shadow-lift">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={t.placeholder}
                  disabled={loading}
                  className="h-9 flex-1 bg-transparent px-3 text-[15px] outline-none placeholder:text-ink-faint"
                />
                <button
                  onClick={() => submit()}
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-oasis text-sand-100 transition-colors hover:bg-oasis-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-ink-faint">{t.note}</p>
            </div>
          )}
        </div>

        {checklistProgram && (
          <ChecklistDialog
            program={checklistProgram}
            profile={profile}
            locale={locale}
            onClose={() => setChecklistId(null)}
          />
        )}
      </>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Embedded variant — the card that sits at the top of /results.          */
  /* ---------------------------------------------------------------------- */
  const card = (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-sand-line bg-sand-200/50 px-5 py-3">
        <Sparkles className={off ? "h-5 w-5 text-ink-faint" : "h-5 w-5 text-amber"} aria-hidden />
        <h2 className="text-lg">{t.title}</h2>
        {off && (
          <span className="ms-auto inline-flex h-7 items-center gap-1 rounded-pill bg-sand-200 px-2.5 text-xs leading-none text-ink-faint">
            <PowerOff className="h-3 w-3" aria-hidden />
            <span className="tb-trim">{t.off}</span>
          </span>
        )}
      </div>

      {off ? (
        <div className="px-5 py-6 text-sm text-ink-soft">{t.offNote}</div>
      ) : (
        <div ref={scrollRef} className="max-h-[34rem] min-h-[18rem] space-y-4 overflow-y-auto px-5 py-4">
          {empty && (
            <div>
              <p className="text-sm text-ink-soft">{t.intro}</p>
              <div className="mt-3">{starters(false)}</div>
            </div>
          )}
          {conversation}
        </div>
      )}

      <div className="border-t border-sand-line px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={off ? t.placeholderOff : t.placeholder}
            disabled={off || loading}
            aria-disabled={off}
            className="h-11 flex-1 rounded-pill border border-sand-line bg-sand-100 px-4 text-[15px] outline-none focus-visible:border-oasis disabled:cursor-not-allowed disabled:border-sand-line disabled:bg-sand-200/60 disabled:text-ink-faint"
          />
          <button
            onClick={() => submit()}
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
  );

  return (
    <>
      <section className="mt-10 no-print">{card}</section>
      {checklistProgram && (
        <ChecklistDialog
          program={checklistProgram}
          profile={profile}
          locale={locale}
          onClose={() => setChecklistId(null)}
        />
      )}
    </>
  );
}
