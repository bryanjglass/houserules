# MilkMoney Design

This folder holds the visual system for the app. Two files, two audiences:

- **`DESIGN.md`** — for Claude Code and contributors. Tokens, component
  contracts, screen specs, Tailwind config. Read this first.
- **`MilkMoney Design Specs.html`** — for humans. Open in a browser for the
  rendered spec doc with annotated phone mockups. Use it for stakeholder
  review and visual reference.

The two are kept in sync — if you change one, change the other.

## When designs change

1. Update `DESIGN.md` first (it's the source of truth for tokens and rules).
2. Update the spec doc's JSX in `spec/` to reflect the new state.
3. Commit both together so future Claude Code sessions see a consistent view.

## Assets

Source illustrations live in `assets/` here. Runtime copies live in
`client/public/images/` — keep them in sync. Naming is identical so a
search for `landscape.png` finds both.

## Spec doc — viewing locally

The HTML doc has no build step — open it directly:

```
open "docs/design/MilkMoney Design Specs.html"
```

Or serve the folder with any static server if your browser blocks
local-asset loading.
