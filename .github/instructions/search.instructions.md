---
description: 'Use when implementing search functionality, Fuse.js configuration, fuzzy matching, voice input, or the "What Can I Make" reverse ingredient search.'
---
# Search Implementation

## Fuzzy Search (Fuse.js)

```js
import Fuse from 'fuse.js';
import cocktails from '../data/cocktails.js';

const fuse = new Fuse(cocktails, {
  keys: [
    { name: 'name', weight: 1.0 },
    { name: 'aliases', weight: 0.8 },
    { name: 'ingredients.name', weight: 0.3 }
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 1
});
```

## Aliases

Each cocktail should have an `aliases` array for bar slang and abbreviations:

| Cocktail | Aliases |
|---|---|
| Long Island Tea | `LIT`, `LIIT`, `long island` |
| Old Fashioned | `OF`, `old fashion` |
| Margarita | `marg`, `margs` |
| Moscow Mule | `mule` |
| Jagerbomb | `jager`, `jager bomb` |
| Sex on the Beach | `SOTB`, `sex beach` |

## Search Behavior

- Start searching after 1 character typed
- Debounce input by 100ms
- Show max 5 results
- Auto-expand top result with full recipe
- Show remaining results as compact cards (name + image thumbnail)
- "No results" state shows: "No matches — try a different spelling"

## Voice Search (Phase 2)

- Use Web Speech API (`SpeechRecognition`)
- Show microphone button in the search bar
- On low confidence (<0.7), show top 3 matches as "Did you mean...?" cards
- Fallback gracefully when API is unavailable (hide mic button)
