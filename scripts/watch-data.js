#!/usr/bin/env node
/**
 * watch-data.js
 *
 * Watches the COCKTAIL_DATA_DIR for changes to menu data, recipes, images,
 * or aliases, then auto-rebuilds both web and mobile data files.
 *
 * Usage: npm run watch:data
 *        node --env-file=.env scripts/watch-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(ROOT, process.env.COCKTAIL_DATA_DIR || '../GAC-Menu/cocktails');

const WATCHED_PATHS = [
  path.join(DATA_DIR, 'cocktail_menu.json'),
  path.join(DATA_DIR, 'aliases.json'),
  path.join(DATA_DIR, 'recipes'),
  path.join(DATA_DIR, 'images'),
];

let debounceTimer = null;
const DEBOUNCE_MS = 500;

function rebuild() {
  console.log(`\n🔄 Source data changed — rebuilding...`);
  try {
    execSync('npm run build:all-data', { cwd: ROOT, stdio: 'inherit' });
    console.log('✅ Rebuild complete\n');
  } catch (err) {
    console.error('❌ Rebuild failed\n');
  }
}

function onChange(eventType, filename) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log(`  Changed: ${filename || 'unknown'} (${eventType})`);
    rebuild();
  }, DEBOUNCE_MS);
}

// Validate data dir exists
if (!fs.existsSync(DATA_DIR)) {
  console.error(`ERROR: COCKTAIL_DATA_DIR not found: ${DATA_DIR}`);
  process.exit(1);
}

console.log(`👀 Watching for changes in ${DATA_DIR}`);
console.log(`   Monitored: cocktail_menu.json, aliases.json, recipes/, images/`);
console.log(`   Press Ctrl+C to stop\n`);

for (const watchPath of WATCHED_PATHS) {
  if (!fs.existsSync(watchPath)) {
    console.warn(`   ⚠ Skipping (not found): ${path.relative(DATA_DIR, watchPath)}`);
    continue;
  }
  const isDir = fs.statSync(watchPath).isDirectory();
  fs.watch(watchPath, { recursive: isDir }, onChange);
  console.log(`   ✓ Watching: ${path.relative(DATA_DIR, watchPath)}${isDir ? '/' : ''}`);
}

console.log('');
