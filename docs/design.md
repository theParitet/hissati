# Hissati (حصتي) — Design System

> **Version 1.0 · Tatweer Hackathon 2026**  
> Funding Readiness Navigator for Al Qua'a, Al Ain, UAE  
> Bilingual (Arabic-first RTL + English LTR) · Offline-first PWA · Web-first

---

## 1. Brand Identity

### Name & Wordmark
| Element | Value |
|---|---|
| English name | **Hissati** |
| Arabic name | **حصتي** |
| Meaning | "My share / my portion" |
| Tagline (EN) | YOUR SHARE, YOUR START |
| Tagline (AR) | حصتك، بدايتك |
| Logo mark | Compass-rose inside a circle, top arc in gold (camel-hair) |
| Primary lockup | Logo mark + "Hissati" + "حصتي" horizontal |
| Icon-only | Green rounded square (#0E5C4A → #0B3F33 gradient) with bone-white compass |

### Logo Files
| File | Usage |
|---|---|
| `Hissati-1-primary.svg` | Default horizontal lockup on light bg |
| `Hissati-2-stacked.svg` | Stacked variant for square containers |
| `Hissati-3-app-icon.svg` | PWA icon, favicon, app store |
| `Hissati-4-monochrome.svg` | Dark backgrounds, single-colour print |

---

## 2. Colour Palette

> **Tokens are the eight live `@theme` families in `globals.css`** — `oasis` ·
> `amber` · `clay` · `sand` · `ink` · `night` · `palm` · `almost`. The old
> green/gold/red/bone/henna names were renamed in the overhaul: **green→oasis**
> (brand) / **palm** (eligible), **gold→amber**, **red→clay**, **bone→sand**,
> **ink-2→ink-soft**, **ink-3→ink-faint**. Hexes here are the actual values in
> `src/app/globals.css`. Where the legacy shorthand still appears in the §8 component
> specs, read it through this map.

### Primary / Brand — Oasis Green

| Token | Hex | Role | Usage |
|---|---|---|---|
| **oasis** | `#14584a` | Primary / brand | CTAs, active states, links, AED-within-reach accent |
| **oasis-700** | `#0e4034` | Hover / deep | Hover states, deep fills, headings on light |
| **oasis-100** | `#dcebe3` | Brand tint | Eligible tint, soft brand fills |

### Accent — Amber (date-gold / money)
| Token | Hex | Role | Usage |
|---|---|---|---|
| **amber** | `#d98a1e` | Money / amounts | AED figures, value accents, logo arc, list markers |
| **amber-600** | `#b9711a` | Text on amber tint | Amount labels, deeper accent |
| **amber-100** | `#f7e6c8` | Amber tint | Hint boxes, soft amber backgrounds |

### Night — Funding Sky / Depth
| Token | Hex | Role | Usage |
|---|---|---|---|
| **night** | `#15203a` | Dark signature | Dashboard "funding sky" band, dark cards |
| **night-700** | `#0b1326` | Deepest sky | Funding-sky gradient floor |
| **night-100** | `#243150` | Sky highlight | Funding-sky upper gradient, muted dark accents |

### Eligibility Semantics
| Token | Hex | Role | Usage |
|---|---|---|---|
| **palm** | `#1f7a52` | Eligible | Eligible status, verified stamp |
| **palm-100** | `#d6ecdf` | Eligible tint | Eligible card / pill background |
| **almost** | `#c47d12` | Almost eligible | Almost-eligible status (reads on sand) |
| **almost-100** | `#f6e7c6` | Almost tint | Almost-eligible card / pill background |
| **clay** | `#9c4a2f` | Not a fit | Not-a-fit status, Sadu woven weft rule |
| **clay-100** | `#efd9cf` | Clay tint | Not-a-fit / hint background |

> **Verified stamp is green, not red.** The "verified · source · date" badge uses the
> eligibility `palm` green with a `ShieldCheck` icon (see the Verified Stamp Component
> below). An earlier clay/red read as a warning rather than a trust signal.

### Neutral / Surface — Sand & Ink
| Token | Hex | Role | Usage |
|---|---|---|---|
| **sand** | `#f6f1e7` | Page background | App background, warm dune base |
| **sand-100** | `#fbf8f1` | Card surface | Card / modal backgrounds (lightest) |
| **sand-200** | `#efe7d6` | Secondary surface | Option hover, section dividers, code chips |
| **sand-line** | `#e3d8c4` | Hairlines | Borders, table rules, dividers |
| **ink** | `#21180f` | Body text | Primary text colour (warm near-black) |
| **ink-soft** | `#5c5043` | Secondary text | Subheadings, labels, descriptions |
| **ink-faint** | `#8a7d6c` | Tertiary / muted | Captions, placeholders, muted labels |

### Token Source (Tailwind v4 — CSS-first)
Tokens are declared in **`src/app/globals.css`** under `@theme` and become utilities
automatically (`bg-sand`, `text-oasis`, `font-display`, `rounded-card`, …).
**There is no `tailwind.config.*` file** — do not add one. To change or add a colour,
edit the `@theme` block in `globals.css`; it is the single source of truth for tokens.

```css
/* src/app/globals.css — @theme excerpt (authoritative) */
@theme {
  --color-sand: #f6f1e7;   --color-sand-100: #fbf8f1;
  --color-sand-200: #efe7d6; --color-sand-line: #e3d8c4;
  --color-ink: #21180f;    --color-ink-soft: #5c5043;  --color-ink-faint: #8a7d6c;
  --color-oasis: #14584a;  --color-oasis-700: #0e4034; --color-oasis-100: #dcebe3;
  --color-amber: #d98a1e;  --color-amber-600: #b9711a; --color-amber-100: #f7e6c8;
  --color-night: #15203a;  --color-night-700: #0b1326; --color-night-100: #243150;
  --color-palm: #1f7a52;   --color-palm-100: #d6ecdf;   /* eligible  */
  --color-almost: #c47d12; --color-almost-100: #f6e7c6; /* almost    */
  --color-clay: #9c4a2f;   --color-clay-100: #efd9cf;   /* not-a-fit */
}
```

### Colour Semantics
```
Primary / brand  →  Oasis  (#14584a)
Eligible now     →  Palm   (#1f7a52 / palm-100 #d6ecdf)
Almost eligible  →  Almost (#c47d12 / almost-100 #f6e7c6)
Not a fit yet    →  Clay   (#9c4a2f / clay-100 #efd9cf)
Verified stamp   →  Palm   (#1f7a52 / palm-100) + ShieldCheck
Money amounts    →  Amber  (#d98a1e)
Funding sky      →  Night  (#15203a → night-700 #0b1326)
Roadmap done     →  Oasis / palm fill
Roadmap pending  →  Amber border
Roadmap locked   →  Ink-faint muted
```

---

## 3. Al Sadu Pattern System

### Philosophy
Al Sadu (السدو) is a UNESCO-listed Bedouin weaving tradition native to the communities of Al Qua'a and Al Ain. Its geometric motifs encode cultural identity, tribal affiliation, and desert vernacular. Using it as Hissati's signature element makes the product unmistakably local — built to feel native to this place — while remaining visually unique in the fintech/govtech space.

### Motifs Used
| Motif | Arabic | Visual | Usage |
|---|---|---|---|
| Al-'Ain (the eye) | العين | Hollow diamond ◇ | Hero band diamond centre |
| Al-Dal'a (camel's rib) | الضلع | Brown interlocking teeth | Hero band edge triangles |
| Selvedge (hem) | حرف النسيج | Slim triangle border | Card top edge, screen header |
| Dark selvedge | — | Gold+green on dark | Dark cards (pre-reg track) |

