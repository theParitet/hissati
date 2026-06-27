"use client";

/**
 * The funding sky — Hissati's signature surface.
 *
 * Al Qua'a sits at the edge of the Empty Quarter under some of the darkest skies
 * in the UAE (astro-tourism is one of the matched sectors). So the dashboard's
 * one bold move is a real night sky where each matched FUNDING program is a star.
 * A star's HEIGHT encodes reachability and its BRIGHTNESS encodes status:
 *   · eligible → published gates met for an open/rolling opportunity
 *   · almost   → mid-sky, glowing amber (one cited step away)
 *   · not-fit  → faint, low near the horizon (not on this path yet)
 * As the founder marks roadmap steps, almost-stars rise and brighten — the live
 * "watch it climb" demo moment. Positions are deterministic (seeded by id) so the
 * constellation is stable; only height/glow transition on a status flip.
 *
 * Motion is pure CSS transition on transform/opacity/filter (eased with the
 * shared --ease-out token) plus a halo pulse on lit stars; the global
 * prefers-reduced-motion killswitch freezes both.
 */
import { Money } from "@/components/ui";
import { pick, toLocaleDigits, type Locale } from "@/lib/i18n";
import type { EligibilityStatus } from "@/lib/schema";

export interface SkyStar {
  id: string;
  name: { en: string; ar: string };
  status: EligibilityStatus;
}

/** Stable 0..1 hash of a string (FNV-1a) — deterministic, offline, no clock. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Vertical band (% from top) per status — height IS reachability. */
const BAND: Record<EligibilityStatus, [number, number]> = {
  eligible: [12, 32],
  almost: [40, 58],
  not_fit: [64, 82],
};

const STAR_STYLE: Record<
  EligibilityStatus,
  { size: number; fill: string; glow: string; opacity: number }
> = {
  eligible: {
    size: 16,
    fill: "#fbf8f1",
    glow: "drop-shadow(0 0 7px rgba(217,138,30,0.85)) drop-shadow(0 0 2px rgba(251,248,241,0.95))",
    opacity: 1,
  },
  almost: {
    size: 12,
    fill: "#f7e6c8",
    glow: "drop-shadow(0 0 5px rgba(217,138,30,0.55))",
    opacity: 0.95,
  },
  not_fit: {
    size: 7,
    fill: "rgba(246,241,231,0.30)",
    glow: "none",
    opacity: 0.55,
  },
};

function StarGlyph({ size, fill, style }: { size: number; fill: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden focusable="false">
      <path
        d="M12 1.2 L13.8 10.2 L22.8 12 L13.8 13.8 L12 22.8 L10.2 13.8 L1.2 12 L10.2 10.2 Z"
        fill={fill}
      />
    </svg>
  );
}

