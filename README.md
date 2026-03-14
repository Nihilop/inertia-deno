# deno-inertia

Implémentation du protocole [Inertia.js](https://inertiajs.com) pour Deno,
**agnostique au router**, basée sur le Web API standard (`Request` / `Response`).

## Architecture

```
/           ← La librairie (@deno-inertia/core)
examples/   ← Exemples & environnement de développement
docs/       ← Documentation
```

## Prérequis

- [Deno](https://deno.land) ≥ 2.0
- [Node.js](https://nodejs.org) ≥ 18 (pour Vite — uniquement en dev/build)

---

## Exemples

### Installation

```bash
cd examples
deno task install   # npm install (une seule fois)
```

### Lancer un serveur

Chaque commande spawne Vite (port 5173) + le serveur Deno (port 3000) en parallèle.
L'application est disponible sur **http://localhost:3000**.

```bash
deno task dev:hono:vue
deno task dev:hono:react
deno task dev:oak:vue
deno task dev:oak:react
deno task dev:std:vue
deno task dev:std:react
```

Le HMR fonctionne : le navigateur se connecte directement à Vite.
Le serveur Deno redémarre automatiquement sur chaque modification (back + lib).

### Pages de démo

| Route | Description |
|-------|-------------|
| `/` | Home — message + badges router/frontend |
| `/about` | Explication du protocole Inertia |
| `/counter` | État client pur (Vue ref / React useState) |
| `/form` | Formulaire POST — validation, erreurs, flash |

### Structure des exemples

```
examples/
├── shared/           ← helpers partagés entre les 3 serveurs
│   ├── inertia_config.ts
│   ├── shared_props.ts
│   ├── form_handler.ts
│   └── oak_adapter.ts
├── hono/server.ts    ← serveur Hono
├── oak/server.ts     ← serveur Oak
├── std/server.ts     ← serveur std/http
└── src/              ← frontend partagé (Vue + React)
```

---

## Production

### Build

```bash
cd examples
deno task build:vue     # → examples/dist/vue/
deno task build:react   # → examples/dist/react/
```

### Preview (serveur Deno sans Vite)

```bash
deno task preview:hono:vue
deno task preview:hono:react
deno task preview:std:vue
deno task preview:std:react
```

---

## Utilisation de la librairie

### Minimal

```ts
import { createInertia, pageToDiv } from "jsr:@deno-inertia/core"

const inertia = createInertia({
  template: (page, assets) => `<!DOCTYPE html>
<html><head>${assets}</head><body>${pageToDiv(page)}</body></html>`,
  vite: { entry: "/src/vue/main.ts" },
})

// Dans n'importe quel handler Web standard :
return await inertia.render(request, "Home", { user: "Nihilo" })
```

### Avec shared props (auth, flash, etc.)

```ts
const inertia = createInertia({
  shared: async (request) => ({
    auth:  { user: await getUser(request) },
    flash: readFlash(request),
  }),
  // ...
})
```

`shared` peut être un objet statique ou une fonction sync/async.

### Lazy props

```ts
import { lazy } from "jsr:@deno-inertia/core"

inertia.render(request, "Dashboard", {
  summary: await getSummary(),           // calculée à chaque render
  heavyStats: lazy(() => getStats()),    // calculée seulement si demandée en partial reload
})
```

### Gestion des formulaires POST

```ts
// Validation échouée → 422 + erreurs injectées dans les props
if (errors) {
  return inertia.renderWithErrors(request, "Form", { ...props }, errors)
}

// Succès → 303 + cookie flash
return redirect("/form", {
  "Set-Cookie": flashCookie({ success: "Formulaire envoyé !" }),
})
```

### Mode production

```ts
import { readViteManifest } from "jsr:@deno-inertia/core"

const manifest = await readViteManifest("dist/vue/.vite/manifest.json")

const inertia = createInertia({
  prod: { manifest, entry: "src/vue/main.ts", base: "/assets/" },
  // ...
})
```

### Adapter Oak

```ts
import { toWebRequest, applyResponse } from "./examples/shared/oak_adapter.ts"

router.get("/", async (ctx) => {
  const res = await inertia.render(toWebRequest(ctx), "Home", { ... })
  await applyResponse(ctx, res)
})
```

---

## Protocole Inertia

| Situation | Request | Response |
|---|---|---|
| Première visite | `GET` sans `X-Inertia` | HTML complet |
| Navigation SPA | `GET` + `X-Inertia: true` | `200` JSON `{ component, props, url, version }` |
| POST (formulaire) | `POST` + `X-Inertia: true` | `422` JSON (erreurs) ou `303` (succès) |
| Mismatch assets | `X-Inertia-Version` ≠ serveur | `409` + `X-Inertia-Location` |

---

## API

### `createInertia(config)`

| Champ | Type | Description |
|---|---|---|
| `version` | `string \| () => string \| null` | Version assets pour cache-busting |
| `shared` | `PropsResolver` | Props partagées filtrables (auth, flash…) |
| `always` | `PropsResolver` | Props toujours incluses, même en partial reload |
| `template` | `(page, assets) => string` | Builder du HTML complet |
| `vite` | `{ url?, entry }` | Config dev (HMR) |
| `prod` | `{ manifest, entry, base? }` | Config prod (manifest Vite) |

### `lazy(fn)`

Marque une prop comme lazy — exclue du render initial, calculée uniquement lors d'un partial reload explicite.

### Flash

| Fonction | Description |
|---|---|
| `flashCookie(msg)` | Génère `Set-Cookie` pour poser un flash |
| `readFlash(request)` | Lit le cookie flash depuis un `Request` |
| `clearFlashCookie()` | Génère le `Set-Cookie` Max-Age=0 pour effacer |

---

## Publication JSR (future)

```bash
deno publish   # depuis la racine
```
