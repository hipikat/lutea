# Lutea

A CMS and blogging framework backed by Wagtail.

## Development

Run `just init` to initialise the Python and Node environments.

```sh
pnpm dev         # Serve the style specimens at http://127.0.0.1:5173
pnpm test        # Run the frontend tests once
pnpm test:watch  # Watch the frontend tests
pnpm build       # Build production and debug CSS assets
pnpm watch:build # Watch both CSS builds
```

## Static assets

The stylesheet entrypoint is `src/styles/main.css`. Builds emit standalone CSS
and a `manifest.json` into `build/vite/prod` and `build/vite/debug`.

The Vite development server serves the theme preview page. The preview HTML is
not included in backend builds.

## Style choices

Layouts, fonts and colours can be selected independently:

| Part | Location under `src/styles/` | Selection |
| --- | --- | --- |
| Layout | `layouts/` | `data-layout`: `one-column`, `split-view`, `definition-list`, `three-column` |
| Fonts | `fonts/<name>/` | `data-font`: `system`, `picata` |
| Colours | `colours/<name>.css` | `data-theme="picata"` with `data-mode`: `light`, `dark` |

For example:

```html
<main data-layout="three-column" data-font="picata" data-theme="picata" data-mode="dark">
  <aside>Article metadata</aside>
  <nav>Contents</nav>
  <article>Article body</article>
</main>
```

Font and colour themes must be selected explicitly on an element or an ancestor.
Imports make themes available without applying them; CSS selects no default theme
or mode. A client-side colour selector or system preference handler can set
`data-mode`.

Set `data-theme` and `data-mode` together on the same element when selecting a
colour palette. The selected colours inherit through its descendants.

Each colour theme has one named CSS file containing both light and dark modes.
Font themes have their own directories and `index.css`. The `system` font theme
is an explicit choice. The `picata` font theme uses bundled Zilla Slab, Bitter,
Sacramento, Zilla Slab Highlight and Fira Code. Its font files and licences live
inside `fonts/picata/` and are included in both builds.
