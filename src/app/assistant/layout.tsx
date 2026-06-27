import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Funding assistant",
  robots: { index: false, follow: false },
};

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return children;
}

