import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My details",
  robots: { index: false, follow: false },
};

export default function QuestionnaireLayout({ children }: { children: React.ReactNode }) {
  return children;
}

