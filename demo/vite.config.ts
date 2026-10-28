import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const shim = (file: string) => path.resolve(import.meta.dirname, "src/shims", file);

/**
 * Démo hors ligne de CarView : application monopage qui réutilise les vues et
 * composants de l'application Next.js (src/), avec des adaptateurs pour
 * next/link, next/navigation et next/dynamic.
 * DEMO_BASE fixe le chemin de publication (ex. « /AutoScope/ » sur GitHub Pages).
 */
export default defineConfig({
  root: import.meta.dirname,
  base: process.env.DEMO_BASE ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${root}/src/$1` },
      { find: /^next\/link$/, replacement: shim("next-link.tsx") },
      { find: /^next\/navigation$/, replacement: shim("next-navigation.ts") },
      { find: /^next\/dynamic$/, replacement: shim("next-dynamic.tsx") },
    ],
  },
  build: {
    outDir: path.resolve(root, "dist-demo"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
  server: { port: 5173, fs: { allow: [root] } },
  preview: { port: 4173 },
});