### SVG Pattern Definitions
```svg
<!-- Full hero band (56×40 tile) -->
<pattern id="saduBand" width="56" height="40" patternUnits="userSpaceOnUse">
  <rect width="56" height="40" fill="#F6F1E7"/>
  <line x1="0" y1="7" x2="56" y2="7" stroke="#6E4326" stroke-width="1.6"/>
  <line x1="0" y1="33" x2="56" y2="33" stroke="#6E4326" stroke-width="1.6"/>
  <!-- Al-'Ain eye diamond -->
  <polygon points="28,10 41,20 28,30 15,20" fill="none" stroke="#0E5C4A" stroke-width="2"/>
  <polygon points="28,15 34,20 28,25 22,20" fill="#CBA35C"/>
  <circle cx="28" cy="20" r="1.7" fill="#B23A1E"/>
  <!-- Al-Dal'a rib teeth -->
  <polygon points="0,13 7,20 0,27" fill="#6E4326"/>
  <polygon points="56,13 49,20 56,27" fill="#6E4326"/>
</pattern>

<!-- Slim selvedge (22×9 tile) — light bg -->
<pattern id="saduSlim" width="22" height="9" patternUnits="userSpaceOnUse">
  <rect width="22" height="9" fill="#F6F1E7"/>
  <polygon points="0,9 5.5,1 11,9" fill="#0E5C4A"/>
  <polygon points="11,9 16.5,1 22,9" fill="#B23A1E"/>
  <line x1="0" y1="9" x2="22" y2="9" stroke="#6E4326" stroke-width="1.3"/>
</pattern>

<!-- Slim selvedge — gold (almost-eligible cards) -->
<pattern id="saduGold" width="22" height="9" patternUnits="userSpaceOnUse">
  <rect width="22" height="9" fill="#FCF8EF"/>
  <polygon points="0,9 5.5,1 11,9" fill="#CBA35C"/>
  <polygon points="11,9 16.5,1 22,9" fill="#0E5C4A"/>
</pattern>

<!-- Dark selvedge — on deep green bg -->
<pattern id="saduDark" width="24" height="9" patternUnits="userSpaceOnUse">
  <rect width="24" height="9" fill="#16201B"/>
  <polygon points="0,9 6,1 12,9" fill="#CBA35C"/>
  <polygon points="12,9 18,1 24,9" fill="#B23A1E"/>
</pattern>
```

