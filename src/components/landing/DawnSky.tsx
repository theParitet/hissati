/**
 * DawnSky — the landing's one bold surface. Al Qua'a sits on the Tropic of
 * Cancer with some of the darkest skies on earth; here that night breaks into a
 * desert dawn. The metaphor IS the product: a founder rises from an idea (night)
 * to a funded path (first light). Pure inline SVG → offline, no CDN.
 *
 * Decorative: aria-hidden, fixed star field (no randomness → no hydration drift).
 */

// Fixed star field: [x%, y%, r, opacity]. Concentrated in the upper night band.
const STARS: [number, number, number, number][] = [
  [6, 10, 1.1, 0.7], [13, 22, 0.8, 0.5], [19, 8, 1.4, 0.9], [24, 30, 0.7, 0.45],
  [31, 15, 1, 0.65], [37, 26, 0.8, 0.5], [42, 9, 1.3, 0.85], [48, 20, 0.7, 0.4],
  [53, 33, 0.9, 0.55], [58, 12, 1.1, 0.7], [64, 24, 0.8, 0.5], [69, 7, 1.5, 0.95],
  [74, 30, 0.7, 0.4], [79, 17, 1, 0.6], [84, 27, 0.8, 0.5], [89, 11, 1.2, 0.8],
  [94, 22, 0.9, 0.55], [9, 38, 0.7, 0.35], [16, 45, 0.8, 0.4], [27, 42, 0.7, 0.35],
  [45, 40, 0.9, 0.5], [61, 44, 0.7, 0.35], [72, 41, 0.8, 0.4], [86, 38, 0.9, 0.45],
  [3, 28, 0.8, 0.45], [97, 33, 0.8, 0.4], [34, 5, 0.9, 0.6], [55, 6, 1, 0.7],
];

export function DawnSky({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1124" />
          <stop offset="0.34" stopColor="#121d36" />
          <stop offset="0.58" stopColor="#1b294a" />
          <stop offset="0.76" stopColor="#33324f" />
          <stop offset="0.88" stopColor="#7c5a43" />
          <stop offset="1" stopColor="#b87440" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f2b85a" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#d98a1e" stopOpacity="0.28" />
          <stop offset="1" stopColor="#d98a1e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sunDisc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7d28a" />
          <stop offset="1" stopColor="#d98a1e" />
        </linearGradient>
      </defs>

      <rect width="1440" height="900" fill="url(#dawn)" />

      <g>
        {STARS.map(([x, y, r, o], i) => (
          <circle key={i} cx={(x / 100) * 1440} cy={(y / 100) * 900} r={r} fill="#f7e6c8" opacity={o} />
        ))}
      </g>

      {/* the rising sun, cresting the dune line, slightly toward the end side */}
      <circle cx="900" cy="690" r="320" fill="url(#sunGlow)" />
      <circle cx="900" cy="690" r="116" fill="url(#sunDisc)" />

      {/* dunes — back lit by oasis green, front in deep night */}
      <path
        d="M0 720 C 220 668 360 712 560 690 C 760 668 900 700 1080 676 C 1240 656 1360 684 1440 672 L1440 900 L0 900 Z"
        fill="#163a2f"
        opacity="0.96"
      />
      <path
        d="M0 786 C 260 738 420 792 640 766 C 860 740 980 786 1180 762 C 1320 746 1400 772 1440 766 L1440 900 L0 900 Z"
        fill="#0c2019"
      />
    </svg>
  );
}
