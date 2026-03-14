import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
// import { backendReloadPlugin } from "./vite_plugin_backend_reload.ts"

export default defineConfig({
  plugins: [
    vue(),
    // backendReloadPlugin(), // décommenter pour recharger le browser quand le serveur change
  ],
  server: {
    cors: true,
  },
  build: {
    manifest:  true,
    outDir:    "dist/vue",
    assetsDir: "assets",
    rollupOptions: {
      input: "src/vue/main.ts",
    },
  },
})