### Implementation Rules
1. The full hero band (`saduBand`, height 14px) appears **once** at the very top of the viewport below the app bar — nowhere else at that size.
2. The slim selvedge (`saduSlim`, height 9–11px) sits at the **top of every eligible card**, **top of every modal**, and **top of every screen section header**.
3. The gold selvedge (`saduGold`) marks **almost-eligible** cards.
4. The dark selvedge (`saduDark`) is used **only** on the dark pre-registration track card.
5. Never animate or rotate the band patterns. They are heritage motifs, not decoration.

---

## 4. Typography

### Typeface Stack
| Role | Family | Weight | Size Range | Notes |
|---|---|---|---|---|
| **Arabic / primary UI** | Tajawal | 400, 500, 700, 800 | 12–48px | Self-hosted, Arabic-first, supports EN |
| **English wordmark** | Poppins / Montserrat | 600 | 20px (wordmark) | Fallback; matches logo SVG |
| **Money & data** | IBM Plex Mono | 400, 500, 600 | 10–38px | AED amounts, match scores, verified stamps |
| **System fallback** | -apple-system, system-ui | — | — | If fonts fail to load |

### Type Scale
| Token | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| `--text-display` | 3.1rem / 49.6px | 800 | 1.02 | Hero h1 |
| `--text-h1` | 2.1rem / 33.6px | 800 | 1.05 | Page section titles |
| `--text-h2` | 1.5rem / 24px | 700 | 1.15 | Card group headings |
| `--text-h3` | 1.25rem / 20px | 700 | 1.2 | Modal titles, wizard Q |
| `--text-body-lg` | 1.08rem / 17.3px | 400 | 1.6 | Hero lede, long copy |
| `--text-body` | 1rem / 16px | 400–500 | 1.5 | Default body text |
| `--text-sm` | 0.875rem / 14px | 500 | 1.45 | Labels, wizard options |
| `--text-xs` | 0.75rem / 12px | 500 | 1.4 | Chips, tags, captions |
| `--text-xxs` | 0.6875rem / 11px | 400–500 | 1.3 | Mono stamps, sub-labels |
| `--mono-display` | 2.375rem / 38px | 600 | 1.1 | AED-within-reach count-up |
| `--mono-lg` | 1.5rem / 24px | 600 | 1.15 | AED amounts |
| `--mono-sm` | 0.75rem / 12px | 500 | 1.3 | Verified stamp, percentages |
| `--mono-xs` | 0.625rem / 10px | 400 | 1.2 | URL citations, dates |