export function FundingSky({
  stars,
  locale,
  aedReachableNow,
  hasOpenEnded,
  className,
}: {
  stars: SkyStar[];
  locale: Locale;
  aedReachableNow: number;
  hasOpenEnded: boolean;
  className?: string;
}) {
  const total = stars.length;
  const lit = stars.filter((s) => s.status === "eligible").length;
  // Dawn fraction drives the horizon glow + how high the sun has risen.
  const frac = total ? (lit + 0.4 * stars.filter((s) => s.status === "almost").length) / total : 0;

  // Stable order → stable x; only height changes when a star's status flips.
  const ordered = [...stars].sort((a, b) => a.id.localeCompare(b.id));
  const TRANSITION =
    "top 650ms var(--ease-out), opacity 650ms var(--ease-out), transform 650ms var(--ease-out), filter 650ms var(--ease-out)";

  const legend: { label: string; dot: string; color: string }[] = [
    { label: locale === "ar" ? "مطابقة مفتوحة" : "Open match", dot: "●", color: "#fbf8f1" },
    { label: locale === "ar" ? "قريب" : "Almost", dot: "●", color: "#f7e6c8" },
    { label: locale === "ar" ? "ليس بعد" : "Not yet", dot: "○", color: "rgba(246,241,231,0.55)" },
  ];

  return (
    <div
      className={`relative isolate overflow-hidden bg-night ${className ?? ""}`}
      style={{
        backgroundImage:
          "radial-gradient(120% 80% at 50% 120%, rgba(217,138,30,0.22), transparent 60%)," +
          "linear-gradient(180deg, var(--color-night-700) 0%, var(--color-night) 55%, var(--color-night-100) 100%)",
      }}
    >
      {/* Dawn glow on the horizon — intensifies as funding becomes reachable. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(217,138,30,0.55))",
          opacity: 0.2 + 0.6 * frac,
          transition: "opacity 650ms var(--ease-out)",
        }}
      />
      {/* The rising sun — its height tracks the dawn fraction. */}
      <div
        aria-hidden
        className="animate-rise pointer-events-none absolute start-1/2 h-14 w-14 -translate-x-1/2 rounded-full"
        style={{
          bottom: `calc(${(6 + frac * 30).toFixed(1)}% )`,
          background:
            "radial-gradient(circle, rgba(255,250,240,0.95), rgba(247,200,120,0.55) 40%, rgba(217,138,30,0.16) 66%, transparent 76%)",
          filter: "blur(1px)",
          transition: "bottom 650ms var(--ease-out)",
        }}
      />

      {/* Caption — within-reach folded in small (the strip owns the big number). */}
      <div className="relative z-10 flex items-start justify-between gap-3 p-5 sm:p-6">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">
            {locale === "ar" ? "سماء التمويل" : "Your funding sky"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-sand-100/75">
            <span className="text-base font-semibold text-amber-100">
              <Money aed={aedReachableNow} locale={locale} />
              {hasOpenEnded ? "+" : ""}
            </span>{" "}
            {locale === "ar"
              ? "ضمن متناولك — كل نجمة برنامج تمويل، أنجِز خطوة لترتفع وتُضيء."
              : "within reach — each star is a funding program; complete a step to make it rise."}
          </p>
        </div>
        <div className="shrink-0 rounded-pill bg-night-100/70 px-3 py-1.5 font-mono text-xs text-sand-100/85">
          {locale === "ar"
            ? `${toLocaleDigits(lit, locale)}/${toLocaleDigits(total, locale)} مُضيئة`
            : `${lit}/${total} lit`}
        </div>
      </div>

      {/* The constellation. Decorative for AT; the sr-only list below carries the data. */}
      <div aria-hidden className="relative h-44 sm:h-52">
        {ordered.map((s, i) => {
          const st = STAR_STYLE[s.status];
          const baseX = total > 1 ? 7 + (86 * i) / (total - 1) : 50;
          const x = clamp(baseX + (hash01(s.id + "x") - 0.5) * 9, 4, 96);
          const [lo, hi] = BAND[s.status];
          const y = lo + hash01(s.id + "y") * (hi - lo);
          return (
            <span
              key={s.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                insetInlineStart: `${x}%`,
                top: `${y}%`,
                opacity: st.opacity,
                transition: TRANSITION,
              }}
            >
              <span className="relative grid place-items-center">
                {s.status !== "not_fit" && (
                  <span
                    className="absolute h-6 w-6 animate-pulse rounded-full"
                    style={{
                      background:
                        s.status === "eligible"
                          ? "radial-gradient(circle, rgba(217,138,30,0.45), transparent 70%)"
                          : "radial-gradient(circle, rgba(217,138,30,0.28), transparent 70%)",
                      animationDelay: `${(hash01(s.id) * 2).toFixed(2)}s`,
                    }}
                  />
                )}
                <StarGlyph size={st.size} fill={st.fill} style={{ filter: st.glow, position: "relative" }} />
              </span>
            </span>
          );
        })}
      </div>

      {/* Legend + accessible program list. */}
      <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 pb-5 sm:px-6">
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5 text-xs text-sand-100/75">
            <span aria-hidden style={{ color: l.color }}>
              {l.dot}
            </span>
            {l.label}
          </span>
        ))}
      </div>

      <ul className="sr-only">
        {ordered.map((s) => (
          <li key={s.id}>
            {pick(s.name, locale)} —{" "}
            {s.status === "eligible"
              ? locale === "ar" ? "مطابقة مفتوحة" : "open match"
              : s.status === "almost"
                ? locale === "ar" ? "قريب من التأهّل" : "almost eligible"
                : locale === "ar" ? "غير مناسب الآن" : "not a fit yet"}
          </li>
        ))}
      </ul>
    </div>
  );
}
