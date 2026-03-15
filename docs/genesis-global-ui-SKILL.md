---
name: genesis-global-ui
description: >
  Design and build premium UI interfaces — dashboards, landing pages, mobile screens,
  tablet layouts, web apps, and components — using the Genesis Global visual design
  language extracted from the Genesis Global brand identity. Trigger this skill whenever
  the user references the Genesis Global brand, uploads the Genesis logo, or requests
  a dark luxury interface with gold/amber/orange/blue accents, glassmorphism panels,
  or premium animated design across any viewport. Also trigger for phrases like
  "Genesis style", "dark gold theme", "premium dark UI", "animated dashboard design",
  "responsive branded layout", or "branded web/tablet/mobile screen". Covers
  mobile-first, tablet, and desktop design simultaneously — animation principles,
  responsive layout structure, adaptive navigation, typography scaling, and component
  behaviour at every breakpoint — without dictating application content or domain logic.
---

# Genesis Global — UI Design Skill

A complete, viewport-aware design language reference for building interfaces faithful to the **Genesis Global** brand identity across **mobile, tablet, and desktop**. Every section specifies how design decisions adapt across all three contexts. This skill covers visual language only — it does not prescribe application content or domain logic.

---

## 1. Brand Visual Identity — Source of Truth

The Genesis Global logo communicates the full design language through four elements:

| Element | Visual | Design Implication |
|---|---|---|
| **Script wordmark** | Flowing gold italic script | Warmth, prestige, movement |
| **"GLOBAL" sub-text** | Spaced uppercase serif | Structure, clarity, authority |
| **Human figure** | Orange/red stylised form | Energy, dynamism, forward motion |
| **Globe motif** | Blue gradient sphere | Technology, global reach, trust |
| **Background** | Pure deep black | Premium, timeless, confident |

These five elements drive every color, spacing, type, and motion decision in this system.

---

## 2. Breakpoint System

This is the foundation every other section refers back to. Define these once, reference everywhere.

```css
/* ── Genesis Global Breakpoints ── */

/* xs  — compact mobile: small phones, portrait */
/* sm  — standard mobile: modern phones, portrait */
/* md  — tablet portrait + large phone landscape */
/* lg  — tablet landscape + small laptop */
/* xl  — desktop: standard monitors */
/* 2xl — wide desktop: large monitors */

:root {
  --bp-xs:  480px;
  --bp-sm:  640px;
  --bp-md:  768px;
  --bp-lg:  1024px;
  --bp-xl:  1280px;
  --bp-2xl: 1536px;
}
```

```css
/* Media query reference — use these exact values throughout */

/* Mobile only */
@media (max-width: 767px) { }

/* Tablet portrait */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Tablet landscape */
@media (min-width: 1024px) and (max-width: 1279px) { }

/* Tablet (portrait + landscape combined) */
@media (min-width: 768px) and (max-width: 1279px) { }

/* Desktop */
@media (min-width: 1280px) { }

/* Wide desktop */
@media (min-width: 1536px) { }
```

### Input Mode — Critical for Tablet

Tablet devices can be touch-only, pointer-only (with keyboard), or hybrid. Always design for both:

```css
/* Pointer: fine = mouse/trackpad → enable hover states */
@media (pointer: fine) {
  .card:hover { transform: translateY(-4px); }
  .nav-item:hover { color: var(--gg-gold-100); }
}

/* Pointer: coarse = touch → disable hover, enlarge targets */
@media (pointer: coarse) {
  .card:hover { transform: none; } /* No accidental hover on touch */
  .touch-target { min-height: 48px; min-width: 48px; }
}

/* Hover capability check — use instead of breakpoint for hover states */
@media (hover: hover) {
  .btn:hover { brightness(1.08); }
}
@media (hover: none) {
  .btn:active { brightness(1.08); } /* Use active instead */
}
```

---

## 3. Color System

All colors derived directly from the Genesis Global logo. Use CSS custom properties throughout — never hardcode raw hex values inside components.

```css
:root {
  /* ── Backgrounds ── */
  --gg-bg:             #080808;   /* Page-level — near-black, not pure */
  --gg-surface:        #101010;   /* Card / panel base */
  --gg-surface-raised: #161616;   /* Elevated layer — dropdowns, modals, drawers */
  --gg-surface-inset:  #060606;   /* Recessed — input wells, wells */

  /* ── Gold — primary brand accent (script wordmark) ── */
  --gg-gold-100:   #F5D76E;   /* Highlight, active hover */
  --gg-gold-200:   #D4AF37;   /* Primary gold — dominant accent */
  --gg-gold-300:   #B8961E;   /* Mid-tone, borders, dividers */
  --gg-gold-400:   #8A6E10;   /* Deep — pressed, shadow base */
  --gg-gold-glow:  rgba(212, 175, 55, 0.22);

  /* ── Ember / Orange — human figure ── */
  --gg-ember-100:  #FF9050;   /* Light — hover, highlight */
  --gg-ember-200:  #E8631A;   /* Primary — CTA, alerts, energy */
  --gg-ember-300:  #B84A0D;   /* Deep — pressed states */
  --gg-ember-glow: rgba(232, 99, 26, 0.20);

  /* ── Blue — globe motif ── */
  --gg-blue-100:   #5BB8F5;   /* Light — data highlights */
  --gg-blue-200:   #1A6FD4;   /* Primary — info, links, data display */
  --gg-blue-300:   #0F4A96;   /* Deep — pressed, focus rings */
  --gg-blue-glow:  rgba(26, 111, 212, 0.18);

  /* ── Semantic ── */
  --gg-success:    #2ECC71;
  --gg-warning:    #F0A500;
  --gg-danger:     #C0392B;

  /* ── Text ── */
  --gg-text-primary:   #F0EBE0;   /* Warm white — body copy */
  --gg-text-secondary: #8A7E6E;   /* Muted — labels, captions */
  --gg-text-disabled:  #3A342A;   /* Inactive */
  --gg-text-inverse:   #0A0A0A;   /* On gold/light surfaces */

  /* ── Borders ── */
  --gg-border-subtle:  rgba(212, 175, 55, 0.12);
  --gg-border-default: rgba(212, 175, 55, 0.22);
  --gg-border-strong:  rgba(212, 175, 55, 0.45);
}
```

