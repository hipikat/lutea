import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/static/" : "/",
  plugins: [tailwindcss()],
  server: { host: "127.0.0.1", strictPort: true },
  build: {
    outDir: "build/vite/prod",
    manifest: "manifest.json",
    rolldownOptions: {
      input: { lutea: "src/styles/main.css" },
    },
  },
}));
