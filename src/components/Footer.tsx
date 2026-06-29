"use client";

import { Mail, WifiOff, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/store";
import { PROGRAMS } from "@/lib/programs";
import { toLocaleDigits } from "@/lib/i18n";

const SUPPORT_EMAIL = "support@hissati.org";

/**
 * Site-wide footer, rendered once in the root layout so it sits below every page.
 *
 * Spends the brand's deep oasis-green as a full band — the one place the chrome
 * goes dark green — and carries the support address so a founder can flag an
 * outdated figure or any other issue. Bilingual + RTL-safe via logical utilities.
 */
export function Footer() {
  const locale = useLocale();
  const ar = locale === "ar";
  const year = toLocaleDigits(2026, locale);

  return (
    <footer className="mt-auto bg-oasis text-sand-100 print:hidden">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand + one-line mission */}
          <div className="max-w-sm">
            <p className="inline-flex items-baseline gap-2">
              <span className="font-display text-xl font-semibold tracking-tight">Hissati</span>
              <span className="font-sans text-base text-amber-100">حصتي</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-sand-100/75">
              {ar
                ? "كل تمويل إماراتي في خطة واحدة موثّقة — مصمَّمة لمؤسِّسي القوع، العين."
                : "Every UAE fund in one cited plan — built for founders in Al Qua'a, Al Ain."}
            </p>
          </div>

          {/* Contact: questions or outdated data */}
          <div className="sm:text-end">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sand-100/60">
              {ar ? "أسئلة أو بيانات قديمة؟" : "Questions or outdated data?"}
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-2 inline-flex items-center gap-2 rounded-pill font-medium text-amber-100 underline-offset-4 transition-opacity hover:underline hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
              dir="ltr"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        {/* Trust strip + copyright */}
        <div className="mt-8 flex flex-col gap-3 border-t border-sand-100/15 pt-5 text-xs text-sand-100/60 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li className="inline-flex items-center gap-1.5">
              <WifiOff className="h-3.5 w-3.5" aria-hidden />
              <span className="tb-trim">{ar ? "يعمل دون اتصال" : "Works offline"}</span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              <span className="tb-trim">
                {ar
                  ? `${toLocaleDigits(PROGRAMS.length, locale)} برنامجاً موثّقاً`
                  : `${PROGRAMS.length} cited programs`}
              </span>
            </li>
          </ul>
          <p dir="ltr" className="tb-trim">
            © {year} Hissati
          </p>
        </div>
      </div>
    </footer>
  );
}
