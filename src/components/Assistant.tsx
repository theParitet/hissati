"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  ShieldCheck,
  PowerOff,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Card, EmptyState, Money } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { ProgramCard } from "@/components/ProgramCard";
import { ChecklistDialog } from "@/components/ChecklistDialog";
import { CompareView } from "@/components/CompareView";
import { ProfileForm } from "@/components/ProfileForm";
import { useHissati, useLocale, doneKeysOf, isProfileComplete } from "@/lib/store";
import { useAssistant, type AssistantMsg, type AssistantStats, type Grounding } from "@/lib/assistant-store";
import { getProgramById } from "@/lib/programs";
import { evaluateProgramFull } from "@/lib/engine";
import { buildComparison } from "@/lib/compare";
import { ui, enumLabel, toLocaleDigits, type Locale } from "@/lib/i18n";
import type { Profile } from "@/lib/schema";

const MAX_INLINE_CARDS = 3; // keep the thread compact; the rest live in "My matches"

const T = {
  ar: {
    title: "اسأل حِصّتي",
    intro: "مساعد يعتمد على نفس المحرك — كل رقم وقاعدة من البرامج، لا اختراع.",
    placeholder: "مثال: أصنع التمور في المنزل، هل من تمويل؟",
    note: "معلومات لا نصيحة قانونية أو مالية.",
    grounded: "بالاستناد إلى",
    off: "غير مُفعّل",
    offNote:
      "المساعد ميزة اختيارية ومُطفأة حالياً. كل ما عداه في حِصّتي — المطابقة والخطوات وخطة PDF — يعمل دون اتصال وبدونه.",
    errorRetry: "أعد المحاولة",
    moreMatches: "المزيد في خطتك",
    starters: [
      "ما التمويل الذي يمكنني الحصول عليه؟",
      "ما خطوتي الأولى للتأهّل؟",
      "أصنع التمور في المنزل، هل من منح؟",
    ],
  },
  en: {
    title: "Ask Hissati",
    intro: "Grounded in the same engine — every figure and rule comes from the programs, nothing invented.",
    placeholder: "e.g. I make dates at home — is there funding?",
    note: "Information, not legal or financial advice.",
    grounded: "Grounded in",
    off: "Off",
    offNote:
      "The assistant is an optional add-on, currently off. Everything else in Hissati — matching, steps, and the PDF plan — works offline without it.",
    errorRetry: "Try again",
    moreMatches: "more in your plan",
    starters: ["What funding can I get?", "What's my first step to qualify?", "I make dates at home — any grants?"],
  },
};

/* ── Receipts: which deterministic tools grounded the answer ──────────────── */
function GroundingChips({ items, locale }: { items: Grounding[]; locale: Locale }) {
  const label = locale === "ar" ? T.ar.grounded : T.en.grounded;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</span>
      {items.map((g, j) => (
        <span
          key={j}
          className="inline-flex items-center gap-1 rounded-pill border border-sand-line bg-sand-100 px-2 py-0.5 text-[11px] leading-none text-ink-soft"
        >
          <ShieldCheck className="h-3 w-3 text-oasis" aria-hidden />
          <span className="tb-trim">{locale === "ar" ? g.labelAr : g.labelEn}</span>
        </span>
      ))}
    </div>
  );
}

/* ── The one-number ledger: cited "within reach", in the mono money voice ─── */
function ReachChip({ stats, locale }: { stats: AssistantStats; locale: Locale }) {
  const t = ui(locale);
  const { aedReachableNow, aedReachableAfterSteps, programsEligible } = stats;
  const showNow = typeof aedReachableNow === "number";
  const showCount = typeof programsEligible === "number";
  const showAfter =
    typeof aedReachableAfterSteps === "number" && aedReachableAfterSteps !== (aedReachableNow ?? aedReachableAfterSteps);
  if (!showNow && !showCount && !showAfter) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border border-amber-100 bg-amber-100/30 px-3 py-2 text-sm">
      {showNow && (
        <span className="inline-flex items-baseline gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">{t.withinReach}</span>
          <Money aed={aedReachableNow!} locale={locale} className="font-semibold text-amber-600" />
        </span>
      )}
      {showCount && (
        <>
          {showNow && <span className="text-ink-faint" aria-hidden>·</span>}
          <span className="text-ink-soft">
            <span className="font-semibold text-ink">{toLocaleDigits(programsEligible!, locale)}</span>{" "}
            {t.programsEligibleLabel}
          </span>
        </>
      )}
      {showAfter && (
        <>
          {(showNow || showCount) && <span className="text-ink-faint" aria-hidden>·</span>}
          <span className="inline-flex items-baseline gap-1.5 text-ink-soft">
            <span className="text-[11px]">{t.potentialReach}</span>
            <Money aed={aedReachableAfterSteps!} locale={locale} className="font-semibold text-oasis" />
          </span>
        </>
      )}
    </div>
  );
}

