---
name: Warm Furniture Studio
colors:
  surface: '#fff8f5'
  surface-dim: '#e1d8d4'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2ed'
  surface-container: '#f5ece7'
  surface-container-high: '#efe6e2'
  surface-container-highest: '#e9e1dc'
  on-surface: '#1e1b18'
  on-surface-variant: '#48473b'
  inverse-surface: '#34302c'
  inverse-on-surface: '#f8efea'
  outline: '#79776a'
  outline-variant: '#cac7b7'
  surface-tint: '#62612e'
  primary: '#474617'
  on-primary: '#ffffff'
  primary-container: '#5f5e2c'
  on-primary-container: '#dad899'
  inverse-primary: '#ccc98d'
  secondary: '#825335'
  on-secondary: '#ffffff'
  secondary-container: '#fdbf99'
  on-secondary-container: '#794b2e'
  tertiary: '#47453b'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f5c52'
  on-tertiary-container: '#dad5c8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e8e6a6'
  primary-fixed-dim: '#ccc98d'
  on-primary-fixed: '#1d1d00'
  on-primary-fixed-variant: '#4a4919'
  secondary-fixed: '#ffdbc8'
  secondary-fixed-dim: '#f7b994'
  on-secondary-fixed: '#321300'
  on-secondary-fixed-variant: '#673c20'
  tertiary-fixed: '#e8e2d5'
  tertiary-fixed-dim: '#cbc6ba'
  on-tertiary-fixed: '#1d1c14'
  on-tertiary-fixed-variant: '#49473d'
  background: '#fff8f5'
  on-background: '#1e1b18'
  surface-variant: '#e9e1dc'
typography:
  display-lg:
    fontFamily: Literata
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Literata
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Literata
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-sm:
    fontFamily: Literata
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-desktop: 48px
  margin-mobile: 16px
  container-max: 1200px
  section-padding: 96px
---

## Brand & Style

The brand identity is built on the concept of "Intentional Living." It targets a high-end, design-conscious audience that values artisanal craftsmanship, sustainable materials, and the emotional resonance of physical spaces. The aesthetic is **Tactile Minimalism**—a blend of organic textures, airy layouts, and a sophisticated, earth-toned palette.

The UI evokes a sense of calm, warmth, and luxury. It avoids the coldness of corporate minimalism by using grain overlays, soft ambient shadows, and high-quality editorial photography. The emotional response should be one of groundedness and professional intimacy, moving away from automation toward manual, curated human interaction.

## Colors

The color palette is inspired by natural materials: smoked oak, olive leaves, and sun-bleached linen. 

- **Primary (#5f5e2c):** A deep, muted olive used for branding, primary actions, and key headings.
- **Secondary (#825335):** A warm clay-brown used for accents and grounding elements.
- **Surface Palette:** Utilizes a warm, off-white "Sand" base (#fff8f5) rather than pure white. This reduces visual fatigue and enhances the "warm" brand promise. 
- **Functional Grays:** Replaced with "On-Surface-Variant" tones (#48473b), which contain a hint of yellow/green to maintain color harmony across typography and borders.

## Typography

The system uses a pairing of a scholarly Serif and a contemporary Sans-Serif to balance heritage with modern utility.

- **Literata (Headlines):** Chosen for its readability and "bookish" warmth. It should be used for all brand-facing headers and display text.
- **Plus Jakarta Sans (Body & UI):** A clean, modern geometric sans with soft terminals that complement the curves of the furniture.
- **Styling Note:** Labels and navigation items use `label-md` with uppercase styling and increased letter spacing (0.05em) to create an editorial, gallery-like feel.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy centered within a 1200px container for desktop. 

- **Grid:** A 12-column system is implied, but flexibility is allowed for "Bento Box" layouts where elements span 4, 6, or 8 columns.
- **Rhythm:** An 8px base unit drives all spacing. Sections are heavily padded (96px/12rem) to ensure whitespace emphasizes the "curated" nature of the content.
- **Mobile Adaptivity:** Side margins compress from 48px to 16px. Section vertical padding reduces to 64px to maintain momentum.

## Elevation & Depth

Hierarchy is achieved through **Ambient Shadows** and **Tonal Layering** rather than traditional elevation levels.

- **Ambient Shadows:** Shadows are extra-diffused and tinted with the primary color (e.g., `rgba(95, 94, 44, 0.08)`). This prevents the UI from looking "muddy" and ties the depth into the color palette.
- **Grain Overlay:** A subtle SVG noise filter (5% opacity) is applied to backgrounds and image containers to provide a physical, paper-like texture.
- **Backdrop Blurs:** The sticky navigation uses an 80% opacity surface with a 12px blur to create a sense of light and space.

## Shapes

The shape language is **Rounded**, mirroring the organic curves of the furniture.

- **Buttons & Inputs:** Use a standard `0.5rem` (rounded-lg) radius.
- **Cards & Bento Items:** Use a larger `0.75rem` to `1.5rem` (rounded-xl) radius to frame photography softly.
- **Visual Style:** Avoid sharp corners entirely to maintain the brand’s approachable and "soft" aesthetic.

## Components

- **Buttons:** Primary buttons use the Primary color with `on-primary` text. Secondary buttons use a `1.5px` border of the Primary color with no fill. Both use `label-md` for text.
- **Input Fields:** Styled as "Material-lite"—a background of `surface-container-highest` with a bottom border (`border-b`) that transitions to the Primary color on focus. No full-box borders.
- **Cards (Product/Editorial):** Images should occupy the majority of the card space. Text is centered or bottom-aligned with minimal metadata to maintain a clean "gallery" look.
- **Bento Grid Items:** Complex cards that combine photography with text overlays. Overlays should use a gradient transition from the background color to transparent to ensure legibility.
- **Icons:** Use "Material Symbols Outlined" with a thin stroke (weight 400) to match the light typography.