### CSS Typography Tokens
```css
:root {
  --font-sans: 'Tajawal', -apple-system, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  --text-display: clamp(2.1rem, 3.6vw, 3.1rem);
  --text-h2:  1.5rem;
  --text-h3:  1.25rem;
  --text-body: 1rem;
  --text-sm:   0.875rem;
  --text-xs:   0.75rem;

  --mono-display: 2.375rem;
  --mono-lg:      1.5rem;
  --mono-sm:      0.75rem;
}
```

### Bilingual Typography Rules
| Context | EN | AR |
|---|---|---|
| Document direction | `dir="ltr"` | `dir="rtl"` |
| Text alignment | `text-start` (logical) | auto from `dir` |
| Money / URLs / dates | Always LTR (`dir="ltr"` on span) | Always LTR even in RTL context |
| AED figures | IBM Plex Mono, `ltr` | IBM Plex Mono, `ltr`, Arabic-Indic numerals optional |
| Bullet / list markers | Auto from Tailwind logical | Flipped by browser in RTL |

---

## 5. Spacing System

```css
/* 4-base unit scale */
--sp-1:  4px;
--sp-2:  8px;
--sp-3:  12px;
--sp-4:  16px;
--sp-5:  20px;
--sp-6:  24px;
--sp-8:  32px;
--sp-10: 40px;
--sp-12: 48px;
--sp-16: 64px;
--sp-20: 80px;
```

### Layout Grid
```
Max content width:   1180px
Page horizontal padding: 22px (sm: 16px)
Grid gap (cards):    14px
Grid gap (sections): 26px
Sidebar width:       320px
Sidebar gap:         26px
```

---

## 6. Border Radius

```css
--r-sm:  6px;   /* tags, stamps, chips */
--r-md:  10px;  /* inputs, small cards */
--r-lg:  14px;  /* cards, panels, modals */
--r-xl:  20px;  /* modal corners (wide) */
--r-full: 9999px; /* pills, badges */
```

---

## 7. Elevation / Shadow

```css
--shadow-card: 0 18px 40px -28px rgba(30, 40, 20, 0.45);
--shadow-modal: 0 30px 70px -20px rgba(0, 0, 0, 0.50);
--shadow-appbar: 0 1px 0 rgba(22, 32, 27, 0.22);  /* border-bottom replaces shadow */
```

---

## 8. Component Specifications

> Some specs below still use the legacy colour shorthand (`green`, `gold`, `bone`,
> `paper`, `green-tint`, `--r-lg`, …). Map them through §2: **green→oasis** (brand) or
> **palm** (eligibility), **gold→amber**, **bone→sand**, **paper→sand-100**,
> **ink-2→ink-soft**, **ink-3→ink-faint**. The live token source is the `@theme` block
> in `globals.css`. The sizing/layout values are accurate as-built.

### App Bar
```
Height:       56px (sticky)
Background:   rgba(246, 241, 231, 0.86) with backdrop-filter: blur(8px)
Border:       1px solid var(--color-line-2) bottom
Contents:     Brand (logo + wordmark) · Offline badge · Lang toggle · Restart btn
```

### Footer (`src/components/Footer.tsx`)
Site-wide chrome, rendered once in the root layout below `<main>` (every page).
The one place the chrome goes full deep-oasis — the dark green band that closes
each page; bilingual + RTL-safe via logical utilities.
```
Background:   var(--color-oasis)   [bg-oasis]   · text: sand-100
Max width:    5xl, padding 40px (py-10) / 24px sm
Row 1:        Brand (Hissati حصتي + one-line mission) ·· Support contact
Support:      "Questions or outdated data?" → mailto:support@hissati.org
              (amber-100 link, Mail icon, dir="ltr")
Row 2:        Hairline (sand-100/15) → trust strip (offline · N cited programs)
              ·· © 2026 Hissati
```

