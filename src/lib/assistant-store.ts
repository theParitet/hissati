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

export interface Grounding {
  name: string;
  labelEn: string;
  labelAr: string;
}
export interface AssistantMsg {
  role: "user" | "assistant";
  content: string;
  grounding?: Grounding[];
  programIds?: string[];
  compareIds?: string[];
}

const errText = (locale: Locale) =>
  locale === "ar"
    ? "المساعد غير متاح الآن — بقية التطبيق تعمل دون اتصال."
    : "The assistant is unavailable — the rest of the app works offline.";

interface AssistantState {
  enabled: boolean | null; // null = not yet checked
  checked: boolean;
  messages: AssistantMsg[];
  loading: boolean;
  checkEnabled: () => void;
  send: (text: string, locale: Locale) => Promise<void>;
  reset: () => void;
}

export const useAssistant = create<AssistantState>((set, get) => ({
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
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      set({
        messages: [
          ...next,
          data.error
            ? { role: "assistant", content: errText(locale) }
            : {
                role: "assistant",
                content: data.reply || "…",
                grounding: data.grounding,
                programIds: data.programIds,
                compareIds: data.compareIds,
              },
        ],
      });
    } catch {
      set({ messages: [...next, { role: "assistant", content: errText(locale) }] });
    } finally {
      set({ loading: false });
    }
  },

  reset: () => set({ messages: [] }),
}));
