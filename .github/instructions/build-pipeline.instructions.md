---
description: 'Use when working on the build pipeline, data merging script, Vite configuration, PWA setup, or service worker. Covers the cocktail data pipeline from COCKTAIL_DATA_DIR sources into the app bundle.'
applyTo: ['vite.config.js', 'scripts/**']
---
# Build and Data Pipeline

## Data Sources

The data directory is configured via the `COCKTAIL_DATA_DIR` environment variable in `.env`
(defaults to `../GAC-Menu/cocktails`). The directory must contain:

- `cocktail_menu.json` — menu metadata (name, description, image_path, price, category)
- `recipes/*.md` — structured markdown with `## Ingredients`, `## Instructions`, `## Serving`
- `images/*.jpg` — drink photos (36 files)

## Reading the Data Path

The build script is invoked with `node --env-file=.env` (see `package.json`), so
`process.env.COCKTAIL_DATA_DIR` is available without any library:

```js
const DATA_DIR = process.env.COCKTAIL_DATA_DIR || '../GAC-Menu/cocktails';
```

## Build Script (`npm run build:data`)

The build script must:

1. Read `cocktail_menu.json` and deduplicate entries (Mai Tai appears twice)
2. For each item, find the matching recipe in `recipes/` by filename convention (`item_name` → snake_case `.md`)
3. Parse each recipe markdown into structured data:
   - `ingredients[]` — array of `{ amount, unit, name }` where possible
   - `instructions` — string
   - `glass` — from Serving section
   - `garnish` — from Serving section
4. Merge JSON metadata + parsed recipe into a single object per cocktail
5. Output to `src/data/cocktails.js` as a default-exported array
6. Copy and optimize images to `src/assets/images/`

## Output Format (`src/data/cocktails.js`)

```js
export default [
  {
    id: 'margarita',
    name: 'Margarita',
    price: 13.00,
    description: '...',
    image: '/images/Margarita.jpg',
    ingredients: [
      { amount: '2', unit: 'oz', name: 'tequila (blanco)' },
      { amount: '1', unit: 'oz', name: 'fresh lime juice' },
      // ...
    ],
    instructions: 'Rim a glass with salt. Combine tequila...',
    glass: 'Margarita glass or rocks glass (salt-rimmed)',
    garnish: 'Lime wheel',
    aliases: ['marg'],
    category: 'Cocktails'
  },
  // ...
];
```

## Vite Configuration

- Use `vite-plugin-pwa` with Workbox for service worker generation
- Precache all cocktail images and the data module
- Set `registerType: 'autoUpdate'` for seamless SW updates

## npm Scripts

```json
{
  "dev": "vite",
  "build": "npm run build:data && vite build",
  "build:data": "node scripts/build-data.js",
  "preview": "vite preview"
}
```