### Cards — Program Cards
```
Background:   var(--color-paper)
Border:       1px solid var(--color-line-2)
  — Eligible:   border-color: var(--color-green-line)
  — Almost:     border-color: var(--color-gold-line)
  — Not fit:    border-color: var(--color-line-2), opacity: 0.72
Border-radius: var(--r-lg)  [14px]
Top:          Slim Sadu selvedge (9px SVG band)
Padding:      15px 16px 16px
Shadow:       none (border suffices)
```

### Verified Stamp Component
```
Display:      inline-flex, items-center, gap: 6px
Font:         IBM Plex Mono, 11px, weight 500
              ("verified" label rendered in sans, semibold, tracked, for legibility)
Color:        var(--color-palm)  (#1f7a52 — green = trust)
Background:   palm-100 @ 70%
Border:       1px solid palm @ 25%
Padding:      4px 8px
Radius:       6px
Direction:    always ltr
Icon:         lucide ShieldCheck, 14px, currentColor (green)
Contents:     🛡 verified · {source-url} · {month·year}
              (source-url + date kept muted: text-palm/70)
```
Rationale: the stamp signals *trust in the evidence*, so it uses the eligibility green
(`palm`) — not the clay/red that reads as a warning. The shield + bolder "verified"
label make it legible at a glance.

### Match-Score Ring
```
Size:         46×46px
SVG circles:  r=19, stroke-width=5
Track:        Eligible → var(--color-green-tint) | Almost → var(--color-gold-tint)
Fill:         Eligible → #0E5C4A | Almost → #CBA35C
Value label:  IBM Plex Mono, 12px, 600, centered
```

### AED Within Reach (hero stat)
The headline is the **"AED within reach"**
stat — a mono count-up of conservative per-applicant value across open/rolling matches
(`src/lib/metrics.ts`), shown in the compact Overview stat strip above the dark
**"funding sky"** signature (`src/components/dashboard/Overview.tsx`,
`src/components/dashboard/FundingSky.tsx`).
```
Type:         Stat block (no arc) — "AED" label + mono number, over the funding sky
Stat number:  IBM Plex Mono, 38px (--mono-display), 600, var(--color-oasis-700)
Prefix:       "AED" label, mono, ink-soft
Funding sky:  Night gradient band (night → night-700); a sun rises as funding climbs
Animation:    Count-up number tween (~700ms easeInOutQuad) + `.animate-rise` on the
              sky/sun. The headline counts AED, not a 0–100 score.
```

### Wizard Option Buttons
```
Default:      bg bone, border line-2, radius 11px, p 14px 15px
Selected:     bg green-tint, border green, ic bg green
Hover:        border-color green-line
Font:         Tajawal 14.5px weight 500
Icon slot:    34×34px rounded-9 bg bone-2; selected: bg green
Checkmark:    22px circle, right/left edge; selected: bg green + ✓
Transition:   border-color 150ms ease
```

### Roadmap Step
```
Default:      bg bone, border line, radius 11px, p 11px
Done:         bg green-tint, border green-line
Locked:       opacity 0.5
Checkbox:     23×23px, radius 7px, border 2px gold; done: bg green + ✓
Title:        Tajawal 13px weight 600
Sub:          Tajawal 11.5px weight 400 ink-2
Unlocks pill: IBM Plex Mono 10.5px gold-deep
Cost badge:   IBM Plex Mono 11px ink weight 600, right
```

### Primary Button
```
Background:   var(--color-green)
Color:        white
Radius:       11px
Padding:      13px 20px
Font:         Tajawal 15px weight 700
Hover:        background var(--color-green-deep)
Disabled:     opacity 0.4, cursor not-allowed
```

