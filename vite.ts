import type { ViteDevConfig, ViteManifest } from "./types.ts"

// Re-export types for convenience
export type { ViteManifest }
export type { ManifestChunk } from "./types.ts"

// ---------------------------------------------------------------------------
// Dev — Injection des scripts HMR Vite
// ---------------------------------------------------------------------------

/**
 * Génère les balises <script> nécessaires au client Vite (HMR inclus).
 * Le navigateur se connecte directement au serveur Vite : aucun proxy requis.
 *
 * Si `config.react` est true, injecte également le preamble React Refresh
 * (@react-refresh) exigé par @vitejs/plugin-react. Sans lui, le plugin lève
 * "can't detect preamble. Something is wrong." car il ne peut pas installer
 * le runtime HMR React dans la page servie par Deno (hors Vite).
 */
export function viteDevScripts(config: ViteDevConfig): string {
  const base  = config.url?.replace(/\/$/, "") ?? "http://localhost:5173"
  const entry = config.entry.startsWith("/") ? config.entry : `/${config.entry}`
  const tags: string[] = []

  if (config.react) {
    // Preamble React Refresh — doit précéder le script d'entrée
    tags.push(
      `<script type="module">\n` +
      `    import RefreshRuntime from "${base}/@react-refresh"\n` +
      `    RefreshRuntime.injectIntoGlobalHook(window)\n` +
      `    window.$RefreshReg$ = () => {}\n` +
      `    window.$RefreshSig$ = () => (type) => type\n` +
      `    window.__vite_plugin_react_preamble_installed__ = true\n` +
      `  </script>`,
    )
  }

  tags.push(
    `<script type="module" src="${base}/@vite/client"></script>`,
    `<script type="module" src="${base}${entry}"></script>`,
  )

  return tags.join("\n  ")
}

// ---------------------------------------------------------------------------
// Production — Lecture du manifest Vite
// ---------------------------------------------------------------------------

/**
 * Lit le fichier `.vite/manifest.json` généré par `vite build`.
 * À appeler une seule fois au démarrage du serveur.
 *
 * @example
 *   const manifest = await readViteManifest("dist/vue/.vite/manifest.json")
 */
export async function readViteManifest(manifestPath: string): Promise<ViteManifest> {
  const text = await Deno.readTextFile(manifestPath)
  return JSON.parse(text) as ViteManifest
}

/**
 * Génère les balises <link> (CSS) et <script> (JS) depuis le manifest Vite.
 * Résout également les CSS des chunks importés (code splitting).
 *
 * @param entry    - Clé d'entrée dans le manifest, ex: "src/vue/main.ts"
 * @param manifest - Manifest parsé via readViteManifest
 * @param base     - Préfixe de chemin public, ex: "/assets/"
 */
export function viteProdAssets(
  entry: string,
  manifest: ViteManifest,
  base = "/assets/",
): string {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`
  const key   = entry.replace(/^\//, "")
  const chunk = manifest[key]

  if (!chunk) {
    throw new Error(
      `[deno-inertia] Entry "${key}" introuvable dans le manifest Vite.\n` +
      `Vérifiez que "entry" dans InertiaConfig.prod correspond à la clé du manifest ` +
      `(ex: "src/main.ts" sans slash initial).\n` +
      `Clés disponibles : ${Object.keys(manifest).join(", ")}`
    )
  }

  const cssFiles  = new Set<string>()
  const jsChunks  = new Set<string>()

  // Résolution récursive des CSS (chunks importés inclus)
  function walk(chunkKey: string) {
    const c = manifest[chunkKey]
    if (!c) return
    for (const css of c.css ?? []) cssFiles.add(css)
    for (const imp of c.imports ?? []) {
      if (!jsChunks.has(imp)) {
        jsChunks.add(imp)
        walk(imp)
      }
    }
  }
  walk(key)

  const tags: string[] = []

  // Les chemins dans le manifest Vite sont relatifs au dist root (ex: "assets/main.js").
  // On retire le segment "assets/" initial pour éviter de le doubler avec normalizedBase.
  const toUrl = (file: string) =>
    `${normalizedBase}${file.replace(/^assets\//, "")}`

  // Preload des chunks JS importés
  for (const imp of jsChunks) {
    const impChunk = manifest[imp]
    if (impChunk) {
      tags.push(`<link rel="modulepreload" href="${toUrl(impChunk.file)}">`)
    }
  }

  // Feuilles CSS
  for (const css of cssFiles) {
    tags.push(`<link rel="stylesheet" href="${toUrl(css)}">`)
  }

  // CSS du chunk d'entrée (après les chunks importés)
  for (const css of chunk.css ?? []) {
    if (!cssFiles.has(css)) {
      tags.push(`<link rel="stylesheet" href="${toUrl(css)}">`)
    }
  }

  // JS principal
  tags.push(`<script type="module" src="${toUrl(chunk.file)}"></script>`)

  return tags.join("\n    ")
}

// ---------------------------------------------------------------------------
// Middleware static files (assets compilés par Vite)
// ---------------------------------------------------------------------------

/**
 * Sert les fichiers statiques du répertoire `dist/[frontend]/`.
 * À utiliser en mode production pour servir les assets Vite.
 *
 * Retourne null si l'URL ne correspond pas au préfixe `base`.
 * Retourne une Response 404 si le fichier n'existe pas.
 *
 * @example
 *   const res = await serveStaticAsset(request, "dist/vue", "/assets/")
 *   if (res) return res
 */
export async function serveStaticAsset(
  request: Request,
  distDir: string,
  base = "/assets/",
): Promise<Response | null> {
  const { pathname } = new URL(request.url)
  const normalizedBase = base.endsWith("/") ? base : `${base}/`

  if (!pathname.startsWith(normalizedBase)) return null

  const relativePath = pathname.slice(normalizedBase.length)

  // Reject path traversal — Vite assets are content-hashed, no ".." is ever legitimate
  if (relativePath.includes("..")) {
    return new Response("403 Forbidden", { status: 403 })
  }

  const filePath = `${distDir.replace(/\/$/, "")}/assets/${relativePath}`

  try {
    const file = await Deno.readFile(filePath)
    const mime = guessMime(filePath)
    return new Response(file, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable", // assets hashed → cache long
      },
    })
  } catch {
    return new Response("404 Not Found", { status: 404 })
  }
}

function guessMime(path: string): string {
  if (path.endsWith(".js"))            return "application/javascript"
  if (path.endsWith(".mjs"))           return "application/javascript"
  if (path.endsWith(".css"))           return "text/css"
  if (path.endsWith(".svg"))           return "image/svg+xml"
  if (path.endsWith(".png"))           return "image/png"
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg"
  if (path.endsWith(".webp"))          return "image/webp"
  if (path.endsWith(".gif"))           return "image/gif"
  if (path.endsWith(".avif"))          return "image/avif"
  if (path.endsWith(".woff2"))         return "font/woff2"
  if (path.endsWith(".woff"))          return "font/woff"
  if (path.endsWith(".ttf"))           return "font/ttf"
  if (path.endsWith(".ico"))           return "image/x-icon"
  if (path.endsWith(".json"))          return "application/json"
  if (path.endsWith(".txt"))           return "text/plain"
  return "application/octet-stream"
}
