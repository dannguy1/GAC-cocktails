# GAC Bartender Cocktail Assistant

## Project Overview

A Progressive Web App (PWA) for bartenders at Garlic & Chives restaurant (Artesia, CA). Bartenders type a drink name (even misspelled) and instantly see the drink image and recipe. Designed for dark bar environments, offline-first, touch-friendly.

See [docs/design.md](../docs/design.md) for the full design document with wireframes, architecture, and phased delivery plan.

## Architecture

- **Framework:** Vanilla JS with Web Components (no React/Vue)
- **Build:** Vite with vite-plugin-pwa for service worker generation
- **Search:** Fuse.js for client-side fuzzy matching (typo-tolerant)
- **Styling:** CSS custom properties, dark theme, mobile-first
- **Data:** Static — 36 cocktails loaded at build time from the path in `COCKTAIL_DATA_DIR` (see `.env`)

### Key Directories

```
src/
  components/    # Web Components (search-bar, recipe-card, ingredient-checklist, etc.)
  styles/        # CSS files — global theme, component styles
  data/          # Build-generated cocktails.js (merged JSON + markdown recipes)
  assets/images/ # Optimized cocktail images (copied from COCKTAIL_DATA_DIR at build time)
public/          # Static assets served as-is
docs/            # Design document, requirements, architecture decisions
```

## Code Style

- Vanilla JS — no TypeScript, no framework
- Web Components with Shadow DOM for encapsulation
- ES modules (`import`/`export`) — no CommonJS
- CSS custom properties for theming (defined in `src/styles/theme.css`)
- Semantic HTML5 elements
- Template literals for component templates

## Data Pipeline

Cocktail data source is configured via `COCKTAIL_DATA_DIR` in `.env` (defaults to `../GAC-Menu/cocktails`).
The directory must contain:
- `cocktail_menu.json` — name, description, image path, price, category
- `recipes/*.md` — structured markdown with Ingredients, Instructions, Serving sections
- `images/*.jpg` — drink photos

A build script merges these into a single `src/data/cocktails.js` module.

## Design Constraints

- **Dark theme only** — background `#0f0a06`, brand gold accent `#c6893f` (GAC ecosystem dark variant)
- **Fonts:** Playfair Display (headings), Inter (body) — shared across GAC apps
- **Minimum touch target:** 48x48px
- **Minimum font sizes:** 18px body, 28px headings
- **Full offline support** — all images and data cached via service worker
- **No server-side code** — entirely static/client-side
- **Target devices:** Tablets and phones in landscape/portrait

## Build and Test

```bash
npm install          # Install dependencies
npm run build:data   # Merge cocktail data from COCKTAIL_DATA_DIR into src/data/
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

## Conventions

- Component files: `kebab-case.js` (e.g., `search-bar.js`, `recipe-card.js`)
- CSS files: match component names (e.g., `search-bar.css`)
- Custom element names: `gac-` prefix (e.g., `<gac-search-bar>`, `<gac-recipe-card>`)
- Events: use `CustomEvent` with `detail` payload, bubble up
- State: minimal — search query, selected cocktail, checklist state, recent history
- Storage: `localStorage` for recent drinks and checklist state
