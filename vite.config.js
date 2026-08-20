import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/redio/",
  plugins: [vue()],
  build: {
    outDir: "dist/redio",
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: false
  }
});
