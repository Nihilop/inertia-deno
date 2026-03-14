import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
// import { backendReloadPlugin } from "./vite_plugin_backend_reload.ts"

export default defineConfig({
  plugins: [
    react(),
    // backendReloadPlugin(), // décommenter pour recharger le browser quand le serveur change
  ],
  server: {
    cors: true,
  },
  build: {
    manifest:  true,
    outDir:    "dist/react",
    assetsDir: "assets",
    rollupOptions: {
      input: "src/react/main.tsx",
    },
  },
})
