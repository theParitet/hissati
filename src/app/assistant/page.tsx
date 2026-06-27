"use client";

import { Assistant } from "@/components/Assistant";

export default function AssistantPage() {
  // Chat only — fills the tab beneath the sticky app header.
  return (
    <div className="h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
      <Assistant variant="page" />
    </div>
  );
}
