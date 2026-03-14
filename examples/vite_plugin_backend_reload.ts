import type { Plugin } from "vite"
import { watch } from "node:fs"

/**
 * Plugin Vite — surveille les fichiers backend (serveurs + lib) et envoie
 * un `full-reload` au browser à chaque changement de fichier `.ts`.
 *
 * Contexte : le serveur Deno tourne avec `--watch` et se relance automatiquement
 * à chaque modification. Ce plugin recharge ensuite le browser une fois que Vite
 * détecte l'activité, évitant le rechargement manuel.
 *
 * Activation : décommenter dans `vite.vue.config.ts` / `vite.react.config.ts`.
 * Désactivation recommandée : si tu travailles uniquement sur le frontend (double
 * watch + reload systématique peuvent gêner le DX dans ce cas).
 *
 * @param dirs - Dossiers à surveiller (relatifs à `examples/`).
 *               Par défaut : serveurs + lib racine.
 *
 * @example
 *   // vite.vue.config.ts
 *   import { backendReloadPlugin } from "./vite_plugin_backend_reload.ts"
 *   export default defineConfig({
 *     plugins: [vue(), backendReloadPlugin()],
 *   })
 */
export function backendReloadPlugin(
  dirs: string[] = ["./hono", "./oak", "./std", "../"],
): Plugin {
  return {
    name: "deno-inertia:backend-reload",
    apply: "serve",

    configureServer(server) {
      for (const dir of dirs) {
        watch(dir, { recursive: true }, (_event, filename) => {
          if (!filename) return
          // Surveille uniquement les .ts backend (ignore dist, node_modules, src frontend)
          if (!filename.endsWith(".ts")) return
          if (filename.includes("node_modules")) return
          if (filename.includes("dist")) return
          // Ignore les fichiers frontend (src/) — Vite les gère nativement
          if (filename.startsWith("src")) return

          server.hot.send({ type: "full-reload" })
        })
      }
    },
  }
}
