import type { Metadata, Viewport } from "next";
import { Tajawal, Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { DirectionManager } from "@/components/DirectionManager";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
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
    "تمويل المشاريع في الإمارات",
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

// Pre-paint locale bootstrap. The server can't read localStorage, so it ships the
// Arabic-first default (<html dir="rtl" lang="ar"> AND Arabic body text). This blocking
// inline script runs before first paint: for a returning English user it flips <html>
// to en/ltr (kills the RTL→LTR mirror) and hides <body> via an INLINE opacity:0 set
// directly on the element — no stylesheet involved, so there's no cold-load race where
// Arabic text could paint before globals.css applied. DirectionManager clears the inline
// opacity pre-paint once React applies the persisted locale (the content then fades in).
// A fire-and-forget 3s failsafe re-reveals if hydration never runs (JS dead) — Arabic is
// the honest fallback then, and a harmless no-op once the body is already shown; offline
// still hydrates (chunks are cached). This script hardcodes the persist key 'hissati-v1'
// and the zustand .state.locale envelope; keep them in sync with lib/store.ts.
// Arabic users (the server default) are never hidden → instant paint, zero penalty.
const LOCALE_BOOTSTRAP =
  "(function(){try{var s=localStorage.getItem('hissati-v1');var l=s?(JSON.parse(s).state||{}).locale:null;var e=document.documentElement;if(l==='en'){e.lang='en';e.dir='ltr';if(document.body)document.body.style.opacity='0';setTimeout(function(){if(document.body)document.body.style.opacity='';},3000);}}catch(e){}})();";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${tajawal.variable} ${inter.variable} ${fraunces.variable} ${plexMono.variable}`}
    >
      {/* suppressHydrationWarning: the inline locale-bootstrap script sets body
          style.opacity pre-hydration for a returning English user (intentional). */}
      <body className="flex min-h-dvh min-w-0 flex-col antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP }} />
        <DirectionManager />
        <ServiceWorkerRegister />
        <AppHeader />
        <main className="min-h-0 min-w-0 flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