### Gradient Recipes

```css
/* Page ambient background — never flat black */
.page-bg {
  background:
    radial-gradient(ellipse 60% 50% at 15% 60%,  rgba(212,175,55,0.06) 0%, transparent 100%),
    radial-gradient(ellipse 50% 40% at 85% 15%,  rgba(26,111,212,0.06) 0%, transparent 100%),
    radial-gradient(ellipse 40% 35% at 50% 95%,  rgba(232,99,26,0.04)  0%, transparent 100%),
    #080808;
}

/* Gold shimmer — brand hero text */
.shimmer-text {
  background: linear-gradient(
    115deg,
    #D4AF37 0%, #F5D76E 35%, #D4AF37 55%, #8A6E10 75%, #D4AF37 100%
  );
  background-size: 220% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Glass card surface — primary panel treatment */
.glass-card {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--gg-border-default);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
}

/* CTA button gradient */
.cta-fill {
  background: linear-gradient(135deg, var(--gg-ember-200) 0%, var(--gg-gold-200) 100%);
  box-shadow: 0 4px 24px var(--gg-ember-glow), 0 0 0 1px rgba(232,99,26,0.3);
}

/* Informational / data surface */
.info-surface {
  background: linear-gradient(135deg, rgba(26,111,212,0.10), rgba(26,111,212,0.04));
  border: 1px solid rgba(26,111,212,0.22);
}
```

---

## 4. Typography

### Font Import

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
```

### Font Roles

| Role | Family | Weight | Usage |
|---|---|---|---|
| **Display / Brand** | Cinzel | 600–700 | Hero headings, wordmarks, section titles |
| **Editorial** | Cormorant Garamond | 300 italic | Taglines, pull quotes, decorative subtitles |
| **UI / Body** | DM Sans | 400–500 | All interface copy, labels, body, data |

### Responsive Type Scale

All sizes use `clamp()` so they scale continuously between breakpoints. No hard jumps.

```css
/* Display — hero / splash only */
.type-display {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.8rem, 4vw + 0.5rem, 4rem);
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.1;
}

/* Page / section title */
.type-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.25rem, 2.5vw + 0.25rem, 2rem);
  font-weight: 600;
  letter-spacing: 0.05em;
  line-height: 1.25;
}

/* Card / component heading */
.type-heading {
  font-family: 'Cinzel', serif;
  font-size: clamp(0.875rem, 1vw + 0.25rem, 1.125rem);
  font-weight: 500;
  letter-spacing: 0.08em;
  line-height: 1.4;
}

/* Editorial tagline */
.type-tagline {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: clamp(1.05rem, 1.5vw + 0.25rem, 1.4rem);
  font-weight: 300;
  line-height: 1.6;
}

/* Body copy */
.type-body {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(0.875rem, 1vw + 0.125rem, 1rem);
  font-weight: 400;
  line-height: 1.65;
}

/* UI label — uppercase, tracked */
.type-label {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(0.65rem, 0.8vw + 0.1rem, 0.8rem);
  font-weight: 500;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

/* Stat / data value */
.type-data {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.4rem, 2.5vw + 0.5rem, 2.25rem);
  font-weight: 600;
  letter-spacing: 0.02em;
}
```

### Per-Viewport Typography Adjustments

```css
/* Mobile — tighten letter-spacing slightly, increase line-height for reading */
@media (max-width: 767px) {
  .type-display  { letter-spacing: 0.04em; }
  .type-label    { letter-spacing: 0.07em; } /* Less cramped at small size */
  .type-body     { line-height: 1.7; }
}

/* Tablet — balanced defaults, no override needed unless fine-tuning */
@media (min-width: 768px) and (max-width: 1279px) {
  .type-display  { letter-spacing: 0.055em; }
}

/* Desktop — full expressive spacing */
@media (min-width: 1280px) {
  .type-display  { letter-spacing: 0.06em; }
  .type-label    { letter-spacing: 0.09em; }
}
```

---

## 5. Spacing & Shape

```css
/* 4px base unit — same across all viewports, scaled via context */
--space-1:  4px;   --space-2:  8px;   --space-3:  12px;
--space-4:  16px;  --space-5:  20px;  --space-6:  24px;
--space-8:  32px;  --space-10: 40px;  --space-12: 48px;
--space-16: 64px;  --space-20: 80px;  --space-24: 96px;

