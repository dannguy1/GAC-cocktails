#!/usr/bin/env node
/**
 * build-mobile-data.js
 *
 * Converts the web app's cocktails.js (ES module) into a JSON file
 * that can be `require()`'d by the React Native mobile app.
 *
 * Also remaps image paths to use the mobile asset server URL.
 *
 * Usage: node scripts/build-mobile-data.js [--host <ip:port>]
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(__dirname, '../src/data/cocktails.js');
const outPath = resolve(__dirname, '../mobile/data/cocktails.json');

// Parse optional --host flag for image URL base
const hostIdx = process.argv.indexOf('--host');
const imageHost = hostIdx !== -1 ? process.argv[hostIdx + 1] : null;

// Read the ES module source and extract the default export array
const source = readFileSync(srcPath, 'utf-8');

// Strip "export default" and trailing semicolons to get raw JSON array
const match = source.match(/export\s+default\s+([\s\S]+)/);
if (!match) {
    console.error('✗ Could not find "export default" in', srcPath);
    process.exit(1);
}
const jsonStr = match[1].replace(/;\s*$/, '');
let cocktails;
try {
    cocktails = JSON.parse(jsonStr);
} catch (err) {
    console.error('✗ Failed to parse cocktail data as JSON:', err.message);
    process.exit(1);
}

// Optionally rewrite image paths to full URLs for mobile
if (imageHost) {
    const base = imageHost.startsWith('http') ? imageHost : `http://${imageHost}`;
    for (const c of cocktails) {
        if (c.image && c.image.startsWith('/')) {
            c.image = `${base}${c.image}`;
        }
    }
}

writeFileSync(outPath, JSON.stringify(cocktails, null, 2));
console.log(`✓ Wrote ${cocktails.length} cocktails to mobile/data/cocktails.json`);
if (imageHost) {
    console.log(`  Image base URL: ${imageHost}`);
}
