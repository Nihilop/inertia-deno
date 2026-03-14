# Intégration Vite

deno-inertia gère deux modes distincts : **développement** (Vite dev server + HMR)
et **production** (assets compilés depuis le manifest Vite).

```ts
import {
  viteDevScripts,
  viteProdAssets,
  readViteManifest,
  serveStaticAsset,
} from "deno-inertia"
```

---

## Architecture dev vs prod

```
Dev  : Navigateur ←→ Deno (:3000)
                       Vite (:5173) ← HMR, transforms, hot reload

Prod : Navigateur ←→ Deno (:3000)
                       dist/ ← assets compilés, hashed, immutable
```

---

## Mode développement

### `viteDevScripts(config)`

Génère les balises `<script>` pour le client Vite (HMR) et le point d'entrée frontend.

```ts
interface ViteDevConfig {
  url?:   string   // URL du serveur Vite, défaut: "http://localhost:5173"
  entry:  string   // Chemin de l'entrée — ex: "/src/main.ts"
  react?: boolean  // Injecter le preamble React Refresh (@react-refresh)
}
```

```ts
// Vue
viteDevScripts({ entry: "/src/main.ts" })
// génère :
// <script type="module" src="http://localhost:5173/@vite/client"></script>
// <script type="module" src="http://localhost:5173/src/main.ts"></script>
```

```ts
// React — react: true obligatoire
viteDevScripts({ entry: "/src/main.tsx", react: true })
// génère en plus :
// <script type="module">
//   import RefreshRuntime from "http://localhost:5173/@react-refresh"
//   RefreshRuntime.injectIntoGlobalHook(window)
//   window.$RefreshReg$ = () => {}
//   window.$RefreshSig$ = () => (type) => type
//   window.__vite_plugin_react_preamble_installed__ = true
// </script>
```

> **Pourquoi `react: true` ?**
> `@vitejs/plugin-react` exige un script "preamble" pour installer React Fast Refresh.
> Quand Vite sert lui-même le HTML (avec `index.html`), il l'injecte automatiquement.
> Ici Deno sert le HTML — il faut l'injecter manuellement.
> Sans ce flag : `"can't detect preamble. Something is wrong."`

### `vite.config.ts` — CORS obligatoire

Le navigateur charge les assets depuis Vite (:5173) mais la page vient de Deno (:3000).
Il faut activer CORS dans Vite :

```ts
export default defineConfig({
  server: { cors: true },
  // ...
})
```

---

## Mode production

### `readViteManifest(path)`

Lit le fichier `manifest.json` généré par `vite build`. À appeler une seule fois
au démarrage du serveur.

```ts
const manifest = await readViteManifest("dist/.vite/manifest.json")
```

### `viteProdAssets(entry, manifest, base?)`

Génère les balises `<link rel="stylesheet">`, `<link rel="modulepreload">` et
`<script type="module">` depuis le manifest Vite.

```ts
const assets = viteProdAssets("src/main.ts", manifest)
// → <link rel="modulepreload" href="/assets/vendor-abc123.js">
//   <link rel="stylesheet"    href="/assets/style-def456.css">
//   <script type="module"     src="/assets/main-ghi789.js"></script>
```

- Résout récursivement les CSS des chunks importés (code splitting)
- Génère `modulepreload` pour les chunks JS importés
- `base` — préfixe URL des assets, défaut `/assets/`

### `serveStaticAsset(request, distDir, base?)`

Sert les fichiers statiques du répertoire `dist/` avec
`Cache-Control: public, max-age=31536000, immutable`.

```ts
// Dans le handler principal
async function handler(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)

  if (pathname.startsWith("/assets/")) {
    const res = await serveStaticAsset(request, "dist")
    return res ?? new Response("Not Found", { status: 404 })
  }

  return router.handler(request)
}
```

Retourne `null` si l'URL ne commence pas par `base`.

---

## Usage dans `InertiaConfig`

Utilisez les deux modes de façon conditionnelle via la variable `PROD_MODE` :

```ts
const IS_PROD = Deno.env.get("PROD_MODE") === "1"
const manifest = IS_PROD ? await readViteManifest("dist/.vite/manifest.json") : null

const inertia = createInertia({
  ...(IS_PROD && manifest
    ? { prod: { manifest, entry: "src/main.ts" } }
    : { vite: { entry: "/src/main.ts" } }),     // Vue
    // : { vite: { entry: "/src/main.tsx", react: true } }),  // React
  // ...
})
```

---

## Plugin optionnel : backend-reload

`examples/vite_plugin_backend_reload.ts` est un plugin Vite qui surveille les
fichiers backend (`server.ts`, lib) et envoie un `full-reload` au navigateur
quand ils changent. Le serveur Deno se relance déjà grâce à `--watch`,
ce plugin recharge le navigateur après.

```ts
// vite.config.ts
// import { backendReloadPlugin } from "./vite_plugin_backend_reload.ts"

export default defineConfig({
  plugins: [
    vue(),
    // backendReloadPlugin(), // décommenter pour activer
  ],
})
```

Désactivé par défaut — le double-reload peut gêner quand on travaille uniquement
sur le frontend.
