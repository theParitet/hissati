"use client";

import { Assistant } from "@/components/Assistant";

export default function AssistantPage() {
  // Chat only — fills the tab beneath the sticky app header.
  return (
    <div className="h-[calc(100dvh-4rem)]">
      <Assistant variant="page" />
    </div>
  );
}
