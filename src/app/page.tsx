"use client";

import { Hero } from "@/components/landing/Hero";
import { Fragmentation } from "@/components/landing/Fragmentation";
import { FounderChain } from "@/components/landing/FounderChain";
import { LivePreview } from "@/components/landing/LivePreview";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { useLocale } from "@/lib/store";

export default function Home() {
  const locale = useLocale();

  return (
    <>
      <Hero />
      <Fragmentation locale={locale} />
      <FounderChain locale={locale} />
      <LivePreview locale={locale} />
      <ClosingCta />
    </>
  );
}
