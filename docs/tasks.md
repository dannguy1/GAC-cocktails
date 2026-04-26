# Implementation Plan — Phase 1 MVP

## Overview

Build the GAC Bartender cocktail assistant MVP: a dark-themed PWA with fuzzy search,
recipe cards, ingredient checklist, and recent drinks. Data comes from `$COCKTAIL_DATA_DIR`.

**Read before starting:** All `.github/instructions/*.instructions.md` and `.github/copilot-instructions.md`.

**Execution order:** Tasks are numbered and must be completed sequentially (later tasks depend on earlier ones).

---

## Task 1: Install Dependencies

**File:** (terminal only)

```bash
npm install
```

**Verify:** `node_modules/` exists, `fuse.js` and `vite` are installed.

---

## Task 2: Build Data Pipeline

**File:** `scripts/build-data.js`

Create a Node.js script that merges cocktail data from `$COCKTAIL_DATA_DIR` into `src/data/cocktails.js`.

### 2.1 Read environment

```js
const DATA_DIR = process.env.COCKTAIL_DATA_DIR || '../GAC-Menu/cocktails';
```

Validate that `DATA_DIR` exists and contains `cocktail_menu.json`, `recipes/`, and `images/`.
Exit with a clear error message if missing.

### 2.2 Load and deduplicate menu JSON

- Read `cocktail_menu.json` from `DATA_DIR`
- Deduplicate by `item_name` (Mai Tai appears twice — keep the first occurrence)
- Expected: 36 unique items after dedup

### 2.3 Parse recipe markdown files

For each item in the menu, find the matching recipe file at `DATA_DIR/recipes/{snake_case_name}.md`.

**Filename convention:** `item_name` → replace spaces with `_` → `.md`
- "3 Wise Men" → `3_Wise_Men.md`
- "Moscow mule" → `Moscow_mule.md` (preserve original casing)

**Parse each markdown file into:**

```js
{
  ingredients: [
    { raw: '2 oz tequila (blanco)' },       // always include the full raw line
    { raw: '1 can (8.4 oz) Red Bull energy drink' },
    { raw: 'Cola to top' },
  ],
  instructions: 'Rim a glass with salt. Combine...',
  glass: 'Margarita glass or rocks glass (salt-rimmed)',
  garnish: 'Lime wheel'
}
```

**Parsing rules:**
- `## Ingredients` section: each line starts with `- `. Strip the `- ` prefix. Store as `{ raw: "..." }`.
  Do NOT attempt to parse amount/unit/name — the formats are too varied (e.g., "1 can (8.4 oz)", "Cola to top", "Splash of water", "Salt for rimming"). Keep the raw string.
- `## Instructions` section: join all lines into a single string (trim whitespace).
- `## Serving` section: extract `**Glass:**` and `**Garnish:**` values.

If a recipe file is missing, log a warning and set recipe fields to `null`.

### 2.4 Add aliases

Hardcode an alias map in the build script:

```js
const ALIASES = {
  'Long Island Tea': ['LIT', 'LIIT', 'long island'],
  'Long Beach Iced Tea': ['LBIT', 'long beach'],
  'Old Fashioned': ['OF', 'old fashion'],
  'Margarita': ['marg', 'margs'],
  'Moscow mule': ['mule', 'moscow'],
  'Irish Mule': ['irish mule'],
  'Jagerbomb': ['jager', 'jager bomb', 'jägerbomb'],
  'Sex on the Beach': ['SOTB', 'sex beach'],
  'B 52': ['b52', 'b-52'],
  'LA Waters': ['la water'],
  'Tokyo Tea': ['tokyo'],
  'Lemon Drop Martini': ['lemon drop'],
  'Gin or Vodka Martini': ['martini', 'gin martini', 'vodka martini'],
  'Mai Tai': ['mai-tai'],
  'White Russian': ['white russian'],
  'Black Russian': ['black russian'],
};
```

### 2.5 Generate output

Merge JSON metadata + parsed recipe + aliases into one object per cocktail:

```js
{
  id: 'margarita',                    // lowercase, spaces → hyphens
  name: 'Margarita',                  // from item_name
  price: 13.00,                       // from price
  description: '...',                 // from description
  image: './images/Margarita.jpg',    // relative path for Vite import
  ingredients: [ { raw: '...' } ],    // from parsed recipe
  instructions: '...',                // from parsed recipe
  glass: '...',                       // from parsed recipe
  garnish: '...',                     // from parsed recipe
  aliases: ['marg', 'margs'],         // from ALIASES map, or []
  category: 'Cocktails'               // from category
}
```

Write to `src/data/cocktails.js` as:

```js
export default [ ... ];
```

### 2.6 Copy images

Copy all files from `DATA_DIR/images/` to `src/assets/images/`.
Use `fs.cpSync` or equivalent. Skip `README.md` if present.

### 2.7 Verify

```bash
npm run build:data
```

**Expected output:**
- `src/data/cocktails.js` exists with 36 entries (after dedup)
- `src/assets/images/` contains 36 JPG files
- No errors or warnings in console

---

## Task 3: Search Bar Component

