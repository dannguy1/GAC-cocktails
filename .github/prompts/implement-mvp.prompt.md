---
description: 'Build the GAC Bartender MVP — data pipeline, search, recipe cards, and PWA. Use this prompt to implement Phase 1 features.'
mode: 'agent'
tools: ['run_in_terminal', 'read_file', 'create_file', 'replace_string_in_file', 'file_search', 'grep_search', 'list_dir']
---
# Implement GAC Bartender MVP

Build the Phase 1 MVP for the GAC Bartender cocktail assistant app.

## Before You Start

1. Read `docs/tasks.md` — it contains the **complete step-by-step implementation plan** with code examples, file paths, and verification steps.
2. Read all `.github/instructions/*.instructions.md` files for component, styling, search, build, and PWA conventions.
3. Read `.github/copilot-instructions.md` for project-wide code style and architecture.

## Execution

Follow `docs/tasks.md` Tasks 1 through 10 **in order**. Each task specifies:
- Which file to create or modify
- Exact behavior and interface
- Styling rules (GAC ecosystem dark variant)
- Verification steps

## Key Points

- Cocktail data source: configured via `COCKTAIL_DATA_DIR` in `.env` (see `.env.example`)
- Run `npm install` first, then `npm run build:data` to generate cocktail data before starting components
- All components use Web Components with Shadow DOM and `gac-` prefix
- Use the GAC ecosystem color palette (dark variant) from `src/styles/theme.css`
- Keep ingredients as raw strings — do NOT parse amount/unit/name (formats are too varied)
- Test with `npm run dev` after each component is complete
- Test with `npm run dev` and verify in browser
