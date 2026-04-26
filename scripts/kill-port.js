#!/usr/bin/env node
/**
 * kill-port.js
 *
 * Kills any process listening on the configured PORT before starting the server.
 * Prevents Vite from silently switching to a different port with a stale app.
 *
 * Used as a "pre" script for `npm run dev` and `npm run start`.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Read PORT from .env (same logic as the shell script)
let port = 8510;
const envFile = resolve(ROOT, '.env');
if (existsSync(envFile)) {
  const envContent = readFileSync(envFile, 'utf-8');
  const match = envContent.match(/^PORT=(\d+)/m);
  if (match) port = parseInt(match[1], 10);
}

// For dev server, Vite defaults to 5173
const command = process.env.npm_lifecycle_event;
const effectivePort = command === 'dev' ? 5173 : port;

function findAndKill(targetPort) {
  try {
    // Try lsof first (macOS + Linux)
    const pids = execSync(`lsof -ti TCP:${targetPort} -sTCP:LISTEN 2>/dev/null`, {
      encoding: 'utf-8',
    }).trim();

    if (pids) {
      for (const pid of pids.split('\n').filter(Boolean)) {
        console.log(`  ⚠ Killing stale process (pid ${pid}) on port ${targetPort}`);
        try { execSync(`kill -TERM ${pid} 2>/dev/null`); } catch {}
      }
      return true;
    }
  } catch {
    // lsof found nothing or not available
  }

  try {
    // Fallback: fuser (Linux)
    const result = execSync(`fuser ${targetPort}/tcp 2>/dev/null`, {
      encoding: 'utf-8',
    }).trim();

    if (result) {
      for (const pid of result.split(/\s+/).filter(Boolean)) {
        console.log(`  ⚠ Killing stale process (pid ${pid}) on port ${targetPort}`);
        try { execSync(`kill -TERM ${pid} 2>/dev/null`); } catch {}
      }
      return true;
    }
  } catch {
    // fuser found nothing or not available
  }

  return false;
}

if (findAndKill(effectivePort)) {
  // Brief pause to let the port release
  execSync('sleep 1');
  console.log(`  ✓ Port ${effectivePort} freed`);
} else {
  console.log(`  ✓ Port ${effectivePort} is available`);
}