**File:** `src/components/search-bar.js`

Create `<gac-search-bar>` Web Component.

### Behavior

1. Renders a text input with placeholder "Search drinks..." and auto-focus on mount
2. On input, debounce 100ms, then search via Fuse.js
3. Display up to 5 results below the input as a dropdown list
4. Each result shows: cocktail name and a small image thumbnail (48x48)
5. The **top result is highlighted** (preselected)
6. Pressing Enter or tapping a result dispatches `cocktail-selected` event with the cocktail object
7. Pressing Escape or clearing the input hides results
8. Empty query shows no results (blank state)
9. No matches: show "No matches found" text

### Fuse.js setup (import in this component)

```js
import Fuse from 'fuse.js';
import cocktails from '../data/cocktails.js';

const fuse = new Fuse(cocktails, {
  keys: [
    { name: 'name', weight: 1.0 },
    { name: 'aliases', weight: 0.8 },
    { name: 'ingredients.raw', weight: 0.3 }
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 1
});
```

### Events emitted

- `cocktail-selected` — `detail: { cocktail }` — when a result is chosen

### Styling

- Full-width input with `var(--color-surface)` background, `var(--color-border)` border
- `var(--font-sans)`, `font-size: var(--font-size-body)`
- Results dropdown: `var(--color-surface)` background, gold border, `var(--shadow-md)`
- Highlighted result: `var(--color-brand-gold)` left border accent
- Touch target: each result row minimum 48px height

### Keyboard support

- Arrow keys navigate results
- Enter selects highlighted result
- Escape closes dropdown

---

## Task 4: Recipe Card Component

**File:** `src/components/recipe-card.js`

Create `<gac-recipe-card>` Web Component.

### Interface

- Property: `cocktail` — set via JS property (the full cocktail object)
- When `cocktail` is set, re-render the card

### Layout

```
┌──────────────────────────┐
│     [ DRINK IMAGE ]      │  ← full-width hero, max-height 300px, object-fit cover
├──────────────────────────┤
│  Margarita        $13.00 │  ← name (serif, gold-light) + price (gold-light, bold)
│  ─────── (gold divider)  │
│  Glass: Margarita glass  │  ← glass type
│  Garnish: Lime wheel     │  ← garnish
├──────────────────────────┤
│  Ingredients             │  ← section header
│  <gac-ingredient-checklist> │  ← child component
├──────────────────────────┤
│  Steps                   │  ← section header
│  Instructions text...    │  ← plain text block
└──────────────────────────┘
```

### Styling (GAC ecosystem card pattern)

- Card background: `linear-gradient(135deg, var(--color-surface) 0%, #2a1a10 100%)`
- Card border: `1px solid var(--color-border)`, `border-radius: var(--radius-lg)`
- Drink name: `var(--font-serif)`, `var(--color-brand-gold-light)`, `clamp(1.5rem, 4vw, 2rem)`
- Price: `var(--font-sans)`, `var(--color-brand-gold-light)`, `font-weight: 700`
- Gold divider: `width: 60px; height: 2px; background: var(--color-brand-gold)`
- Glass/garnish: `var(--color-text-muted)`, `var(--font-size-label)`
- Section headers: `var(--font-sans)`, `font-weight: 600`, `var(--color-brand-gold)`, `text-transform: uppercase`, `letter-spacing: 0.1em`
- Image: `width: 100%; max-height: 300px; object-fit: cover; border-radius: var(--radius-lg) var(--radius-lg) 0 0`
- `box-shadow: var(--shadow-md)`

### Empty state

When no cocktail is set, show a centered message:
"Search for a drink above" in `var(--font-serif)`, italic, `var(--color-text-muted)`.

---

## Task 5: Ingredient Checklist Component

**File:** `src/components/ingredient-checklist.js`

Create `<gac-ingredient-checklist>` Web Component.

### Interface

- Property: `ingredients` — array of `{ raw: string }`
- Property: `cocktailId` — string, used as localStorage key

### Behavior

1. Render each ingredient as a tappable row with a checkbox
2. Tapping toggles checked state
3. Checked items: text dims (`opacity: 0.4`), strikethrough
4. Unchecked items: full brightness
5. State persists in `localStorage` under key `checklist-{cocktailId}`
6. When `ingredients` or `cocktailId` changes, load saved state or reset

### Styling

- Each row: `min-height: var(--touch-target-min)`, `padding: var(--spacing-sm) 0`
- Checkbox: custom styled (gold border, green fill on check), 24x24px
- Text: `var(--font-sans)`, `var(--font-size-body)`
- Separator between rows: `1px solid var(--color-border)` (subtle)

---

## Task 6: Recent Drinks Strip Component

**File:** `src/components/recent-strip.js`

Create `<gac-recent-strip>` Web Component.

### Behavior

1. Show the last 5 cocktails looked up as small thumbnail cards
2. Tapping a card dispatches `cocktail-selected` event
3. Most recent on the left
4. Stored in `localStorage` under key `recent-drinks` as JSON array of cocktail IDs
5. On receiving a new cocktail (via `addRecent(cocktailId)` method):
   - Add to front, remove duplicates, keep max 5
   - Update localStorage and re-render

