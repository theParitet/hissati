/**
 * InstrumentGlyph + the shared status colour language for the Programs and
 * Checklist master lists.
 *
 * The glyph carries two orthogonal axes in one mark: the SHAPE names the
 * instrument (grant / loan / equity / accelerator / licence / support), the
 * COLOUR tint (STATUS_TONE) names the eligibility status. The selected row wears
 * the matching status THEME (STATUS_ACTIVE_BG + STATUS_TONE) rather than a single
 * accent, so an eligible pick stays green, an almost pick amber, a not-fit pick
 * neutral. These mirror the StatusPill palette (src/components/ui.tsx).
 */
import { Gift, Landmark, PieChart, Rocket, IdCard, Handshake, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Instrument, EligibilityStatus } from "@/lib/schema";

const INSTRUMENT_ICON: Record<Instrument, LucideIcon> = {
  grant: Gift,
  loan: Landmark,
  equity: PieChart,
  accelerator: Rocket,
  license: IdCard,
  support: Handshake,
};

/** Text/icon tint for a row's eligibility status. */
export const STATUS_TONE: Record<EligibilityStatus, string> = {
  eligible: "text-palm",
  almost: "text-almost",
  not_fit: "text-ink-faint",
};

/** Selected-row background per status (pairs with STATUS_TONE for text + icon). */
export const STATUS_ACTIVE_BG: Record<EligibilityStatus, string> = {
  eligible: "bg-palm-100",
  almost: "bg-almost-100",
  not_fit: "bg-sand-200",
};

export function InstrumentGlyph({
  instrument,
  status,
  className,
}: {
  instrument: Instrument;
  status: EligibilityStatus;
  className?: string;
}) {
  const Icon = INSTRUMENT_ICON[instrument];
  return <Icon className={cn("h-4 w-4 shrink-0", STATUS_TONE[status], className)} aria-hidden />;
}
