"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { ui, enumLabel, QUESTION_TEXT, ENUM_LABELS, type Locale } from "@/lib/i18n";
import type { QuestionId } from "@/lib/questions";
import type { Profile } from "@/lib/schema";

/**
 * The collect_profile form (FR-I, item 11). When the assistant needs fields it
 * doesn't know, it renders here — tap-to-answer, reusing the questionnaire's
 * enum labels. On submit the answers persist to the store (benefiting the whole
 * app) and the assistant is re-asked with a fuller profile. The founder can
 * always ignore this and just type instead.
 */
function fieldLabel(field: string, locale: Locale): string {
  const t = ui(locale);
  if (field === "funding_type") return t.fundingType;
  if (field === "amount_band") return t.fundingAmount;
  const q = QUESTION_TEXT[field as QuestionId];
  return q ? q.prompt[locale] : field;
}

function fieldOptions(field: string, locale: Locale): { value: string | boolean; label: string }[] {
  if (["relocation_willing", "farm_tenure", "social_impact"].includes(field)) {
    const t = ui(locale);
    return [
      { value: true, label: t.yes },
      { value: false, label: t.no },
    ];
  }
  const group = ENUM_LABELS[field];
  return group ? Object.keys(group).map((v) => ({ value: v, label: enumLabel(field, v, locale) })) : [];
}

export function ProfileForm({
  fields,
  reason,
  locale,
  onSubmit,
}: {
  fields: string[];
  reason?: string;
  locale: Locale;
  onSubmit: (patch: Partial<Profile>) => void;
}) {
  const t = ui(locale);
  const [vals, setVals] = useState<Record<string, string | boolean>>({});
  const ready = fields.length > 0 && fields.every((f) => vals[f] !== undefined);

  return (
    <div className="mt-3 rounded-card border border-sand-line bg-sand-100 p-3.5">
      <p className="mb-2.5 text-sm text-ink-soft">{reason || t.formPrompt}</p>
      <div className="space-y-3.5">
        {fields.map((f) => (
          <div key={f}>
            <p className="mb-1.5 text-sm font-medium text-ink">{fieldLabel(f, locale)}</p>
            <div className="flex flex-wrap gap-1.5">
              {fieldOptions(f, locale).map((opt) => {
                const selected = vals[f] === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => setVals((v) => ({ ...v, [f]: opt.value }))}
                    aria-pressed={selected}
                    className={[
                      "inline-flex h-9 items-center rounded-pill border px-3 text-xs font-medium leading-none transition-colors",
                      selected
                        ? "border-oasis bg-oasis-100 text-oasis"
                        : "border-sand-line bg-sand-100 text-ink-soft hover:bg-sand-200",
                    ].join(" ")}
                  >
                    <span className="tb-trim">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Button size="sm" className="mt-3.5" disabled={!ready} onClick={() => onSubmit(vals as Partial<Profile>)}>
        {t.formContinue}
      </Button>
    </div>
  );
}
