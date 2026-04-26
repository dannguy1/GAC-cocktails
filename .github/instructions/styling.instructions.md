---
description: 'Use when creating or editing CSS files, theme variables, dark theme styling, or color/typography decisions. Covers the GAC design system, color palette, and responsive layout rules.'
applyTo: 'src/styles/**/*.css'
---
# Styling Standards

## GAC Ecosystem Design System

This app is part of the GAC (Garlic & Chives) ecosystem alongside GAC-Concierge and GAC-display.
All GAC apps share fonts, brand colors, and card patterns. This app uses the **dark variant**
(based on GAC-display happy-hour session) since it runs in a bar environment.

### Shared Fonts (loaded from Google Fonts)

```
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
```

- **Headings:** `'Playfair Display', serif` — used across all GAC apps for item names, section titles
- **Body/UI:** `'Inter', sans-serif` — used for descriptions, labels, buttons, inputs

### Shared Brand Colors

| Token | Value | Usage across GAC |
|---|---|---|
| `--color-brand-green` | `#2e7d32` | Primary action color (Concierge buttons, category labels) |
| `--color-brand-green-dark` | `#1b5e20` | Hover/emphasis states, heading color |
| `--color-brand-gold` | `#c6893f` | Accent — prices, badges, dividers, highlights |
| `--color-brand-gold-light` | `#e6a84d` | Light gold for dark backgrounds (happy-hour titles) |

## Theme Variables (defined in `src/styles/theme.css`)

Dark variant of the GAC design system, adapted from `GAC-display/sessions/happy-hour/`:

```css
:root {
  /* Colors — dark variant of GAC ecosystem palette */
  --color-bg: #0f0a06;
  --color-surface: #1a120d;
  --color-text: #f5efe6;
  --color-text-muted: rgba(245, 239, 230, 0.55);
  --color-brand-green: #2e7d32;
  --color-brand-green-dark: #1b5e20;
  --color-brand-gold: #c6893f;
  --color-brand-gold-light: #e6a84d;
  --color-border: rgba(198, 137, 63, 0.3);
  --color-error: #d32f2f;
  --color-success: #2ecc71;

  /* Typography — shared across GAC ecosystem */
  --font-serif: 'Playfair Display', serif;
  --font-sans: 'Inter', sans-serif;
  --font-size-body: 18px;
  --font-size-heading: 28px;
  --font-size-label: 14px;

  /* Shadows — adapted from Concierge for dark bg */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 24px rgba(0, 0, 0, 0.3);
  --shadow-float: 0 12px 24px rgba(0, 0, 0, 0.4);

  /* Spacing & Layout */
  --touch-target-min: 48px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
}
```

## Patterns Shared with GAC Ecosystem

### Card Pattern (from Concierge `MenuCard` + Display `HappyHourCard`)

- Image section on top/left, info section on bottom/right
- Item name: `font-family: var(--font-serif)`, gold-light color on dark bg
- Price: `font-weight: 700`, `color: var(--color-brand-gold-light)`
- Description: `color: var(--color-text-muted)`, `line-height: 1.6`
- Gold divider line: `width: 60px; height: 2-3px; background: var(--color-brand-gold)`
- Badge: `background: var(--color-brand-gold)`, `border-radius: 20px`, uppercase

### Panel Pattern (from Concierge panels)

- Panel header: `border-bottom: 1px solid var(--color-border)`
- Panel content: `overflow-y: auto`, `padding: 16px`
- Category pills: `border-radius: 20px`, `font-size: 0.8rem`, `font-weight: 500`

### Transition/Animation (from GAC-display)

- Card transitions: `0.7s cubic-bezier(0.4, 0, 0.2, 1)`
- Hover lifts: `transform: translateY(-2px)`, `box-shadow` upgrade
- Fade-in: `0.15s ease`
- Use `transition: all 0.2s ease` for interactive element state changes

### Scrollbar Styling (from Concierge)

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
```

## Rules

- **Dark theme only** — never use light backgrounds or white surfaces
- All colors must reference CSS custom properties, not hardcoded hex values
- Use `var(--font-serif)` for headings/drink names, `var(--font-sans)` for everything else
- Minimum font size: 18px for body text, 28px for drink names, 14px for labels
- Minimum touch target: 48x48px for all interactive elements
- Use `rem` or `px` units — no `em` (avoids compounding)
- Mobile-first: base styles for small screens, `@media (min-width: ...)` for larger
- High contrast: text must meet WCAG AA (4.5:1 ratio minimum)
- Use `clamp()` for responsive typography (pattern from GAC-display)
- `-webkit-font-smoothing: antialiased` on body (shared across all GAC apps)

## Layout

- Use CSS Grid for page layout, Flexbox for component internals
- No CSS frameworks (no Tailwind, Bootstrap, etc.)
- Component styles live inside Shadow DOM or in matching CSS files
