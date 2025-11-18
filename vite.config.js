import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        popup: "index.html",
        background: "src/service-worker.ts",
        inject: "src/inject.ts"
      },
      output: {
        entryFileNames: "[name].js"
      }
    }
  }
});
