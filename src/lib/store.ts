/**
 * Hissati — client state (FR-A3/FR-A4, FR-D3). Zustand + persist(localStorage):
 * answers + completed roadmap steps + locale survive refresh and offline.
 *
 * "Mark a step done" stores a Partial<Profile> override; the effective profile
 * is answers folded with those overrides, then re-run through the SAME pure
 * engine/scoring. That is the entire FR-D3 live re-check — no special-casing.
 */
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import { Stage, Registration, type Profile } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

/** A completed roadmap step: a stable key + the profile advance it represents. */
export interface DoneStep {
  key: string; // e.g. "registration:lt_1yr" | "stage:mvp" | "relocation_willing:true"
  mutate: Partial<Profile>;
  label?: { en: string; ar: string }; // for the completed-steps trail (undo)
}

function maxByOrder(order: readonly string[], a: string | undefined, b: string): string {
  if (a === undefined) return b;
  return order.indexOf(b) > order.indexOf(a) ? b : a;
}

/** Apply one step's mutation, advancing ordered fields to at least the target. */
function applyMutation(profile: Partial<Profile>, mutate: Partial<Profile>): Partial<Profile> {
  const next: Partial<Profile> = { ...profile };
  for (const [k, v] of Object.entries(mutate)) {
    if (k === "stage") next.stage = maxByOrder(Stage.options, profile.stage, v as string) as Profile["stage"];
    else if (k === "registration")
      next.registration = maxByOrder(Registration.options, profile.registration, v as string) as Profile["registration"];
    else (next as Record<string, unknown>)[k] = v;
  }
  return next;
}

/** The profile actually fed to the matcher: answers + every completed step. */
export function effectiveProfile(answers: Partial<Profile>, doneSteps: DoneStep[]): Partial<Profile> {
  return doneSteps.reduce((p, s) => applyMutation(p, s.mutate), answers);
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
      setAnswer: (patch) => set((s) => ({ answers: { ...s.answers, ...patch } })),
      resetAnswers: () => set({ answers: {}, doneSteps: [], checkedDocs: {} }),
      markStep: (step) =>
        set((s) =>
          s.doneSteps.some((d) => d.key === step.key)
            ? s
            : { doneSteps: [...s.doneSteps, step] }
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