### Gold CTA Button
```
Background:   var(--color-gold)
Color:        var(--color-ink)
Radius:       11px
Padding:      13px 20px
Font:         Tajawal 15px weight 700
```

### Ghost Button
```
Background:   transparent
Color:        var(--color-green-deep)
Border:       1.5px solid var(--color-green-line)
Radius:       11px
```

### Offline Badge
```
Display:      inline-flex, gap 7px, align-items center
Font:         12px Tajawal weight 500
Color:        var(--color-green-deep)
Background:   var(--color-green-tint)
Border:       1px solid var(--color-green-line)
Padding:      5px 11px
Radius:       999px
Pulse dot:    7×7px circle green, animation: opacity 0↔1 2s infinite
```

### Language Toggle
```
Structure:    flex row, border 1px line-2, radius 8px, overflow hidden
Buttons:      font-mono 12px weight 500, p 6px 12px
Active:       background green, color white
Inactive:     background transparent, color ink-2
```

### Status Pills
```
Eligible:     bg green-tint · color green-deep · "● Eligible now"
Almost:       bg gold-tint · color gold-deep · "● Almost eligible"
Not fit:      bg bone-2 · color ink-3 · "○ Not a fit yet"
Font:         11px weight 600, padding 4px 10px, radius 999px
```

---

## 9. Motion & Animation

### Principles
- Animate with purpose: the AED-within-reach count-up, the rising funding-sky sun (`.animate-rise`), and step unlock are the three **emotional moments**. Everything else is instant or 150ms.
- Respect `prefers-reduced-motion: reduce` — disable all transitions and animations.
- No looping decorative animation (the pulse dot is the single exception: it signals live state).

### Token Table
| Name | Duration | Easing | Usage |
|---|---|---|---|
| `--motion-fast` | 150ms | ease | Hover, focus ring, option select |
| `--motion-base` | 300ms | ease | Modal fade, view switch |
| `--motion-slow` | 650ms | cubic-bezier(0.2,0.7,0.2,1) | View enter (opacity+translateY) |
| `--motion-rise` | 700ms | cubic-bezier(0.22,1,0.36,1) | Funding-sky sun rise (`.animate-rise`) |
| `--motion-counter` | 700ms | easeInOutQuad | AED-within-reach count-up tween |

### View Transitions
```css
@keyframes viewEnter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}
.view.active { animation: viewEnter 0.5s ease; }
```

---

## 10. RTL / Bilingual Implementation

### Direction Strategy
```html
<!-- Document level — toggled by JS -->
<html lang="ar" dir="rtl">  <!-- Arabic mode -->
<html lang="en" dir="ltr">  <!-- English mode -->
```

### Tailwind Logical Utilities
```
Use logical (not physical) properties throughout:
  ms-auto   → margin-inline-start: auto
  ps-4      → padding-inline-start: 1rem
  text-start → text-align: start
  border-s  → border-inline-start
  start-0   → inset-inline-start: 0
```

### Money & Data Always LTR
```html
<!-- Wrap all AED amounts, URLs, dates in explicit ltr span -->
<span dir="ltr" class="font-mono">AED 500,000</span>
<span dir="ltr" class="font-mono text-xxs">verified · khalifafund.ae · 06·2026</span>
```

### Arabic Numerals (Optional)
For the Arabic version, AED amounts may use Eastern Arabic numerals:
```js
function toArabicNumerals(n) {
  return String(n).replace(/[0-9]/g, d =>
    '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]
  );
}
// 500000 → ٥٠٠٬٠٠٠ (use toLocaleString('ar-AE') in production)
```

---

## 11. Icon System

Use **Lucide React** (or inline SVG) for all UI icons. Core set:

| Icon | Usage |
|---|---|
| `ShieldCheck` | Verified / evidence stamp |
| `Check` / `CheckCircle` | Done states |
| `AlertTriangle` | Blocker warning |
| `ChevronRight/Left` | Navigation, wizard back |
| `Download` | PDF export |
| `Globe` | Language toggle |
| `Wifi` / `WifiOff` | Offline indicator |
| `Map` | Roadmap section |
| `FileText` | Required documents / checklist |
| `GitCompare` | Compare programs (per-row toggle + compare view) |
| `Pin` | Pin a program to the top of the Programs list (filled when pinned) |
| `ArrowUpRight` | External links / portal |
| `X` | Close modal |

