import { toLocaleDigits, type Locale } from "@/lib/i18n";
import type { Instrument } from "@/lib/schema";

/**
 * Is this amount money the founder PAYS rather than receives? A licence is a fee
 * (a cost/permit), not funding — so its amount must never read as a grant. Driven
 * by the instrument enum, so a new pay-type instrument only changes this one map.
 */
export function isCostInstrument(instrument: Instrument): boolean {
  return instrument === "license";
}

/** Compact AED magnitude: 50000 → "50K", 2000000 → "2M", 790 → "790" (localized digits). */
function compact(n: number, locale: Locale): string {
  let s: string;
  if (n >= 1_000_000) s = `${n / 1_000_000}M`;
  else if (n >= 1000) s = `${n / 1000}K`;
  else s = `${n}`;
  return s.replace(/[0-9.]+/, (m) => toLocaleDigits(m, locale));
}

/** Human funding range for a program's amount, handling null/open bounds. */
export function formatAmountRange(
  amount: { min_aed: number | null; max_aed: number | null },
  locale: Locale
): string {
  const { min_aed, max_aed } = amount;
  const aed = locale === "ar" ? "درهم" : "AED";
  if (min_aed == null && max_aed == null) return locale === "ar" ? "يختلف حسب البرنامج" : "Varies";
  if (min_aed != null && max_aed != null) {
    if (min_aed === max_aed) return `${aed} ${compact(min_aed, locale)}`;
    return `${aed} ${compact(min_aed, locale)}–${compact(max_aed, locale)}`;
  }
  if (max_aed != null) return locale === "ar" ? `حتى ${aed} ${compact(max_aed, locale)}` : `Up to ${aed} ${compact(max_aed, locale)}`;
  return locale === "ar" ? `من ${aed} ${compact(min_aed!, locale)}` : `From ${aed} ${compact(min_aed!, locale)}`;
}

export function localizeDate(iso: string, locale: Locale): string {
  return toLocaleDigits(iso, locale);
}
