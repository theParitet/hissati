"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown } from "lucide-react";
import { Button, Eyebrow } from "@/components/ui";
import { MatchesPanel } from "@/components/MatchesPanel";
import { useHissati, useLocale, useHydrated, isProfileComplete } from "@/lib/store";
import { ui, enumLabel, QUESTION_TEXT, toLocaleDigits, type Locale } from "@/lib/i18n";
import { getQuestion, type QuestionId } from "@/lib/questions";
import { wizardSteps } from "@/lib/wizard";
import type { Profile } from "@/lib/schema";

/** Short labels for the contents nav (the full prompts are sentences). */
const SHORT_LABEL: Record<string, { en: string; ar: string }> = {
  nationality_ownership: { en: "Ownership", ar: "الملكية" },
  location: { en: "Location", ar: "الموقع" },
  stage: { en: "Stage", ar: "المرحلة" },
  registration: { en: "Registration", ar: "التسجيل" },
  sector: { en: "Sector", ar: "المجال" },
  funding: { en: "Funding", ar: "التمويل" },
  gender: { en: "Women-only", ar: "برامج النساء" },
  farm_tenure: { en: "Farm", ar: "المزرعة" },
  social_impact: { en: "Social impact", ar: "الأثر الاجتماعي" },
  relocation_willing: { en: "Relocation", ar: "الانتقال" },
  team: { en: "Team", ar: "الفريق" },
  has_pitch_deck: { en: "Pitch deck", ar: "العرض" },
  has_financials: { en: "Financials", ar: "البيانات المالية" },
};
function shortLabel(id: string, locale: Locale): string {
  return SHORT_LABEL[id]?.[locale] ?? id;
}

function isStepAnswered(id: QuestionId, a: Partial<Profile>): boolean {
  if (id === "funding") return a.funding_type !== undefined && a.amount_band !== undefined;
  const q = getQuestion(id);
  return q ? q.writes.every((f) => a[f] !== undefined) : false;
}

