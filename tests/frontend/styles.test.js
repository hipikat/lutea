import { fileURLToPath } from "node:url";
import { build, createServer } from "vite";
import { beforeAll, describe, expect, test } from "vitest";

let assets;
let css;

describe("the backend stylesheet", () => {
  beforeAll(async () => {
    const result = await build({
      configFile: fileURLToPath(new URL("../../vite.config.js", import.meta.url)),
      logLevel: "silent",
      build: { write: false, minify: false, cssMinify: false },
    });
    assets = result.output;
    css = assets.find((asset) => asset.fileName.endsWith(".css")).source;
  });

  test("emits standalone CSS with a manifest, without a preview page or JS bundle", () => {
    const manifest = JSON.parse(
      assets.find((asset) => asset.fileName === "manifest.json").source,
    );
    expect(manifest["src/styles/main.css"].file).toMatch(/\.css$/);
    expect(assets.some((asset) => /\.(html|js)$/.test(asset.fileName))).toBe(false);
  });

  test("compiles Tailwind utilities, DaisyUI components and base typography", () => {
    expect(css).toContain(".p-6");
    expect(css).toContain(".md\\:grid-cols-2");
    expect(css).toContain(".btn-primary");
    expect(css).toContain("font-family: var(--lutea-font-body)");
    expect(css).not.toContain("@apply");
  });

  test("keeps test-only classes out of the shipped stylesheet", () => {
    // z-[987654] deliberately occurs only in this test source.
    expect(css).not.toContain("987654");
  });

  test("compiles both modes of the Picata colour theme", () => {
    const palettes = {
      light: {
        primary: "#134f62", secondary: "#583c5b", accent: "#00b3a9",
        neutral: "#1f1008", "base-100": "#f3f9f7", info: "#71bcfe",
        success: "#7fbb70", warning: "#daba00", error: "#f57592",
      },
      dark: {
        primary: "#b6b8e6", secondary: "#99c9bc", accent: "#ffc293",
        neutral: "#3b5d6e", "base-100": "#1b303b", info: "#18bdcf",
        success: "#40b78e", warning: "#b6b14d", error: "#f38fa1",
      },
    };
    for (const [mode, palette] of Object.entries(palettes)) {
      const theme = css.match(new RegExp(`\\[data-theme="?picata"?\\]\\[data-mode="?${mode}"?\\][^{]*\\{([^}]+)`))[1];
      expect(theme).toContain(`color-scheme: ${mode}`);
      for (const [role, color] of Object.entries(palette)) {
        expect(theme).toContain(`--color-${role}: ${color}`);
      }
    }
  });

  test("includes the four responsive layouts", () => {
    for (const layout of ["one-column", "split-view", "definition-list", "three-column"]) {
      expect(css).toContain(`[data-layout="${layout}"]`);
    }
    expect(/@media\s*\((?:min-width:\s*|width\s*>=\s*)40rem\)/.test(css)).toBe(true);
    expect(/@media\s*\((?:min-width:\s*|width\s*>=\s*)64rem\)/.test(css)).toBe(true);
    expect(/\[data-layout="three-column"\] > article\s*\{[^}]*grid-area: 1 \/ 4 \/ auto \/ span 6/.test(css)).toBe(true);
    expect(/\[data-layout="three-column"\] > nav\s*\{[^}]*grid-area: 1 \/ 10 \/ auto \/ span 3/.test(css)).toBe(true);
  });

  test("keeps font roles selectable independently of colours", () => {
    expect(css).toContain('[data-font="system"]');
    expect(css).toContain('[data-font="picata"]');
    expect(css).toContain("font-family: var(--lutea-font-cursive)");
    expect(css).toContain("font-family: var(--lutea-font-heading)");
    expect(css).toContain("font-family: var(--lutea-font-mono)");
  });

  test("defines font themes only on explicitly selected elements", () => {
    const themes = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, , declarations]) => /--lutea-font-body\s*:/.test(declarations));
    expect(themes).toHaveLength(2);
    for (const [, selector] of themes) {
      expect(selector.trim()).toMatch(/^\[data-font="(?:system|picata)"\]$/);
    }
  });

  test("requires an explicit colour theme and mode, with no browser preference", () => {
    const themes = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, , declarations]) => /--color-base-100\s*:/.test(declarations));
    expect(themes).toHaveLength(2);
    for (const [, selector] of themes) {
      expect(selector.trim()).toMatch(/^\[data-theme="picata"\]\[data-mode="(?:light|dark)"\]$/);
    }
    expect(css).not.toMatch(/@media\s*\(prefers-color-scheme:/);
  });

  test("ships local font assets and licences with resolvable backend URLs", () => {
    const fonts = assets.filter((asset) => asset.fileName.endsWith(".ttf"));
    expect(fonts).toHaveLength(10);
    const fontUrls = [...css.matchAll(/url\(["']?([^"')]+\.ttf)["']?\)/g)];
    expect(fontUrls).toHaveLength(10);
    for (const [, url] of fontUrls) {
      expect(url).toMatch(/^\/static\/assets\//);
      expect(fonts.some((font) => font.fileName === url.replace(/^\/static\//, ""))).toBe(true);
    }
    const licences = assets.find((asset) => asset.fileName === "assets/font-licences.txt");
    expect(licences.source).toContain("SIL OPEN FONT LICENSE Version 1.1");
  });

  test("serves the style preview, compiled CSS and a local font", async () => {
    const server = await createServer({
      configFile: fileURLToPath(new URL("../../vite.config.js", import.meta.url)),
      logLevel: "silent",
      server: { host: "127.0.0.1", port: 0, open: false },
    });
    try {
      await server.listen();
      const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
      const page = await fetch(origin);
      expect(page.status).toBe(200);
      const html = await page.text();
      expect(html).toContain("Lutea style preview");
      expect(html).toContain('data-theme="picata" data-mode="light"');
      expect(html).toContain('data-theme="picata" data-mode="dark"');
      expect(html).toContain('data-font="system"');
      expect(html).toContain('data-font="picata"');
      for (const layout of ["one-column", "split-view", "definition-list", "three-column"]) {
        expect(html).toContain(`data-layout="${layout}"`);
      }
      expect(html).toContain('href="/src/styles/main.css"');
      const stylesheet = await fetch(`${origin}/src/styles/main.css?direct`);
      expect(stylesheet.status).toBe(200);
      expect(stylesheet.headers.get("content-type")).toContain("text/css");
      expect(await stylesheet.text()).toContain(".btn-primary");
      const font = await fetch(`${origin}/src/styles/fonts/picata/assets/ZillaSlab-Light.ttf`);
      expect(font.status).toBe(200);
      expect(new Uint8Array(await font.arrayBuffer()).slice(0, 4)).toEqual(new Uint8Array([0, 1, 0, 0]));
    } finally {
      await server.close();
    }
  });
});