Brand glyph (compass) is always the inline SVG from `Hissati-3-app-icon.svg`, never an icon font.

---

## 12. Accessibility

| Requirement | Implementation |
|---|---|
| Colour contrast | All text ≥ 4.5:1 on background (WCAG AA) |
| Focus visible | `focus-visible:ring-2 ring-green-deep ring-offset-2` |
| Keyboard nav | All interactive elements reachable by Tab; wizard operable without mouse |
| Semantic HTML | `<main>`, `<nav>`, `<aside>`, `<section>`, `<button>` (not `<div>`) |
| ARIA labels | `aria-label` on icon-only buttons; `aria-live="polite"` on hint updates |
| Reduced motion | `@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }` |
| RTL screen readers | `lang` and `dir` attributes on `<html>` and any mixed-direction spans |

---

## 13. Responsive Breakpoints

```css
/* Mobile-first — web-first priority means desktop is the base */
--bp-sm:  640px;   /* Small tablets */
--bp-md:  768px;   /* Tablets */
--bp-lg:  1024px;  /* Small desktop */
--bp-xl:  1180px;  /* Max content width */
```

### Layout Behaviour
| Viewport | Layout |
|---|---|
| ≥ 1024px | Two-column results (320px sidebar + content), 2-col card grid |
| 768–1023px | Single column, sidebar above content, 2-col card grid |
| < 768px | Single column, 1-col card grid, sticky appbar |

---

## 14. Design Dos & Don'ts

### DO
- Use the Sadu selvedge at the top of every card and modal.
- Use IBM Plex Mono for all AED amounts — always.
- Keep the Sadu band at the very top of the page (hero position only).
- Show the verified stamp under every AED figure.
- Use semantic colour: palm = eligible, almost = almost-eligible, clay = not-a-fit, amber = money.
- Count up the AED-within-reach stat (and rise the funding-sky sun) on every results render.
- Wrap AED numbers in `dir="ltr"` regardless of document direction.

### DON'T
- Don't use the navy-and-gold "UAE luxury" cliché — this palette is warm desert, not hotel branding.
- Don't rotate or animate the Sadu patterns.
- Don't put the full hero band (saduBand) inside cards — only the slim selvedge.
- Don't invent funding figures — every number must have a verified source stamp.
- Don't use generic icons for the brand mark — always use the Hissati compass SVG.
- Don't show a zero-results screen for "idea only" users — always show the pre-reg pathway.

---

## 15. Design-to-Code Mapping

| Design token | Tailwind class | CSS var |
|---|---|---|
| Oasis (brand) | `bg-oasis` / `text-oasis` | `--color-oasis` |
| Oasis tint | `bg-oasis-100` | `--color-oasis-100` |
| Amber (money) | `bg-amber` / `text-amber` | `--color-amber` |
| Palm (eligible) | `bg-palm` / `text-palm` | `--color-palm` |
| Almost | `bg-almost` / `text-almost` | `--color-almost` |
| Clay (not-a-fit) | `bg-clay` / `text-clay` | `--color-clay` |
| Night (funding sky) | `bg-night` | `--color-night` |
| Sand (page bg) | `bg-sand` | `--color-sand` |
| Sand surface | `bg-sand-100` | `--color-sand-100` |
| Ink | `text-ink` | `--color-ink` |
| Ink soft | `text-ink-soft` | `--color-ink-soft` |
| Font sans | `font-sans` | `--font-sans` |
| Font display | `font-display` | `--font-display` |
| Font mono | `font-mono` | `--font-mono` |
| Shadow card | `shadow-card` | `--shadow-card` |
| Radius card | `rounded-card` | `--radius-card` |

---

*This document is the single source of truth for all visual decisions in Hissati v1.0. Any deviation requires explicit sign-off from the team design lead.*