### Layout

Horizontal scrollable strip, fixed at the bottom of the viewport.

Each card:
- 64x64px thumbnail image, `border-radius: var(--radius-md)`
- Cocktail name below (truncated, `var(--font-size-label)`)
- `1px solid var(--color-border)` border
- Active/selected: gold border glow

### Styling

- Strip background: `var(--color-bg)` with top border `1px solid var(--color-border)`
- `display: flex; gap: var(--spacing-sm); padding: var(--spacing-sm)`
- Cards: `flex-shrink: 0`

---

## Task 7: App Shell — Wire Everything Together

**File:** `src/main.js`

### Component wiring

```
index.html
  └─ #app
       ├─ <gac-search-bar>          ← always at top
       ├─ <gac-recipe-card>         ← main content area
       │    └─ <gac-ingredient-checklist>  ← embedded inside recipe card
       └─ <gac-recent-strip>        ← fixed at bottom
```

### Event flow

1. Import all components (triggers `customElements.define`)
2. Import cocktail data
3. Create and append components to `#app`
4. Listen for `cocktail-selected` on `document`:
   - Set `recipeCard.cocktail = selectedCocktail`
   - Call `recentStrip.addRecent(selectedCocktail.id)`
   - Scroll recipe card into view smoothly

### Welcome state

On initial load (no cocktail selected), the recipe card shows its empty state.
The search bar is auto-focused so the bartender can start typing immediately.

---

## Task 8: PWA Icons

**File:** `public/icons/icon-192.png`, `public/icons/icon-512.png`

Generate simple placeholder icons:
- Use a canvas-based script or any method to create a solid `#0f0a06` background with a 🍸 emoji centered
- Or create minimal SVG icons converted to PNG
- 192x192 and 512x512 sizes

The manifest in `vite.config.js` already references these paths.

---

## Task 9: Verify Build and Dev Server

```bash
npm run build:data   # generates src/data/cocktails.js + copies images
npm run dev          # starts Vite dev server
```

### Manual verification checklist

- [ ] App loads with dark background (#0f0a06)
- [ ] Search bar is auto-focused
- [ ] Typing "marg" shows Margarita as top result
- [ ] Typing "moheeto" shows Mojito
- [ ] Typing "LIT" shows Long Island Tea
- [ ] Selecting a result shows the recipe card with image, ingredients, glass, garnish
- [ ] Tapping ingredients checks them off (persists on reload)
- [ ] Recent strip shows last 5 drinks
- [ ] Tapping a recent drink re-opens its recipe
- [ ] Fonts are Playfair Display (headings) and Inter (body)
- [ ] All colors match GAC ecosystem dark variant

---

## Task 10: Production Build and PWA Verification

```bash
npm run build        # build:data + vite build
npm run preview      # preview production build
```

### PWA checklist

- [ ] Service worker is registered
- [ ] App works after going offline (disable network in DevTools)
- [ ] All 36 images are cached
- [ ] "Add to Home Screen" prompt appears on mobile
- [ ] Manifest values are correct (name, colors, icons)

---

## File Summary

| File | Purpose | Status |
|---|---|---|
| `scripts/build-data.js` | Data pipeline: merge JSON + markdown → cocktails.js | Create |
| `src/data/cocktails.js` | Build-generated cocktail data array | Generated |
| `src/components/search-bar.js` | `<gac-search-bar>` — fuzzy search with Fuse.js | Create |
| `src/components/recipe-card.js` | `<gac-recipe-card>` — drink image, info, recipe | Create |
| `src/components/ingredient-checklist.js` | `<gac-ingredient-checklist>` — tappable checklist | Create |
| `src/components/recent-strip.js` | `<gac-recent-strip>` — last 5 drinks | Create |
| `src/main.js` | App shell — imports, wiring, event flow | Update |
| `src/styles/theme.css` | CSS custom properties (GAC dark variant) | Done |
| `src/styles/global.css` | Reset, base styles, scrollbar | Done |
| `index.html` | HTML shell | Done |
| `vite.config.js` | Vite + PWA config | Done |
| `public/icons/icon-192.png` | PWA icon 192x192 | Create |
| `public/icons/icon-512.png` | PWA icon 512x512 | Create |

## Phase 2 — Enhanced UX (Deferred)

- [ ] Voice input via Web Speech API
- [ ] Shake/stir timers with haptic feedback
- [ ] Glass and garnish icon set
- [ ] Kiosk mode with Wake Lock API
- [ ] Ambient light sensor for auto-brightness

## Phase 3 — Advanced Features (Deferred)

- [ ] Reverse ingredient search ("What can I make?")
- [ ] Vietnamese language toggle
- [ ] Drink popularity tracking
- [ ] Ticket queue / POS integration
- [ ] Bartender training mode

## Phase 3 — Advanced Features

- [ ] Reverse ingredient search ("What can I make?")
- [ ] Vietnamese language toggle
- [ ] Drink popularity tracking
- [ ] Ticket queue / POS integration
- [ ] Bartender training mode
