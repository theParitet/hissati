/**
 * Hissati — assistant chat state (FR-I). Deliberately NOT persisted: the
 * conversation is shared across the landing input, the /assistant tab, and the
 * embedded chat on /results within a session, but doesn't survive a reload (a
 * stale funding chat is worse than a fresh one). The deterministic core owns all
 * durable state; this is ephemeral UI.
 */
"use client";

import { create } from "zustand";
import type { Locale } from "@/lib/i18n";
import { useHissati } from "@/lib/store";

export interface Grounding {
  name: string;
  labelEn: string;
  labelAr: string;
}

/**
 * Server-computed, cited money figures surfaced from the agent's tool results
 * (match_programs / steps_to_qualify). The client renders these as a compact
 * "within reach" ledger chip — the same one-number thesis as the dashboard,
 * never a re-introduced "readiness" score. All optional: only present when a
 * money tool actually ran for the turn.
 */
export interface AssistantStats {
  aedReachableNow?: number;
  aedReachableAfterSteps?: number;
  programsEligible?: number;
}

export interface AssistantMsg {
  role: "user" | "assistant";
  content: string;
  grounding?: Grounding[];
  programIds?: string[];
  compareIds?: string[];
  form?: { fields: string[]; reason?: string };
  stats?: AssistantStats;
  /** A friendly, retryable failure (network / route down) — not a model answer. */
  error?: boolean;
}

const errText = (locale: Locale) =>
  locale === "ar"
    ? "تعذّر الوصول إلى المساعد الآن — بقية حِصّتي تعمل دون اتصال."
    : "Couldn't reach the assistant just now — the rest of Hissati works offline.";

interface AssistantState {
  enabled: boolean | null; // null = not yet checked
  checked: boolean;
  messages: AssistantMsg[];
  loading: boolean;
  checkEnabled: () => void;
  send: (text: string, locale: Locale) => Promise<void>;
  retry: (locale: Locale) => Promise<void>;
  reset: () => void;
}

export const useAssistant = create<AssistantState>((set, get) => {
  /** Post a conversation (ending in a user turn) and append the assistant reply. */
  async function run(next: AssistantMsg[], locale: Locale) {
    const { answers, doneSteps } = useHissati.getState();
    const profile = answers;
    const doneKeys = doneSteps.map((d) => d.key);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          profile,
          doneKeys,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply: AssistantMsg = data.error
        ? { role: "assistant", content: errText(locale), error: true }
        : {
            role: "assistant",
            content: data.reply || (data.form ? "" : "…"),
            grounding: data.grounding,
            programIds: data.programIds,
            compareIds: data.compareIds,
            form: data.form,
            stats: data.stats,
          };
      set({ messages: [...next, reply] });
    } catch {
      set({ messages: [...next, { role: "assistant", content: errText(locale), error: true }] });
    } finally {
      set({ loading: false });
    }
  }

  return {
    enabled: null,
    checked: false,
    messages: [],
    loading: false,

    checkEnabled: () => {
      if (get().checked) return; // fetch availability once per session
      set({ checked: true });
      fetch("/api/agent")
        .then((r) => r.json())
        .then((d) => set({ enabled: Boolean(d.enabled) }))
        .catch(() => set({ enabled: false }));
    },

    send: async (text, locale) => {
      const clean = text.trim();
      if (!clean || get().loading || get().enabled === false) return;
      const next: AssistantMsg[] = [...get().messages, { role: "user", content: clean }];
      set({ messages: next, loading: true });
      await run(next, locale);
    },

    // Re-run the last user turn after a transient failure: drop the error bubble
    // and resend the conversation as-is (no duplicated user message).
    retry: async (locale) => {
      if (get().loading || get().enabled === false) return;
      const msgs = get().messages;
      const base =
        msgs.length && msgs[msgs.length - 1].role === "assistant" && msgs[msgs.length - 1].error
          ? msgs.slice(0, -1)
          : msgs;
      if (!base.length || base[base.length - 1].role !== "user") return;
      set({ messages: base, loading: true });
      await run(base, locale);
    },

    reset: () => set({ messages: [] }),
  };
});
