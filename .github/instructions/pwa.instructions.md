---
description: 'Use when configuring the PWA manifest, service worker, offline caching strategy, or installability. Covers Workbox caching, app manifest, and offline-first patterns.'
---
# PWA and Offline Support

## Service Worker Strategy

- Use `vite-plugin-pwa` with Workbox
- **Precache** the app shell, CSS, JS, and all 36 cocktail images
- **Runtime cache** is not needed — all data is static and precached
- `registerType: 'autoUpdate'` for seamless updates

## Manifest (`public/manifest.json`)

```json
{
  "name": "GAC Bartender",
  "short_name": "GAC Bar",
  "description": "Cocktail recipe assistant for Garlic & Chives bartenders",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0d0d0d",
  "theme_color": "#d4a843",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Offline Requirements

- Total cache: ~5-10 MB (36 JPG images + app bundle)
- App must function with zero network after first load
- All cocktail data is embedded in the JS bundle (no fetch calls)

## Wake Lock (Phase 2)

```js
if ('wakeLock' in navigator) {
  const wakeLock = await navigator.wakeLock.request('screen');
}
```

Use to prevent screen dimming during active bar shifts.
