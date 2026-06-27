"use client";

import { Hero } from "@/components/landing/Hero";
import { ProblemInversion } from "@/components/landing/ProblemInversion";
import { FounderClimb } from "@/components/landing/FounderClimb";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhyItHolds } from "@/components/landing/WhyItHolds";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { useLocale } from "@/lib/store";

export default function Home() {
  const locale = useLocale();

  return (
    <>
      <Hero />
      <ProblemInversion locale={locale} />
      <FounderClimb locale={locale} />
      <HowItWorks locale={locale} />
      <WhyItHolds locale={locale} />
      <ClosingCta />
    </>
  );
}
