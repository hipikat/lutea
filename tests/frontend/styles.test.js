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
    expect(css).toContain("font-family: var(--font-serif)");
    expect(css).not.toContain("@apply");
  });

  test("keeps test-only classes out of the shipped stylesheet", () => {
    // z-[987654] deliberately occurs only in this test source.
    expect(css).not.toContain("987654");
  });

  test("preserves Picata's fl/ad palette roles", () => {
    const palettes = {
      fl: {
        primary: "#134f62", secondary: "#583c5b", accent: "#00b3a9",
        neutral: "#1f1008", "base-100": "#f3f9f7", info: "#71bcfe",
        success: "#7fbb70", warning: "#daba00", error: "#f57592",
      },
      ad: {
        primary: "#b6b8e6", secondary: "#99c9bc", accent: "#ffc293",
        neutral: "#3b5d6e", "base-100": "#1b303b", info: "#18bdcf",
        success: "#40b78e", warning: "#b6b14d", error: "#f38fa1",
      },
    };
    for (const [name, palette] of Object.entries(palettes)) {
      const theme = css.match(new RegExp(`\\[data-theme="?${name}"?\\][^{]*\\{([^}]+)`))[1];
      for (const [role, color] of Object.entries(palette)) {
        expect(theme).toContain(`--color-${role}: ${color}`);
      }
    }
  });

  test("serves the two-theme preview and its compiled CSS", async () => {
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
      expect(html).toContain('data-theme="fl"');
      expect(html).toContain('data-theme="ad"');
      expect(html).toContain('href="/src/styles/main.css"');
      const stylesheet = await fetch(`${origin}/src/styles/main.css?direct`);
      expect(stylesheet.status).toBe(200);
      expect(stylesheet.headers.get("content-type")).toContain("text/css");
      expect(await stylesheet.text()).toContain(".btn-primary");
    } finally {
      await server.close();
    }
  });
});
