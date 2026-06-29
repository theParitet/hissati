/**
 * InstrumentGlyph — the leading row marker shared by the Programs and Checklist
 * master lists. It carries two orthogonal axes in one glyph: the SHAPE says what
 * kind of instrument it is (grant / loan / equity / accelerator / licence / support),
 * the COLOUR tint keeps the eligibility status legible. That tint matters where a
 * row sits outside its status section (e.g. the Programs "Pinned" group); elsewhere
 * the section header already names the status, so the shape is the new information.
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

const STATUS_TONE: Record<EligibilityStatus, string> = {
  eligible: "text-palm",
  almost: "text-almost",
  not_fit: "text-ink-faint",
};

export function InstrumentGlyph({
  instrument,
  status,
  active,
  className,
}: {
  instrument: Instrument;
  status: EligibilityStatus;
  active?: boolean;
  className?: string;
}) {
  const Icon = INSTRUMENT_ICON[instrument];
  return (
    <Icon
      className={cn("h-4 w-4 shrink-0", active ? "text-oasis" : STATUS_TONE[status], className)}
      aria-hidden
    />
  );
}
