import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: "src/renderer",
  plugins: [react()],
  resolve: {
    alias: [
      // csak "@/..." alias, ne érintse pl. @codemirror/*
      { find: /^@\//, replacement: path.resolve(__dirname, "src") + "/" }
    ]
  },
  server: { port: 5173 },
  // fontos: hogy file:// alatt is működjenek az assetek
  base: "./",
  build: {
    outDir: "../../dist",
    emptyOutDir: false,
    sourcemap: true
  }
});
