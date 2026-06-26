import type { Metadata, Viewport } from "next";
import { Tajawal, Fraunces } from "next/font/google";
import "./globals.css";
import { DirectionManager } from "@/components/DirectionManager";
import { AppHeader } from "@/components/AppHeader";

// Self-hosted at build time (next/font) → no runtime CDN, works offline (NFR-1).
// Tajawal is the bilingual workhorse; Fraunces gives Latin display its own voice.
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "900"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "حِصّتي · Hissati — funding-readiness navigator",
  description:
    "Match UAE founders to real funding programs and turn every \"no\" into a cited next step. Offline-first, Arabic-first. Built for Al Qua'a, Al Ain.",
  applicationName: "Hissati",
  appleWebApp: { capable: true, title: "Hissati", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#14584a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${tajawal.variable} ${fraunces.variable}`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <DirectionManager />
        <AppHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