/* Border radius — same across viewports */
--radius-sm:   6px;
--radius-md:   10px;
--radius-lg:   16px;
--radius-xl:   24px;
--radius-2xl:  32px;
--radius-full: 9999px;

/* Elevation — dark-mode optimised */
--shadow-sm: 0 2px 8px  rgba(0,0,0,0.35);
--shadow-md: 0 8px 24px rgba(0,0,0,0.45);
--shadow-lg: 0 16px 48px rgba(0,0,0,0.55);
--shadow-xl: 0 24px 72px rgba(0,0,0,0.65);

/* Brand glow shadows */
--shadow-gold-sm: 0 4px 16px var(--gg-gold-glow);
--shadow-gold-md: 0 8px 32px var(--gg-gold-glow), 0 0 1px var(--gg-border-strong);
--shadow-ember:   0 4px 24px var(--gg-ember-glow);
--shadow-blue:    0 4px 20px var(--gg-blue-glow);
```

### Responsive Padding Scale

Page-level padding adapts so content never feels cramped or stretched:

```css
/* Page content padding (horizontal) */
.page-padding {
  padding-left:  var(--space-4);   /* Mobile: 16px */
  padding-right: var(--space-4);
}
@media (min-width: 768px) {
  .page-padding {
    padding-left:  var(--space-8);   /* Tablet: 32px */
    padding-right: var(--space-8);
  }
}
@media (min-width: 1280px) {
  .page-padding {
    padding-left:  var(--space-10);  /* Desktop: 40px */
    padding-right: var(--space-10);
  }
}

/* Section vertical rhythm */
.section-gap { margin-bottom: var(--space-6); }  /* Mobile: 24px */
@media (min-width: 768px)  { .section-gap { margin-bottom: var(--space-8);  } } /* 32px */
@media (min-width: 1280px) { .section-gap { margin-bottom: var(--space-10); } } /* 40px */
```

---

## 6. Animation System

Motion is **deliberate and premium** — never decorative noise. All animations serve a purpose: entrance, state change, ambient brand presence, or live data communication.

### Timing Tokens

```css
--duration-instant:  80ms;   /* Micro-feedback — checkbox tick, toggle */
--duration-fast:    150ms;   /* Button press, badge appear */
--duration-base:    280ms;   /* Card hover, nav transitions */
--duration-slow:    500ms;   /* Page entrance, modal open */
--duration-crawl:   800ms;   /* Hero reveal, staggered sequences */
--duration-ambient: 3500ms;  /* Looping ambient — shimmer, float, pulse */

