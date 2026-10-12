import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const fontLicences = fileURLToPath(new URL("./src/styles/fonts/picata/assets/LICENSES.txt", import.meta.url));

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/static/" : "/",
  plugins: [
    tailwindcss(),
    {
      name: "lutea-font-licences",
      generateBundle() {
        this.addWatchFile(fontLicences);
        this.emitFile({
          type: "asset",
          fileName: "assets/font-licences.txt",
          source: readFileSync(fontLicences, "utf8"),
        });
      },
    },
  ],
  server: { host: "127.0.0.1", strictPort: true },
  build: {
    outDir: "build/vite/prod",
    manifest: "manifest.json",
    rolldownOptions: {
      input: { lutea: "src/styles/main.css" },
    },
  },
}));