export default function Questionnaire() {
  const router = useRouter();
  const locale = useLocale();
  const hydrated = useHydrated();
  const t = ui(locale);
  const answers = useHissati((s) => s.answers);
  const setAnswer = useHissati((s) => s.setAnswer);
  const resetAnswers = useHissati((s) => s.resetAnswers);

  const steps = useMemo(() => wizardSteps(answers), [answers]);
  const [index, setIndex] = useState(0);

  // Resume at the first unanswered question once persisted state has loaded.
  const [resumed, setResumed] = useState(false);
  useEffect(() => {
    if (!hydrated || resumed) return;
    const s = wizardSteps(answers);
    const firstUnanswered = s.findIndex((id) => !isStepAnswered(id, answers));
    // One-time synchronization from the persisted external store after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(firstUnanswered === -1 ? s.length - 1 : firstUnanswered);
    setResumed(true);
  }, [hydrated, resumed, answers]);

  const clamped = Math.min(index, steps.length - 1);
  const currentId = steps[clamped];
  const total = steps.length;
  // Item 12: the bar reflects how many questions are actually answered, not the cursor position.
  const answeredCount = steps.filter((id) => isStepAnswered(id, answers)).length;
  const progressPct = total ? (answeredCount / total) * 100 : 0;
  const Forward = locale === "ar" ? ArrowLeft : ArrowRight;
  const complete = isProfileComplete(answers) && steps.every((id) => isStepAnswered(id, answers));

  function goNext() {
    if (clamped < steps.length - 1) setIndex(clamped + 1);
    else router.push("/results");
  }
  // Single-choice / boolean answers auto-advance for a fast flow.
  function answerAndAdvance(patch: Partial<Profile>) {
    setAnswer(patch);
    const nextSteps = wizardSteps({ ...answers, ...patch });
    if (clamped < nextSteps.length - 1) setIndex(clamped + 1);
    else router.push("/results");
  }
  function startOver() {
    resetAnswers();
    setIndex(0);
  }

  const qt = QUESTION_TEXT[currentId];
  const fundingReady = answers.funding_type !== undefined && answers.amount_band !== undefined;

  const navList = (
    <ol className="space-y-1">
      {steps.map((id, i) => {
        const answered = isStepAnswered(id, answers);
        const current = i === clamped;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-current={current ? "step" : undefined}
              className={[
                "flex w-full items-center gap-2.5 rounded-pill px-3 py-2 text-start text-sm transition-colors",
                current ? "bg-oasis-100 font-medium text-oasis" : "text-ink-soft hover:bg-sand-200",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-pill text-[11px] font-semibold leading-none",
                  answered
                    ? "bg-palm text-sand-100"
                    : current
                      ? "border border-oasis text-oasis"
                      : "border border-sand-line text-ink-faint",
                ].join(" ")}
              >
                {answered ? <Check className="h-3 w-3" aria-hidden /> : <span className="tb-trim">{toLocaleDigits(i + 1, locale)}</span>}
              </span>
              <span className="truncate">{shortLabel(id, locale)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  // The two global actions live together as a control panel (item 8) — no Back button.
  const actions = (
    <div className="flex flex-col gap-2">
      {complete ? (
        <Button size="sm" className="w-full" onClick={() => router.push("/results")}>
          {t.seeMatchesCta} <Forward className="h-4 w-4" aria-hidden />
        </Button>
      ) : currentId === "funding" ? (
        <Button size="sm" className="w-full" onClick={goNext} disabled={!fundingReady}>
          {t.next} <Forward className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" className="w-full" onClick={startOver}>
        {t.restart}
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6">
      <div className="md:grid md:grid-cols-[210px_1fr] md:gap-8">
        {/* Contents nav — jump straight to any question, plus the global actions. */}
        <aside className="no-print mb-6 md:mb-0">
          <details className="group rounded-card border border-sand-line bg-sand-100 p-1.5 md:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-pill px-3 py-2 text-sm font-medium text-ink hover:bg-sand-200">
              <span className="tb-trim">
                {t.contents} · {toLocaleDigits(clamped + 1, locale)}/{toLocaleDigits(total, locale)}
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="mt-1">{navList}</div>
          </details>
          <div className="sticky top-20 hidden md:block">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">{t.contents}</p>
            {navList}
            <div className="mt-4 border-t border-sand-line pt-4">{actions}</div>
          </div>
        </aside>

        {/* Question column */}
        <div>
          <div className="no-print">
            <div className="flex items-center justify-between text-sm text-ink-soft">
              <span>
                {t.questionOf} {toLocaleDigits(clamped + 1, locale)} {t.of} {toLocaleDigits(total, locale)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-pill bg-sand-200">
              <div
                className="h-full rounded-pill bg-oasis transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Live shortlist — the founder sees which programs are still in the running (item 9). */}
          <div className="no-print mt-4">
            <MatchesPanel answers={answers} locale={locale} />
          </div>

          <section className="mt-7" key={currentId}>
            <Eyebrow>{t.appName}</Eyebrow>
            <h1 className="mt-3 text-3xl">{qt.prompt[locale]}</h1>
            {qt.help && <p className="mt-2 text-ink-soft">{qt.help[locale]}</p>}

            <div className="mt-7">
              {currentId === "funding" ? (
                <FundingStep locale={locale} answers={answers} setAnswer={setAnswer} t={t} />
              ) : getQuestion(currentId)?.kind === "boolean" ? (
                <div className="grid grid-cols-2 gap-3">
                  <OptionCard
                    selected={answers[getQuestion(currentId)!.writes[0]] === true}
                    onClick={() => answerAndAdvance({ [getQuestion(currentId)!.writes[0]]: true } as Partial<Profile>)}
                    label={t.yes}
                  />
                  <OptionCard
                    selected={answers[getQuestion(currentId)!.writes[0]] === false}
                    onClick={() => answerAndAdvance({ [getQuestion(currentId)!.writes[0]]: false } as Partial<Profile>)}
                    label={t.no}
                  />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {getQuestion(currentId)!.options!.map((opt) => {
                    const field = getQuestion(currentId)!.writes[0];
                    return (
                      <OptionCard
                        key={opt}
                        selected={answers[field] === opt}
                        onClick={() => answerAndAdvance({ [field]: opt } as Partial<Profile>)}
                        label={enumLabel(currentId, opt, locale)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Mobile actions — the sidebar's control panel is collapsed into the summary above. */}
          <div className="no-print mt-10 md:hidden">{actions}</div>
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "group flex items-center justify-between gap-3 rounded-card border px-4 py-3.5 text-start text-[15px] transition-colors",
        selected
          ? "border-oasis bg-oasis-100 text-oasis"
          : "border-sand-line bg-sand-100 text-ink hover:border-oasis/40 hover:bg-sand-200",
      ].join(" ")}
    >
      <span className="font-medium tb-trim">{label}</span>
      <span
        className={[
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border leading-none",
          selected ? "border-oasis bg-oasis text-sand-100" : "border-sand-line",
        ].join(" ")}
      >
        {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
      </span>
    </button>
  );
}

function FundingStep({
  locale,
  answers,
  setAnswer,
  t,
}: {
  locale: "ar" | "en";
  answers: Partial<Profile>;
  setAnswer: (p: Partial<Profile>) => void;
  t: Record<string, string>;
}) {
  const types: Profile["funding_type"][] = ["grant", "loan", "equity", "unsure"];
  const bands: Profile["amount_band"][] = ["lt_50k", "aed_50_200k", "aed_200_500k", "aed_500k_2m", "aed_2m_plus"];
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-ink-soft">{t.fundingType}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {types.map((v) => (
            <OptionCard
              key={v}
              selected={answers.funding_type === v}
              onClick={() => setAnswer({ funding_type: v })}
              label={enumLabel("funding_type", v, locale)}
            />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-ink-soft">{t.fundingAmount}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {bands.map((v) => (
            <OptionCard
              key={v}
              selected={answers.amount_band === v}
              onClick={() => setAnswer({ amount_band: v })}
              label={enumLabel("amount_band", v, locale)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
