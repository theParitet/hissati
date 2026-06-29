/**
 * Hissati — client state (FR-A3/FR-A4, FR-D3). Zustand + persist(localStorage):
 * answers + completed roadmap steps + locale survive refresh and offline.
 *
 * "Mark a step done" records the step's KEY in `doneSteps`. Each key is atomic:
 * the engine clears exactly the gate(s) that name it, so a program re-evaluates
 * live (the FR-D3 climb) and undoing a step always re-opens it — no profile
 * folding, no coupling between steps.
 */
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { Profile } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

/** A completed roadmap step: its atomic key + a label for the undo trail. */
export interface DoneStep {
  key: string; // e.g. "registration:lt_1yr" | "stage:mvp" | "relocation_willing:true"
  label?: { en: string; ar: string }; // for the completed-steps trail (undo)
}

/** The set of completed step keys the engine clears gates against. */
export function doneKeysOf(doneSteps: DoneStep[]): Set<string> {
  return new Set(doneSteps.map((d) => d.key));
}

/**
 * A re-stated answer is authoritative for the field it sets. Editing a field in
 * My details drops any completed step keyed on that field, so a stale done-key
 * can't keep a gate cleared against the founder's own restated answer (e.g.
 * marking "register" done, then setting registration back to "none"). Steps on
 * untouched fields stay; returns the same array reference when nothing is pruned.
 */
export function pruneStepsForEdit(patch: Partial<Profile>, doneSteps: DoneStep[]): DoneStep[] {
  const editedFields = new Set(Object.keys(patch));
  const kept = doneSteps.filter((d) => !editedFields.has(d.key.split(":")[0]));
  return kept.length === doneSteps.length ? doneSteps : kept;
}

const CORE_FIELDS: (keyof Profile)[] = [
  "nationality_ownership",
  "location",
  "stage",
  "registration",
  "sector",
  "funding_type",
  "amount_band",
];

/** Are all 6 core gating answers present? (relocation is conditional/optional) */
export function isProfileComplete(answers: Partial<Profile>): answers is Profile {
  return CORE_FIELDS.every((f) => answers[f] !== undefined);
}

interface HissatiState {
  locale: Locale;
  answers: Partial<Profile>;
  doneSteps: DoneStep[];
  checkedDocs: Record<string, number[]>; // programId -> checked document indices
  _hydrated: boolean;

  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  setAnswer: (patch: Partial<Profile>) => void;
  resetAnswers: () => void;
  markStep: (step: DoneStep) => void;
  unmarkStep: (key: string) => void;
  isStepDone: (key: string) => boolean;
  toggleDoc: (programId: string, index: number) => void;
}

export const useHissati = create<HissatiState>()(
  persist(
    (set, get) => ({
      locale: "ar", // Arabic-first
      answers: {},
      doneSteps: [],
      checkedDocs: {},
      _hydrated: false,

      setLocale: (l) => set({ locale: l }),
      toggleLocale: () => set((s) => ({ locale: s.locale === "ar" ? "en" : "ar" })),
      setAnswer: (patch) =>
        set((s) => ({
          answers: { ...s.answers, ...patch },
          // A re-stated answer wins over a stale completed step on the same field.
          doneSteps: pruneStepsForEdit(patch, s.doneSteps),
        })),
      resetAnswers: () => set({ answers: {}, doneSteps: [], checkedDocs: {} }),
      // Atomic toggle: mark adds the key (idempotent), undo removes exactly it.
      markStep: (step) =>
        set((s) =>
          s.doneSteps.some((d) => d.key === step.key) ? s : { doneSteps: [...s.doneSteps, step] }
        ),
      unmarkStep: (key) => set((s) => ({ doneSteps: s.doneSteps.filter((d) => d.key !== key) })),
      isStepDone: (key) => get().doneSteps.some((d) => d.key === key),
      toggleDoc: (programId, index) =>
        set((s) => {
          const cur = s.checkedDocs[programId] ?? [];
          const next = cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index];
          return { checkedDocs: { ...s.checkedDocs, [programId]: next } };
        }),
    }),
    {
      name: "hissati-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ locale: s.locale, answers: s.answers, doneSteps: s.doneSteps, checkedDocs: s.checkedDocs }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    }
  )
);

/**
 * Avoids SSR/persist hydration mismatch: returns false during SSR + first paint,
 * true once the persisted store has rehydrated on the client.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  // This effect deliberately marks the client hydration boundary.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/**
 * SSR-safe locale: "ar" (the server default) until hydrated, then the persisted
 * value. Use this for rendering; use the store action `toggleLocale` for changes.
 */
export function useLocale(): Locale {
  const locale = useHissati((s) => s.locale);
  return useHydrated() ? locale : "ar";
}
