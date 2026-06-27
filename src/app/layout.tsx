import type { Metadata, Viewport } from "next";
import { Tajawal, Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { DirectionManager } from "@/components/DirectionManager";
import { AppHeader } from "@/components/AppHeader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Self-hosted at build time (next/font) → no runtime CDN, works offline (NFR-1).
// Tajawal is the bilingual workhorse; Fraunces gives Latin display its own voice.
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});
// Inter supplies balanced Latin UI metrics; Arabic falls through to Tajawal.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "900"],
  variable: "--font-fraunces",
  display: "swap",
});
// Ledger voice for money / data / stamps — "with receipts". Self-hosted, offline.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: "Hissati · حِصّتي — UAE funding navigator",
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: "Hissati",
  keywords: [
    "UAE startup funding",
    "UAE grants",
    "small business funding UAE",
    "Emirati entrepreneur funding",
    "تمويل المشاريع الإمارات",
    "منح المشاريع الصغيرة",
  ],
  authors: [{ name: "Hissati" }],
  creator: "Hissati",
  publisher: "Hissati",
  category: "Business and finance",
  alternates: { canonical: "/" },
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: "Hissati · حِصّتي — UAE funding navigator",
    description: SITE_DESCRIPTION,
    locale: "ar_AE",
    alternateLocale: ["en_AE"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hissati · حِصّتي — UAE funding navigator",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
      className={`${tajawal.variable} ${inter.variable} ${fraunces.variable} ${plexMono.variable}`}
    >
      <body className="flex min-h-dvh min-w-0 flex-col antialiased">
        <DirectionManager />
        <ServiceWorkerRegister />
        <AppHeader />
        <main className="min-h-0 min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
