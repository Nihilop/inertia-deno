# Configuration — `InertiaConfig`

`createInertia(config)` accepte un objet `InertiaConfig`. Tous les champs sauf `template` sont optionnels.

```ts
import { createInertia } from "deno-inertia"
import type { InertiaConfig } from "deno-inertia"

const inertia = createInertia({ ...config })
```

---

## Référence complète

```ts
interface InertiaConfig {
  // ---- Obligatoire ----
  template: (page: PageData, assets: string) => string

  // ---- Versioning ----
  version?: string | (() => string | null)

  // ---- Props partagées ----
  shared?: PropsResolver
  always?: PropsResolver

  // ---- Assets Vite ----
  vite?: ViteDevConfig    // mode dev
  prod?: ViteProdConfig   // mode production

  // ---- Comportement ----
  clearFlash?:     boolean
  encryptHistory?: boolean
}
```

---

## `template` *(obligatoire)*

Fonction qui reçoit les données de page (`PageData`) et les balises d'assets (`string`)
et retourne le HTML complet de la page.

```ts
template: (page, assets) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Mon App</title>
  ${assets}
</head>
<body>
  ${pageToDiv(page)}
</body>
</html>`,
```

- `assets` — balises `<script>`/`<link>` générées par Vite (dev ou prod)
- `pageToDiv(page)` — sérialise `PageData` dans `<div id="app" data-page="…">`

---

## `version`

Déclenche un **hard reload** (409) si la version côté client diffère de celle du serveur.
Utile pour forcer le rechargement des assets après un déploiement.

```ts
// Valeur statique
version: "1.0.0"

// Calculée dynamiquement (ex: hash du dernier commit)
version: () => Deno.env.get("APP_VERSION") ?? null
```

Si `null`, la vérification est désactivée.

---

## `shared`

Props fusionnées dans **chaque** réponse Inertia (HTML et JSON).
Typiquement : `auth.user`, `csrf_token`, `locale`.

```ts
// Objet statique
shared: { appName: "Mon App" }

// Fonction synchrone ou asynchrone
shared: async (request) => {
  const user = await getSessionUser(request)
  return { auth: { user } }
}
```

En partial reload, `shared` peut être **filtré** si la clé n'est pas dans
`X-Inertia-Partial-Data`. Pour des props toujours incluses, utilisez `always`.

---

## `always`

Props **toujours incluses**, même lors d'un partial reload.
Idéal pour : `flash`, `auth.user`, `csrf_token`.

```ts
always: async (request) => ({
  flash: await readFlash(request),
  auth:  { user: await getUser(request) },
})
```

**Priorité** — `always` écrase `shared` si les mêmes clés sont présentes.

---

## `vite` — mode développement

```ts
interface ViteDevConfig {
  url?:    string   // URL du serveur Vite, défaut: "http://localhost:5173"
  entry:   string   // ex: "/src/main.ts" ou "/src/main.tsx"
  react?:  boolean  // injecte le preamble @react-refresh (React uniquement)
}
```

```ts
// Vue
vite: { url: "http://localhost:5173", entry: "/src/main.ts" }

// React — react: true injecte le preamble HMR requis par @vitejs/plugin-react
vite: { url: "http://localhost:5173", entry: "/src/main.tsx", react: true }
```

> **Important** — Sans `react: true`, `@vitejs/plugin-react` lève l'erreur
> `"can't detect preamble. Something is wrong."` car le HTML est servi par Deno
> et non par Vite.

---

## `prod` — mode production

```ts
interface ViteProdConfig {
  manifest: ViteManifest  // résultat de readViteManifest()
  entry:    string        // ex: "src/main.ts" (sans slash initial)
  base?:    string        // préfixe URL des assets, défaut: "/assets/"
}
```

```ts
const manifest = await readViteManifest("dist/.vite/manifest.json")

prod: { manifest, entry: "src/main.ts" }
```

---

## `clearFlash`

Si `true`, efface automatiquement le cookie `__flash` dans **chaque** réponse
`render()` (HTML et JSON). Évite d'appeler `clearFlashCookie()` manuellement.

```ts
clearFlash: true
```

---

## `encryptHistory`

Chiffre l'état de l'historique côté navigateur (Inertia v2).
Propagé dans le champ `encryptHistory` de `PageData`.

```ts
encryptHistory: true
```

Nécessite `@inertiajs/vue3@^2` ou `@inertiajs/react@^2`.

---

## Exemple complet

```ts
import { createInertia, readViteManifest, pageToDiv, readFlash } from "deno-inertia"

const IS_PROD = Deno.env.get("PROD_MODE") === "1"
const manifest = IS_PROD ? await readViteManifest("dist/.vite/manifest.json") : null

const inertia = createInertia({
  version: Deno.env.get("APP_VERSION") ?? "dev",

  shared: async (req) => ({
    locale: req.headers.get("Accept-Language")?.slice(0, 2) ?? "fr",
  }),

  always: async (req) => ({
    auth:  { user: await getSessionUser(req) },
    flash: await readFlash(req),
  }),

  ...(IS_PROD && manifest
    ? { prod: { manifest, entry: "src/main.ts" } }
    : { vite: { entry: "/src/main.ts" } }),

  clearFlash:     true,
  encryptHistory: false,

  template: (page, assets) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Mon App</title>
  ${assets}
</head>
<body>${pageToDiv(page)}</body>
</html>`,
})
```
