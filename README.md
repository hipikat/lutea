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