/* ── "Hissati is typing" — three quiet dots (frozen under reduced-motion) ─── */
function TypingDots() {
  return (
    <div className="w-fit rounded-card bg-sand-200/70 px-4 py-3" aria-label="…" role="status">
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-pill bg-ink-faint"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

export function Assistant({ variant = "embedded" }: { variant?: "embedded" | "page" }) {
  const locale = useLocale();
  const t = T[locale];
  const uiT = ui(locale);
  const answers = useHissati((s) => s.answers);
  const doneSteps = useHissati((s) => s.doneSteps);
  const setAnswer = useHissati((s) => s.setAnswer);
  const complete = isProfileComplete(answers);
  const profile = answers as Profile;
  const doneKeys = doneKeysOf(doneSteps);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const enabled = useAssistant((s) => s.enabled);
  const messages = useAssistant((s) => s.messages);
  const loading = useAssistant((s) => s.loading);
  const checkEnabled = useAssistant((s) => s.checkEnabled);
  const send = useAssistant((s) => s.send);
  const retry = useAssistant((s) => s.retry);

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
  const checking = enabled === null; // availability not yet known — show a loader, never the on-UI
  const empty = messages.length === 0;
  const checklistProgram = checklistId ? getProgramById(checklistId) : undefined;

  function submit(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    setInput("");
    void send(value, locale);
  }

  // Form submit (item 11): persist the answers to the store (helps the whole
  // app), then re-ask with a confirmation — send() now seeds the fuller profile.
  function handleFormSubmit(idx: number, patch: Partial<Profile>) {
    setFormDone((s) => new Set(s).add(idx));
    setAnswer(patch);
    const parts = Object.entries(patch).map(([k, v]) =>
      typeof v === "boolean" ? (v ? uiT.yes : uiT.no) : enumLabel(k, String(v), locale)
    );
    void send(`${uiT.myDetails} ${parts.join(locale === "ar" ? "، " : ", ")}`, locale);
  }

  /* Starter prompts — the empty state's call to act. */
  const starters = (
    <div className="flex flex-wrap justify-center gap-2">
      {t.starters.map((s, i) => (
        <button
          key={i}
          onClick={() => submit(s)}
          className="inline-flex h-9 items-center rounded-pill border border-sand-line bg-sand-100 px-3.5 text-xs leading-none text-ink-soft transition-colors hover:border-oasis/40 hover:text-ink"
        >
          <span className="tb-trim">{s}</span>
        </button>
      ))}
    </div>
  );

  /* One assistant/user turn — prose, the money ledger, receipts, then the real
     structured components (never model HTML). */
  function turn(m: AssistantMsg, i: number) {
    if (m.role === "user") {
      return (
        <div key={i} className="min-w-0 max-w-full text-end">
          <div className="inline-block max-w-[85%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-card bg-oasis px-3.5 py-2 text-sm text-sand-100">
            {m.content}
          </div>
        </div>
      );
    }

    // Friendly, retryable failure — not a model answer.
    if (m.error) {
      return (
        <div key={i} className="min-w-0 max-w-full text-start">
          <div className="flex w-fit max-w-[92%] items-start gap-2.5 rounded-card border border-clay-100 bg-clay-100/40 px-3.5 py-2.5 text-sm text-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden />
            <div>
              <p>{m.content}</p>
              <button
                onClick={() => void retry(locale)}
                disabled={loading}
                className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-clay px-3 py-1 text-xs font-medium text-sand-100 transition-colors hover:bg-clay/90 disabled:opacity-40"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden />
                <span className="tb-trim">{t.errorRetry}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    const ids = (m.programIds ?? []).slice(0, MAX_INLINE_CARDS);
    const extra = (m.programIds?.length ?? 0) - ids.length;

    return (
      <div key={i} className="min-w-0 max-w-full text-start">
        {m.content && (
          <div className="block w-fit max-w-[92%] rounded-card bg-sand-200/70 px-4 py-3 text-ink [&_*]:break-words">
            <Markdown>{m.content}</Markdown>
          </div>
        )}

        {m.stats && <ReachChip stats={m.stats} locale={locale} />}
        {m.grounding && m.grounding.length > 0 && <GroundingChips items={m.grounding} locale={locale} />}

        {/* Real ProgramCards from the SAME engine — capped to keep the thread tight. */}
        {ids.length > 0 && complete && (
          <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
            {ids.map((id) => {
              const program = getProgramById(id);
              if (!program) return null;
              return (
                <ProgramCard
                  key={id}
                  ev={evaluateProgramFull(profile, program, doneKeys)}
                  profile={profile}
                  locale={locale}
                  onOpenChecklist={setChecklistId}
                />
              );
            })}
            {extra > 0 && (
              <Link
                href="/plan"
                className="inline-flex items-center gap-1.5 self-start rounded-pill px-1 text-sm font-medium text-oasis hover:text-oasis-700"
              >
                <span className="tb-trim">
                  +{toLocaleDigits(extra, locale)} {t.moreMatches}
                </span>
                <Arrow className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        )}

        {/* Inline compare table — same CompareView as /plan. */}
        {m.compareIds && m.compareIds.length >= 2 && complete && (
          <div className="mt-3 rounded-card border border-sand-line bg-sand-100 p-3">
            <CompareView
              rows={buildComparison(
                profile,
                m.compareIds
                  .map((id) => getProgramById(id))
                  .filter((p): p is NonNullable<typeof p> => Boolean(p))
                  .map((p) => evaluateProgramFull(profile, p, doneKeys))
              )}
              locale={locale}
              onOpenChecklist={setChecklistId}
            />
          </div>
        )}

        {/* collect_profile form — tap to answer; the founder can also just type. */}
        {m.form && m.form.fields.length > 0 && !formDone.has(i) && (
          <ProfileForm
            fields={m.form.fields}
            reason={m.form.reason}
            locale={locale}
            onSubmit={(patch) => handleFormSubmit(i, patch)}
          />
        )}
      </div>
    );
  }

  const conversation = (
    <>
      {messages.map((m, i) => turn(m, i))}
      {loading && <TypingDots />}
    </>
  );

  /* ── Page variant — full-bleed chat with a floating centered composer. ──── */
  if (isPage) {
    return (
      <>
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <div ref={scrollRef} className="scrollbar-themed flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div
              className={
                "mx-auto flex min-w-0 w-full max-w-2xl flex-1 flex-col px-4 py-6 " +
                (off || empty ? "items-center justify-center" : "space-y-4")
              }
            >
              {checking ? (
                <TypingDots />
              ) : off ? (
                <EmptyState
                  className="max-w-md"
                  icon={<PowerOff className="h-7 w-7" aria-hidden />}
                  title={t.title}
                  desc={t.offNote}
                  action={
                    <Link href="/plan">
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-oasis px-4 text-sm font-medium text-sand-100 transition-colors hover:bg-oasis-700">
                        <span className="tb-trim">{uiT.navPlan}</span>
                        <Arrow className="h-4 w-4" aria-hidden />
                      </span>
                    </Link>
                  }
                />
              ) : empty ? (
                <EmptyState
                  className="max-w-lg border-amber-100/70 bg-amber-100/10"
                  icon={<Sparkles className="h-7 w-7 text-amber" aria-hidden />}
                  title={t.title}
                  desc={t.intro}
                  action={starters}
                />
              ) : (
                conversation
              )}
            </div>
          </div>

          {!off && !checking && (
            <div className="mx-auto min-w-0 w-full max-w-2xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2 rounded-pill border border-sand-line bg-sand-100 p-2 shadow-lift transition-colors focus-within:border-oasis">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={t.placeholder}
                  disabled={loading}
                  className="h-9 flex-1 bg-transparent px-3 text-[15px] outline-none placeholder:text-ink-faint disabled:opacity-60"
                />
                <button
                  onClick={() => submit()}
                  disabled={loading || !input.trim()}
                  aria-label={locale === "ar" ? "إرسال" : "Send"}
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
            doneKeys={doneKeys}
            locale={locale}
            onClose={() => setChecklistId(null)}
          />
        )}
      </>
    );
  }

  /* ── Embedded variant — the card that can sit atop a dashboard surface. ─── */
  return (
    <>
      <section className="mt-10 no-print">
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
            <div ref={scrollRef} className="scrollbar-themed max-h-[34rem] min-h-[18rem] space-y-4 overflow-y-auto px-5 py-4">
              {empty && (
                <div>
                  <p className="text-sm text-ink-soft">{t.intro}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {t.starters.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => submit(s)}
                        className="inline-flex h-9 items-center rounded-pill border border-sand-line bg-sand-100 px-3.5 text-xs leading-none text-ink-soft transition-colors hover:border-oasis/40 hover:text-ink"
                      >
                        <span className="tb-trim">{s}</span>
                      </button>
                    ))}
                  </div>
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
                placeholder={off ? t.offNote : t.placeholder}
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
      </section>

      {checklistProgram && (
        <ChecklistDialog
          program={checklistProgram}
          profile={profile}
          doneKeys={doneKeys}
          locale={locale}
          onClose={() => setChecklistId(null)}
        />
      )}
    </>
  );
}
