# GAC Bartender — Cocktail Recipe Assistant

A Progressive Web App (PWA) for bartenders at Garlic & Chives restaurant (Artesia, CA). Type a drink name — even misspelled — and instantly see the image and recipe.

Part of the GAC ecosystem alongside [GAC-Concierge](../GAC-Concierge) and [GAC-display](../GAC-display).

## Prerequisites

- **Node.js** 18+
- **GAC-Menu** repository cloned as a sibling directory (contains cocktail data, images, and recipes)
- **Expo CLI** (for mobile app development — `npx expo`)

Expected directory layout:

```
GAC/
├── GAC-Menu/           # Cocktail data source
│   └── cocktails/
│       ├── cocktail_menu.json
│       ├── aliases.json
│       ├── recipes/*.md
│       └── images/*.jpg
├── GAC-cocktails/      # This project
├── GAC-Concierge/      # Sibling app
└── GAC-display/        # Sibling app
```

## Setup

1. **Clone and install:**

   ```bash
   git clone <repo-url> GAC-cocktails
   cd GAC-cocktails
   npm install
   ```

2. **Configure environment:**

   Copy the example env file and adjust if your data directory is in a different location:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` to set the path to your cocktail data:

   ```env
   # Path to the directory containing cocktail_menu.json, recipes/, and images/
   COCKTAIL_DATA_DIR=../GAC-Menu/cocktails
   ```

3. **Build cocktail data:**

   ```bash
   npm run build:data
   ```

   This reads from the directory specified in `COCKTAIL_DATA_DIR` and generates:
   - `src/data/cocktails.js` — merged cocktail data module
   - `public/images/` — drink photos

4. **Start development server:**

   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `COCKTAIL_DATA_DIR` | `../GAC-Menu/cocktails` | Path to the cocktail data directory containing `cocktail_menu.json`, `aliases.json`, `recipes/`, and `images/` |
| `PORT` | `8510` | Port for the production preview server |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build:data` | Merge cocktail data from source into `src/data/` |
| `npm run build:mobile-data` | Rebuild web data + mobile JSON |
| `npm run build:all-data` | Same as `build:mobile-data` (rebuild everything) |
| `npm run watch:data` | Watch source dir for changes and auto-rebuild |
| `npm run build` | Build data + production bundle |
| `npm run preview` | Preview the production build locally |

## Updating the Menu

When cocktails are added, removed, or changed in `GAC-Menu/cocktails/`, rebuild the app data so the changes appear in both the web and mobile apps.

### Quick rebuild

```bash
npm run build:all-data
```

This reads the source directory (`COCKTAIL_DATA_DIR`) and regenerates:

- `src/data/cocktails.js` — web app data module
- `mobile/data/cocktails.json` — React Native data file
- `public/images/` — drink photos

### Auto-rebuild (watch mode)

During active menu editing, run the watcher so every save triggers a rebuild automatically:

```bash
npm run watch:data
```

It monitors `cocktail_menu.json`, `aliases.json`, `recipes/`, and `images/` for changes.

### Adding search aliases

Search aliases (e.g. "cosmo" → Cosmopolitan) are stored in the source data directory at `GAC-Menu/cocktails/aliases.json`. To add or update aliases, edit that file directly:

```json
{
  "Cosmopolitan": ["cosmo"],
  "Pina Colada": ["pina", "piña colada"]
}
```

Cocktails without an entry get no aliases — they are still searchable by name. After editing, run `npm run build:all-data` or let the watcher pick up the change.

## Architecture

- **Framework:** Vanilla JS with Web Components (no React/Vue)
- **Build:** Vite with vite-plugin-pwa
- **Search:** Fuse.js for client-side fuzzy matching
- **Styling:** CSS custom properties, dark theme (GAC ecosystem dark variant)
- **Offline:** Full PWA — works without network after first load

See [docs/design.md](docs/design.md) for the full design document.

## Project Structure

```
src/
  components/    # Web Components (<gac-search-bar>, <gac-recipe-card>, etc.)
  styles/        # CSS — theme variables, global styles
  data/          # Build-generated cocktails.js (do not edit manually)
mobile/          # React Native (Expo) mobile app
  components/    # Mobile UI components
  data/          # Build-generated cocktails.json (do not edit manually)
  services/      # Search engine, storage, image URL resolution
scripts/         # Build scripts, service manager, port management
public/
  images/        # Build-generated drink photos (do not edit manually)
  icons/         # PWA icons
docs/            # Design document, task list
```

## Service Management

Use the service manager script to run the web server in the background:

```bash
./scripts/gac_bartender.sh start     # Start preview server (port 8510)
./scripts/gac_bartender.sh stop      # Stop the server
./scripts/gac_bartender.sh restart   # Restart (picks up new builds)
./scripts/gac_bartender.sh status    # Show PID, port, HTTP health
./scripts/gac_bartender.sh logs      # Tail the service log
./scripts/gac_bartender.sh rebuild   # Full rebuild + ready to restart
```

Add `--dev` for Vite hot-reload dev server on port 5173.

All `npm run dev`, `npm run start`, and `gac_bartender.sh start` will **auto-kill** any stale process on the target port before starting, so you never accidentally run a stale app.

## Mobile App

The `mobile/` directory contains a React Native (Expo) app for use on phones and tablets.

### Setup

```bash
cd mobile
npm install
```

### Running

```bash
npx expo start
```

**Important:** The mobile app loads cocktail images from the web server. Make sure the web server is running before using the mobile app:

```bash
# From the project root
./scripts/gac_bartender.sh start
```

The mobile app connects to `http://<server-ip>:8510` by default (configured in `mobile/services/storage.js`). If your server IP or port changes, update the `webHost` value there.

### Rebuilding mobile data

When the menu changes, rebuild both web and mobile data from the project root:

```bash
npm run build:all-data
```

This updates both `src/data/cocktails.js` and `mobile/data/cocktails.json`.
