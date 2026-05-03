---
name: Institutional Authority
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#4b4732'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#7d775f'
  outline-variant: '#cec7ab'
  surface-tint: '#6c5e00'
  primary: '#6c5e00'
  on-primary: '#ffffff'
  primary-container: '#f4d809'
  on-primary-container: '#6b5e00'
  inverse-primary: '#e1c700'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#505f76'
  on-tertiary: '#ffffff'
  tertiary-container: '#c8d9f3'
  on-tertiary-container: '#4f5f75'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe329'
  primary-fixed-dim: '#e1c700'
  on-primary-fixed: '#211c00'
  on-primary-fixed-variant: '#514700'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Public Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
  headline-lg:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  button:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built upon a foundation of transparency, prestige, and unwavering reliability. It transitions the aesthetic from traditional corporate blue to a high-contrast, vibrant gold, signaling a progressive and premium evolution of institutional power. The brand personality is "The Modern Trustee": expert and established, yet energized by innovation.

The design style follows a **Corporate / Modern** approach with **Minimalist** influences. It prioritizes clarity and structured information density. By utilizing heavy whitespace alongside a bold, luminous primary accent, the system creates a sense of openness and high-end precision. The visual language is intentionally restrained to ensure the gold accent remains a functional indicator of priority rather than a decorative flourish.

## Colors

The palette is anchored by a vibrant gold (#f4d809), used strategically to draw focus to primary calls-to-action and brand-critical information. Because gold is a high-luminance color, it is paired with a deep "Slate Black" (#0f172a) for text and structural elements to ensure maximum legibility and a sophisticated, grounded feel.

Neutral grays are used to define regions and containers without competing with the primary brand color. Semantic colors (Success, Warning, Error) are maintained in their standard hues to ensure cross-platform accessibility and user safety, but their saturation levels are calibrated to match the intensity of the new gold primary.

## Typography

The design system utilizes **Public Sans** exclusively. As a typeface designed for government and institutional use, it offers exceptional clarity and a neutral, authoritative tone. 

- **Headlines:** Use Bold (700) and Semi-Bold (600) weights to establish a clear hierarchy. Large display type should use tighter tracking to maintain a strong, "block" appearance.
- **Body:** Set with generous line heights (1.5x - 1.6x) to facilitate the reading of complex data or long-form documentation.
- **Labels:** Small labels and captions utilize a slightly wider letter spacing and heavier weight to remain legible at reduced scales.

## Layout & Spacing

This design system employs a **Fixed Grid** model for desktop views to maintain a sense of structured permanence. The layout centers on a 12-column system with a 1280px maximum width. 

Spacing follows a strict 8px base unit. Component internal padding should be consistent (e.g., 16px horizontal for buttons, 24px for cards) to create a rhythmic, predictable flow. Use "stack" spacing variables to maintain vertical consistency between disparate content blocks, ensuring that the "Institutional Authority" character is upheld through rigorous alignment.

## Elevation & Depth

To maintain a professional and "flat-plus" aesthetic, the system avoids heavy drop shadows. Depth is primarily conveyed through **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface Levels:** The base background is neutral white (#FFFFFF). Secondary sections or sidebars use a light gray (#F8FAFC) to create a subtle recessed effect.
- **Outlines:** Instead of shadows, use 1px borders in a soft gray (#E2E8F0) to define card boundaries and input fields. 
- **Active Elevation:** Only the most critical interactive elements (like Primary Gold Buttons) may use a very soft, diffused ambient shadow upon hover to signal interactability.

## Shapes

The shape language is defined as **Soft** (0.25rem / 4px). This subtle rounding moves away from the harshness of sharp corners while remaining far more professional and disciplined than "bubbly" or pill-shaped systems.

All primary components—including buttons, input fields, and cards—must adhere to this 4px standard. This uniformity creates a cohesive "machined" look, suggesting precision and institutional rigor. Larger containers like modals may scale this slightly (to 8px), but the overall impression should remain crisp.

## Components

- **Buttons:** Primary buttons use the vibrant gold (#f4d809) background with slate-black text for high contrast. Secondary buttons use a slate-black outline. All buttons use the uppercase label style for a "command" presence.
- **Input Fields:** Use a white background with a 1px slate-gray border. On focus, the border transitions to a 2px gold stroke. Labels are always positioned above the field in the `label-md` style.
- **Cards:** Cards are flat with a 1px gray border. For "Featured" content, a 4px gold top-border is applied to signify brand importance.
- **Chips/Indicators:** Semantic chips (Success, Error) use a low-opacity background of the semantic color with high-opacity text. The Gold primary is reserved for "Status: Active" or "Featured" indicators.
- **Data Tables:** Tables are a core component. They use a strict horizontal-line-only style (no vertical borders) with a light gray header background to maintain an airy, modern feel despite high information density.