--ease-out:    cubic-bezier(0.25, 0.8,  0.25, 1);
--ease-in:     cubic-bezier(0.55, 0,    1,    0.45);
--ease-inout:  cubic-bezier(0.45, 0,    0.55, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Slight overshoot for entrances */
--ease-linear: linear;
```

### Core Keyframes

```css
/* ── Entrance ── */
@keyframes gg-slide-up {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes gg-slide-right {
  from { opacity: 0; transform: translateX(-18px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes gg-fade-in {
  from { opacity: 0; } to { opacity: 1; }
}
@keyframes gg-scale-in {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}

/* ── Ambient loops ── */
@keyframes gg-shimmer {
  0%   { background-position: 0%   center; }
  100% { background-position: 220% center; }
}
@keyframes gg-float {
  0%, 100% { transform: translateY(0);   }
  50%       { transform: translateY(-7px); }
}
@keyframes gg-pulse-gold {
  0%, 100% { box-shadow: 0 0 12px var(--gg-gold-glow); }
  50%       { box-shadow: 0 0 32px var(--gg-gold-glow), 0 0 64px rgba(212,175,55,0.10); }
}
@keyframes gg-pulse-ember {
  0%, 100% { box-shadow: 0 0 12px var(--gg-ember-glow); }
  50%       { box-shadow: 0 0 32px var(--gg-ember-glow); }
}
@keyframes gg-border-breathe {
  0%, 100% { border-color: var(--gg-border-default); }
  50%       { border-color: var(--gg-border-strong); }
}
@keyframes gg-scan {
  0%   { top: -3px; opacity: 0.5; }
  100% { top: 110%; opacity: 0;   }
}
@keyframes gg-dot-live {
  0%, 100% { opacity: 1;   transform: scale(1);   }
  50%       { opacity: 0.5; transform: scale(1.6); }
}
@keyframes gg-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

### Usage Patterns

```css
/* Staggered card entrance — apply to grid children */
.card:nth-child(1) { animation: gg-slide-up var(--duration-slow) var(--ease-out) both 0.05s; }
.card:nth-child(2) { animation: gg-slide-up var(--duration-slow) var(--ease-out) both 0.12s; }
.card:nth-child(3) { animation: gg-slide-up var(--duration-slow) var(--ease-out) both 0.19s; }
.card:nth-child(4) { animation: gg-slide-up var(--duration-slow) var(--ease-out) both 0.26s; }
.card:nth-child(5) { animation: gg-slide-up var(--duration-slow) var(--ease-out) both 0.33s; }
.card:nth-child(6) { animation: gg-slide-up var(--duration-slow) var(--ease-out) both 0.40s; }

/* Sidebar items slide in from left */
.nav-item { animation: gg-slide-right var(--duration-slow) var(--ease-out) both; }

/* Card hover — pointer devices only */
@media (hover: hover) {
  .card {
    transition:
      transform      var(--duration-base) var(--ease-out),
      border-color   var(--duration-base) var(--ease-out),
      box-shadow     var(--duration-base) var(--ease-out);
  }
  .card:hover {
    transform:    translateY(-4px);
    border-color: var(--gg-border-strong);
    box-shadow:   var(--shadow-lg), var(--shadow-gold-sm);
  }
}

/* Touch active feedback — all devices */
.card:active {
  transform: scale(0.98);
  transition: transform var(--duration-fast) var(--ease-out);
}

/* Hero accent — decorative float */
.hero-accent { animation: gg-float 7s ease-in-out infinite; }

/* Brand shimmer text */
.brand-text  { background-size: 220% auto; animation: gg-shimmer 4s var(--ease-linear) infinite; }

/* Scan line — live data panels */
.scan-line {
  position: absolute; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--gg-gold-glow), transparent);
  animation: gg-scan 5s linear infinite;
  pointer-events: none;
}

/* Live indicator dot */
.live-dot { animation: gg-dot-live 1.8s ease-in-out infinite; }

/* Featured / pinned card border pulse */
.card-featured { animation: gg-border-breathe 4s ease-in-out infinite; }

/* Loading spinner */
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--gg-border-subtle);
  border-top-color: var(--gg-gold-200);
  border-radius: var(--radius-full);
  animation: gg-rotate 0.8s linear infinite;
}
```

### Animation Accessibility

```css
/* Respect reduced-motion — kill all looping animations, keep state transitions */
@media (prefers-reduced-motion: reduce) {
  .hero-accent,
  .brand-text,
  .scan-line,
  .live-dot,
  .card-featured,
  .spinner { animation: none; }

  /* Keep transitions but slow them slightly for legibility */
  .card { transition-duration: var(--duration-fast); }
}
```

---

## 7. Component Design Language

All components defined by visual style only — content-agnostic.

### 7.1 — Card / Panel

```
Anatomy (all viewports):
┌─ border: 1px solid --gg-border-default ──────────────────────┐
│  border-radius: --radius-lg                                   │
│  background: glass-card recipe                                │
│  overflow: hidden                                             │
│                                                               │
│  [Optional scan-line — position: absolute, top: 0, z: 1]     │
│  Header row: type-heading + optional badge                    │
│  Content area                                                 │
│  [Optional 2px progress bar — gold gradient, bottom]         │
└───────────────────────────────────────────────────────────────┘

Padding per viewport:
  Mobile:  --space-4  (16px)
  Tablet:  --space-5  (20px)
  Desktop: --space-6  (24px)

Hover (pointer devices): translateY(-4px) + border → --gg-border-strong, 280ms
Active (touch):          scale(0.98), 150ms
Featured variant:        animation: gg-border-breathe
```

### 7.2 — Button Variants

All buttons have a minimum touch target of 44px height regardless of visible size.

```
PRIMARY (CTA):
  background:    cta-fill gradient (ember → gold)
  color:         --gg-text-inverse
  border-radius: --radius-md
  padding:       Mobile 13px 24px | Tablet 12px 28px | Desktop 11px 32px
  font:          type-label
  box-shadow:    --shadow-ember
  min-height:    44px (all viewports)
  hover:         brightness(1.08), scale(1.02) — pointer only
  active:        scale(0.97)

SECONDARY (Ghost Gold):
  background:    transparent
  border:        1px solid --gg-border-default
  color:         --gg-gold-200
  hover:         border → --gg-border-strong, bg → rgba(212,175,55,0.06)

GHOST BLUE:
  border:        1px solid rgba(26,111,212,0.30)
  color:         --gg-blue-100
  hover:         bg → rgba(26,111,212,0.08)

ICON BUTTON:
  width/height:  Mobile 48px | Tablet 44px | Desktop 40px
  border-radius: --radius-md or --radius-full (contextual)
  border:        1px solid --gg-border-default

FAB (Floating Action Button):
  width/height:  Mobile 56px | Tablet 52px | Desktop 48px
  border-radius: --radius-full
  background:    cta-fill
  box-shadow:    --shadow-ember
  animation:     gg-pulse-ember 2.5s infinite
  position:      Mobile fixed bottom-right | Tablet inline or fixed | Desktop inline
```

### 7.3 — Status & Badges

```
LIVE indicator:
  background:    rgba(26,111,212,0.14)
  border:        1px solid rgba(26,111,212,0.30)
  border-radius: --radius-full
  padding:       Mobile 4px 10px | Tablet/Desktop 5px 12px
  font:          type-label, color --gg-blue-100
  dot:           6×6px, --gg-blue-100, animation: gg-dot-live

POSITIVE:  bg rgba(46,204,113,0.12)  border rgba(46,204,113,0.25)  text #2ECC71
WARNING:   bg rgba(240,165,0,0.12)   border rgba(240,165,0,0.25)   text --gg-warning
DANGER:    bg rgba(192,57,43,0.12)   border rgba(192,57,43,0.25)   text --gg-danger
NEUTRAL:   bg rgba(212,175,55,0.10)  border --gg-border-default     text --gg-gold-200
```

### 7.4 — Input Fields

```
Height:
  Mobile:  48px
  Tablet:  46px
  Desktop: 44px

Background:    --gg-surface-inset
Border:        1px solid --gg-border-subtle
Border-radius: --radius-md
Padding:       0 --space-4
Font:          type-body, color --gg-text-primary
Placeholder:   --gg-text-disabled

Focus ring:    border-color → --gg-border-strong
               box-shadow: 0 0 0 3px var(--gg-gold-glow)
               transition: 150ms ease-out

Icon prefix/suffix: 16px, --gg-text-secondary
Label above input:  type-label, --gg-text-secondary, margin-bottom --space-2
Error state:        border-color → --gg-danger, box-shadow with danger glow
```

### 7.5 — Progress / Data Bar

```
Track:  height 3px | bg rgba(255,255,255,0.06) | radius --radius-full

Fill variants:
  Gold:  linear-gradient(90deg, --gg-gold-400,  --gg-gold-100)
  Blue:  linear-gradient(90deg, --gg-blue-300,  --gg-blue-100)
  Ember: linear-gradient(90deg, --gg-ember-300, --gg-ember-100)

Micro bar (beneath stat):   height 2px, margin-top --space-3
Standard progress bar:      height 6px, radius --radius-full
Thick feature bar:          height 10px, radius --radius-full
```

### 7.6 — Modal / Drawer

```
MODAL (Desktop + Tablet landscape):
  max-width:     560px (Tablet) | 640px (Desktop)
  border-radius: --radius-xl
  padding:       --space-8
  background:    --gg-surface-raised
  border:        1px solid --gg-border-default
  box-shadow:    --shadow-xl, --shadow-gold-sm
  Overlay:       rgba(0,0,0,0.75), backdrop-filter: blur(4px)
  Animation:     gg-scale-in 300ms ease-out

BOTTOM SHEET (Mobile + Tablet portrait):
  border-radius: --radius-xl --radius-xl 0 0
  padding:       --space-6 --space-4
  background:    --gg-surface-raised
  border-top:    1px solid --gg-border-default
  Animation:     slide up from bottom, 350ms ease-out
  Handle bar:    4×36px, --gg-border-default, radius --radius-full, centered top
  Max-height:    90dvh, overflow-y: auto
```

### 7.7 — Tooltip

```
Background:    rgba(14,14,14,0.96)
Border:        1px solid --gg-border-default
Border-radius: --radius-sm
Padding:       --space-2 --space-3
Font:          type-body 13px, --gg-text-primary
Shadow:        --shadow-md

Mobile:        Convert tooltips to bottom sheet or inline contextual text
               (tooltips are not accessible on touch — avoid hover-only tooltips)
Tablet:        Show only on pointer:fine devices; suppress on pointer:coarse
Desktop:       Standard tooltip behaviour
```

---

## 8. Navigation — All Viewports

Navigation is the most viewport-sensitive component. Each breakpoint gets a distinct pattern.

### 8.1 — Mobile Navigation (< 768px)

**Bottom Tab Bar** — primary navigation pattern:

```
Position:      fixed bottom: 0, left: 0, right: 0
Height:        56px + env(safe-area-inset-bottom)
Background:    rgba(8,8,8,0.94)
Backdrop:      blur(20px) saturate(1.3)
Border-top:    1px solid --gg-border-subtle
z-index:       100

Item layout:
  display:     flex-column, items-center, justify-center
  gap:         3px (icon to label)
  Icon:        22×22px stroke-based, opacity 0.5 resting
  Label:       10px, type-label, --gg-text-disabled resting
  Min target:  48×56px (full height of bar)

Active state:
  Icon opacity: 1
  Icon color:   --gg-gold-100
  Label color:  --gg-gold-100

Active indicator: 2px wide × 20px horizontal bar above icon
                  background: --gg-gold-200
                  border-radius: --radius-full

FAB (centre item):
  Width/height: 52px
  Border-radius: --radius-full
  Background:   cta-fill
  Margin-top:   -16px (floats above bar)
  Box-shadow:   --shadow-ember
  Animation:    gg-pulse-ember 2.5s infinite
  Icon:         24px, white

Top header bar (mobile):
  Height:       56px
  Background:   rgba(8,8,8,0.92), blur(12px)
  Border-bottom: 1px solid --gg-border-subtle
  Content:      Logo left, page title centre, icon-button right
  Position:     sticky top: 0
```

### 8.2 — Tablet Navigation (768px – 1279px)

Tablet is a **transitional viewport** — it can use either a compact sidebar or a top navigation bar depending on orientation.

**Tablet Portrait (768px – 1023px) — Icon Sidebar (collapsed)**:

```
Width:         64px — icons only, no labels
Background:    --gg-surface
Border-right:  1px solid --gg-border-subtle
Height:        100dvh, position: fixed or sticky
z-index:       50

Logo zone:
  Height:      64px
  Content:     Brand icon/monogram only (not full wordmark)
  Border-bottom: 1px solid --gg-border-subtle

Nav item:
  Width:       64px, height: 52px
  Layout:      centre icon only
  Icon:        22×22px stroke-based, opacity 0.55 resting
  Border-left: 3px solid transparent
  Tooltip:     Show label on hover (pointer:fine only)

Active state:
  Icon opacity: 1, color --gg-gold-100
  Border-left:  3px solid --gg-gold-200
  Background:   rgba(212,175,55,0.08)

Bottom section:
  Settings + profile icon at bottom of sidebar
  Divider: 1px solid --gg-border-subtle above them
```

**Tablet Landscape (1024px – 1279px) — Expanded Sidebar**:

```
Width:         200px — icons + labels visible
Background:    --gg-surface
Border-right:  1px solid --gg-border-subtle

Logo zone:
  Height:      64px, padding --space-4
  Content:     Monogram + abbreviated brand name

Nav item:
  Padding:     10px 16px
  Layout:      flex-row, icon left + label right, gap --space-3
  Icon:        18×18px
  Label:       type-label 11px, --gg-text-secondary resting

Active state:
  Border-left: 2px solid --gg-gold-200
  Background:  linear-gradient(90deg, rgba(212,175,55,0.09), transparent)
  Label color: --gg-gold-100
```

**Tablet — Hamburger Top Bar (alternative pattern)**:

Use this when the layout is content-heavy and sidebar wastes horizontal space.

```
Height:        60px
Background:    rgba(8,8,8,0.92), blur(16px)
Border-bottom: 1px solid --gg-border-subtle
Position:      sticky top: 0

Content:       [Hamburger icon] [Logo / brand name] [Action buttons right]

Hamburger:     3 lines → gold, 20px icon, 44×44px target
Drawer:        slides from left, 280px wide, full height, --gg-surface-raised bg
               Overlay: rgba(0,0,0,0.6) closes drawer on tap
               Content: full sidebar nav items (icon + label)
               Animation: translateX(-280px) → translateX(0), 300ms ease-out
```

### 8.3 — Desktop Navigation (≥ 1280px)

**Full Sidebar**:

```
Width:         220–240px
Background:    --gg-surface
Border-right:  1px solid --gg-border-subtle
Height:        100dvh, position: fixed or sticky
z-index:       40

Logo zone:
  Height:      72px, padding --space-6
  Content:     Full brand wordmark + tagline or version
  Border-bottom: 1px solid --gg-border-subtle

Nav section headers:
  font:        type-label 10px, --gg-text-disabled
  padding:     --space-5 --space-5 --space-2
  letter-spacing: 0.12em

Nav item:
  Padding:     12px 20px
  Layout:      flex-row, icon left + label right, gap --space-3
  Icon:        16×16px stroke-based, opacity 0.55 resting
  Label:       type-label, --gg-text-secondary resting
  Border-left: 2px solid transparent

Active / hover state:
  Border-left:  2px solid --gg-gold-200
  Background:   linear-gradient(90deg, rgba(212,175,55,0.09), transparent)
  Color:        --gg-gold-100
  Icon opacity: 1
  Transition:   200ms ease-out

Bottom zone:
  User avatar + name + settings
  Divider: 1px solid --gg-border-subtle above
  padding: --space-4 --space-5

Top header bar (desktop):
  Height:      64px
  Background:  rgba(8,8,8,0.88), blur(12px)
  Border-bottom: 1px solid --gg-border-subtle
  Position:    sticky top: 0, z-index: 40
  Content:     page title left, search + user actions right
```

---

## 9. Layout System — All Viewports

### 9.1 — Mobile Layout (< 768px)

```
┌──────────────────────┐
│  TOP HEADER (56px)   │  sticky, blurred bg
│──────────────────────│
│                      │
│  HERO CARD           │  Full-width
│  Full bleed, --xl    │  border-radius: --radius-xl
│                      │  padding: --space-5
│──────────────────────│
│  STAT GRID (2-col)   │  gap: --space-3
│  [stat] [stat]       │  padding: 0 --space-4
│──────────────────────│
│  HORIZONTAL SCROLL   │  card track, scroll-snap
│  ← [card] [card] →  │  card width: 80vw max 280px
│──────────────────────│
│  STACKED SECTIONS    │  full-width cards
│  padding: 0 --space-4│
│                      │
│  ↕ vertical scroll   │
│──────────────────────│
│  BOTTOM NAV (fixed)  │  56px + safe-area
└──────────────────────┘

Content max-width: 100%
Horizontal padding: --space-4 (16px) on page container
Card internal padding: --space-4 (16px)
Grid gap: --space-3 (12px)
Section gap: --space-6 (24px)
```

### 9.2 — Tablet Portrait Layout (768px – 1023px)

```
┌───────────────────────────────────────────┐
│  TOP HEADER (60px, sticky)                │
├──────┬────────────────────────────────────┤
│      │                                    │
│ ICON │   HERO CARD                        │
│ SIDE │   Full remaining width             │
│ BAR  │   padding: --space-5               │
│(64px)│                                    │
│      ├────────────────────────────────────┤
│      │  STAT GRID (2-col or 3-col)        │
│      │  gap: --space-4                    │
│      ├────────────────────────────────────┤
│      │  MAIN CHART  │  SIDE PANEL (opt.)  │
│      │  (full-width or 60/40 split)       │
│      ├────────────────────────────────────┤
│      │  STACKED SECTIONS                  │
│      │  padding: --space-6                │
└──────┴────────────────────────────────────┘

Content area grid: 2-column capable
Horizontal padding: --space-6 (24px)
Card internal padding: --space-5 (20px)
Grid gap: --space-4 (16px)
Section gap: --space-8 (32px)
No bottom nav — sidebar replaces it
```

### 9.3 — Tablet Landscape Layout (1024px – 1279px)

```
┌────────────────────────────────────────────────────┐
│  TOP HEADER (64px, sticky)                         │
├─────────┬──────────────────────────────────────────┤
│         │                                          │
│EXPANDED │   STAT ROW (3-col or 4-col grid)         │
│SIDEBAR  │   ──────────────────────────────         │
│ (200px) │   MAIN CHART (2/3 width)  │  SIDE (1/3)  │
│         │   ──────────────────────────────         │
│         │   SECONDARY SECTIONS (2-col)             │
│         │                                          │
└─────────┴──────────────────────────────────────────┘

Content area: calc(100% - 200px)
Horizontal padding: --space-6 (24px)
Card internal padding: --space-5 (20px)
Grid gap: --space-5 (20px)
Section gap: --space-8 (32px)
```

### 9.4 — Desktop Layout (≥ 1280px)

```
┌──────────────────────────────────────────────────────────────┐
│  FULL SIDEBAR (240px)  │  TOP HEADER (64px, sticky)          │
│                        ├──────────────────────────────────────│
│  Logo zone             │                                      │
│  Nav sections          │   MAIN CONTENT AREA                  │
│  Nav items             │   max-width: 1400px                  │
│                        │   padding: --space-10                │
│  ── bottom ──          │                                      │
│  User + Settings       │   STAT ROW (4-col) ─────────────     │
│                        │   CHART (2fr) │ SIDE PANEL (1fr)     │
│                        │   ──────────────────────────         │
│                        │   SECONDARY GRID (3-col or 2-col)   │
└────────────────────────┴──────────────────────────────────────┘

Content max-width: 1400px, margin: 0 auto
Horizontal padding: --space-10 (40px)
Card internal padding: --space-6 (24px)
Grid gap: --space-5 (20px)
Section gap: --space-10 (40px)
```

### 9.5 — Responsive Grid Patterns

```css
/* Stat / KPI row — adapts columns per viewport */
.stat-grid {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(2, 1fr);         /* Mobile: 2-col */
}
@media (min-width: 768px) {
  .stat-grid { grid-template-columns: repeat(3, 1fr); gap: var(--space-4); } /* Tablet portrait */
}
@media (min-width: 1024px) {
  .stat-grid { grid-template-columns: repeat(4, 1fr); }                      /* Tablet landscape+ */
}

/* Primary content + side panel */
.content-with-panel {
  display: grid;
  grid-template-columns: 1fr;           /* Mobile: stacked */
  gap: var(--space-4);
}
@media (min-width: 768px) {
  .content-with-panel { grid-template-columns: 1fr 1fr; }                    /* Tablet: equal */
}
@media (min-width: 1280px) {
  .content-with-panel { grid-template-columns: 2fr 1fr; }                    /* Desktop: 2/3 + 1/3 */
}

/* Feature card grid */
.card-grid {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: 1fr;                    /* Mobile: single */
}
@media (min-width: 640px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-4); } /* Sm: 2-col */
}
@media (min-width: 1024px) {
  .card-grid { grid-template-columns: repeat(3, 1fr); }                      /* Tablet lg+: 3-col */
}
@media (min-width: 1280px) {
  .card-grid { grid-template-columns: repeat(4, 1fr); gap: var(--space-5); } /* Desktop: 4-col */
}

/* Always use minmax(0, 1fr) to prevent grid blowout */
.safe-grid {
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
}
```

---

## 10. Viewport-Specific Rules Summary

### Mobile (< 768px)

- Single-column layout; no sidebars
- Bottom tab bar for primary navigation; fixed, blurred, safe-area aware
- Hero card full-width with `--radius-xl`
- Horizontal scroll tracks with `scroll-snap` for secondary card rows
- Font floor: 14px readable, 11px decorative minimum
- Touch targets: 48px preferred, 44px absolute minimum
- `viewport-fit=cover` + `env(safe-area-inset-bottom)` always present
- `-webkit-tap-highlight-color: transparent` on all interactive elements
- No hover-only UI — all interactions accessible via `:active`
- `backdrop-filter` only on fixed overlays, never on scrolling containers
- Modals become bottom sheets; tooltips become inline callouts or long-press sheets
- FAB positioned `fixed bottom-right`, 24px from edges, 80px above bottom nav

### Tablet Portrait (768px – 1023px)

- 64px collapsed icon sidebar replaces bottom nav
- Top header bar remains visible
- 2–3 column content grids
- Bottom sheets for modals still appropriate; side drawers on hamburger tap
- Touch targets remain 44px minimum (device may be touch-only)
- `pointer: coarse` check for hover state suppression
- Hero card retains full width within content area
- Horizontal scroll tracks become 2-up visible cards (not single peek)

### Tablet Landscape (1024px – 1279px)

- 200px expanded sidebar with icons + labels
- 3–4 column content grids
- Side panel layouts (2fr/1fr) become possible
- Hover states enabled — most tablet landscape users have keyboard/trackpad
- Still include touch-friendly target sizes (some users touch in landscape)
- Modals use centred overlay (not bottom sheet)
- Typography sizes increase slightly — more reading distance from screen

### Desktop (≥ 1280px)

- 240px full sidebar with logo zone, nav sections, user zone
- 4-column stat grids, 3-column feature grids
- Full hover interactions: card lift, border glow, nav highlight
- Tooltips on hover enabled
- `max-width: 1400px` on content area — content should not stretch to fill 2560px
- Scan lines, ambient animations, float effects — all run without performance concern
- FAB becomes an inline button in content area rather than fixed floating

---

## 11. Chart & Data Visualisation

```
Grid lines:   rgba(255,255,255,0.04)
Axis text:    type-label, --gg-text-secondary
Tooltip bg:   rgba(14,14,14,0.96)
Tooltip border: 1px solid --gg-border-default
Tooltip title: --gg-gold-200, type-label
Tooltip body:  --gg-text-primary, type-body
Tooltip radius: --radius-md

Dataset order:
  1st: --gg-gold-200  — area fill: gold top → transparent bottom
  2nd: --gg-blue-200  — area fill: blue top → transparent bottom
  3rd: --gg-ember-200 — dashed stroke only (4,3 dash pattern)

Point dots:   4px radius, stroke color fill, 2px solid --gg-bg border
Donut gap:    3px between segments
Donut centre: type-data with shimmer animation

Responsive chart heights:
  Mobile:          180–220px
  Tablet portrait: 240–280px
  Tablet landscape:260–300px
  Desktop:         280–360px

Chart container:
  Mobile:  Full-width card, no padding reduction
  Tablet:  Full-width or 60% column
  Desktop: 2/3 column in split layouts
```

---

## 12. Texture & Atmosphere

These micro-details elevate the design from "dark theme" to "luxury brand":

1. **Page background** — always the 3-radial ambient gradient; never solid `#000` or `#080808`. Radial positions can shift per viewport — on mobile, compress to 80% height.

2. **Glass panels** — `backdrop-filter: blur(16px)` with 0.025–0.04 white fill. On low-power devices (`@media (prefers-reduced-transparency: reduce)`) fall back to `--gg-surface` + border.

3. **Scan line** — on any live-data or real-time panel, add the `.scan-line` element. It communicates live state without flashing numbers.

4. **Decorative orb** — 200–400px blurred radial circle in `--gg-gold-glow` or `--gg-blue-glow`, `position: absolute, pointer-events: none`, behind hero content. Scaled down on mobile (120–180px).

5. **Left border accent** — active nav item uses a left border (2px, `--gg-gold-200`), not underline. Consistent across collapsed (3px on icon bar) and expanded sidebars.

6. **Icon style** — stroke-based at 1.5px stroke-width throughout. Filled icons feel too heavy against the refined Cinzel type.

7. **Numeric display** — all stat/metric values in Cinzel. The serif numerals echo the brand wordmark and signal "data of consequence". Labels beneath them in DM Sans uppercase.

8. **Dividers** — always `--gg-border-subtle`, 1px. Never use `<hr>` with default styling; always apply explicitly.

9. **Scrollbar** — custom styled on webkit; thin 4px scrollbar, `--gg-gold-400` thumb, `--gg-surface` track.

```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--gg-surface); }
::-webkit-scrollbar-thumb { background: var(--gg-gold-400); border-radius: var(--radius-full); }
::-webkit-scrollbar-thumb:hover { background: var(--gg-gold-300); }
```

---

## 13. Quality Checklist

Run this before finalising any Genesis Global interface. Check all three viewport columns.

| Criterion | Mobile | Tablet | Desktop |
|---|---|---|---|
| Page bg uses 3-radial ambient gradient | ✓ | ✓ | ✓ |
| All panels use glass recipe + gold border | ✓ | ✓ | ✓ |
| At least one ambient animation present | ✓ | ✓ | ✓ |
| Headings in Cinzel, body in DM Sans | ✓ | ✓ | ✓ |
| All colours via `--gg-*` variables | ✓ | ✓ | ✓ |
| Gold dominant, blue info, ember action | ✓ | ✓ | ✓ |
| `viewport-fit=cover` + safe-area padding | ✓ | ✓ | — |
| Touch targets ≥ 44px | ✓ | ✓ | — |
| `pointer:coarse` disables hover states | ✓ | ✓ | — |
| `prefers-reduced-motion` respected | ✓ | ✓ | ✓ |
| Correct navigation pattern for viewport | Bottom bar | Icon/expanded sidebar | Full sidebar |
| Modal/sheet pattern correct | Bottom sheet | Bottom sheet or modal | Centred modal |
| Grid column count correct | 1–2 col | 2–3 col | 3–4 col |
| Card padding correct | 16px | 20px | 24px |
| Horizontal scroll for overflow content | ✓ | Optional | Rare |
| FAB position correct | Fixed bottom-right | Inline or fixed | Inline |
| Typography min-size floor respected | 14px | 14px | 14px |
| No hardcoded hex in component CSS | ✓ | ✓ | ✓ |
| Stat values in Cinzel, labels in DM Sans | ✓ | ✓ | ✓ |
