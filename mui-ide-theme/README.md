# mui-ide-theme

A MUI7 (`@mui/material` v7) theme for a desktop web-based IDE, styled after
IntelliJ IDEA's **Darcula** color scheme, plus a playground that shows it
applied to a full IDE shell and a plain component gallery.

This is a standalone Vite + React workspace — it does not depend on, or
affect, the `server`/`client` MilkMoney app elsewhere in this repo.

## Run it

```bash
cd mui-ide-theme
npm install
npm run dev       # http://localhost:5174
```

`npm run build` / `npm run preview` also work, and `npm run typecheck`
runs `tsc --noEmit`.

## What's here

- **`src/theme.ts`** — the theme itself:
  - **Palette**: dark mode built from IntelliJ's Darcula colors
    (`#2B2B2B` editor background, `#3C3F41` panel/toolbar chrome, the
    classic `#214283` selection blue, `#CC7832`/`#6A8759`/`#6897BB`/`#FFC66D`
    syntax accent colors, etc.) — collected in a `darcula` const at the top
    of the file so every consumer (MUI palette *and* the custom editor
    tokens below) draws from one source.
  - **Density**: `spacing: 4` (half of MUI's default 8px unit), `shape.borderRadius: 3`,
    and per-component overrides (`MuiToolbar`, `MuiButton`, `MuiTab`,
    `MuiListItemButton`, `MuiOutlinedInput`, `MuiMenuItem`, `MuiTableCell`,
    `MuiChip`, …) sized down for a desktop tool rather than a touch UI —
    28-32px toolbars, 22-26px buttons/inputs, tight list rows.
  - **Typography**: a monospace font stack
    (`JetBrains Mono` → `Fira Code` → system monospace fallbacks) applied
    globally via `typography.fontFamily`, with a condensed type scale
    (`fontSize: 13`, smaller `body`/`button`/`caption` sizes).
  - **Editor tokens**: `theme.editor` is a custom theme extension (via
    module augmentation on `ThemeOptions`/`Theme`) exposing syntax-highlight
    colors — `keyword`, `string`, `number`, `function`, `comment`, `class`,
    `variable`, `operator`, `punctuation`, plus `background`/`gutter`/
    `selection`/`caretLine`. Any component can read `theme.editor.keyword`
    instead of hardcoding a hex value; `CodeView` is the example consumer.

- **`src/App.tsx`** + **`src/components/`** — the playground:
  - `TitleBar` — menu bar, run/debug actions, search field, notification/settings icons.
  - `ActivityBar` — narrow icon rail (Project / Search / Git / Extensions) plus a Component Gallery toggle.
  - `FileExplorer` — recursive collapsible file tree.
  - `EditorArea` + `CodeView` — closable tabs over a mock syntax-highlighted code view driven entirely by `theme.editor` tokens.
  - `BottomPanel` — Terminal / Problems / Output tabs.
  - `StatusBar` — git branch, problem count, cursor position, encoding, language.
  - `ComponentGallery` — buttons, inputs, checkboxes/radios/switches, a slider, alerts, chips, a table, and a dialog, all using only theme defaults (no per-component color overrides) to demonstrate the theme in isolation from the IDE chrome.

Toggle between the IDE shell and the Component Gallery from the bottom
icon in the activity bar (left rail).

## Using this theme elsewhere

`darculaTheme` (default export of `src/theme.ts`) is a normal object from
`createTheme()` — drop it into any MUI7 app:

```tsx
import { ThemeProvider, CssBaseline } from '@mui/material';
import darculaTheme from './theme';

<ThemeProvider theme={darculaTheme}>
  <CssBaseline />
  <YourApp />
</ThemeProvider>;
```

The `@fontsource/jetbrains-mono` import in `main.tsx` self-hosts the font
(no CDN dependency); drop it if you'd rather fall back to the stack's
system monospace fonts.
