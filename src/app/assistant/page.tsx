"use client";

import { Assistant } from "@/components/Assistant";
import { Eyebrow } from "@/components/ui";
import { useLocale } from "@/lib/store";
import { ui } from "@/lib/i18n";

export default function AssistantPage() {
  const locale = useLocale();
  const t = ui(locale);

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 pb-4 pt-6 sm:px-6">
      <div className="mb-4 no-print">
        <Eyebrow>{t.assistant}</Eyebrow>
        <h1 className="mt-1.5 text-2xl">{t.assistantLead}</h1>
      </div>
      <div className="min-h-0 flex-1">
        <Assistant variant="page" />
      </div>
    </div>
  );
}
