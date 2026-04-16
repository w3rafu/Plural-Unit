# Themes

Colour themes for Plural Unit. Each `.css` file in this folder defines a
complete set of CSS custom-property overrides for `light` and `dark` mode.

## How it works

- `zinc.css` is the **default** theme. Its tokens live on bare `:root` / `.dark`
  selectors, so the app looks correct even without a `data-theme` attribute.
- Additional themes scope their tokens under `[data-theme="<name>"]` and
  `[data-theme="<name>"].dark`.
- The `currentTheme` store (`$lib/stores/currentTheme.svelte.ts`) sets
  `data-theme` on `<html>`, persists the choice in `localStorage`, and exposes
  a reactive `name` property.

## Creating a new theme

1. Copy `zinc.css` to `<your-theme>.css` in this folder.
2. Change the `oklch` values. Keep the same property names.
3. Replace `:root` with `[data-theme='<your-theme>']` and `.dark` with
   `[data-theme='<your-theme>'].dark`.
4. Import the new file in `src/routes/layout.css`:
   ```css
   @import '../themes/<your-theme>.css';
   ```
5. Register the name in `src/lib/stores/currentTheme.svelte.ts`:
   ```ts
   export const AVAILABLE_THEMES = ['zinc', 'midnight', '<your-theme>'] as const;
   ```
6. Done — the palette button in the header will cycle through it.

## Token reference

Every theme must define the full set of tokens. See `zinc.css` for the
canonical list. The tokens map to Tailwind utilities via the `@theme inline`
block in `src/routes/layout.css`.
