# Démarrage rapide

Ce guide crée un projet fonctionnel **Hono + Vue 3** en partant de zéro.
Adaptez les imports pour React ou un autre router si besoin.

> **Raccourci** — `inertia init mon-app` génère tout cela automatiquement.
> Voir [CLI](./cli.md).

---

## Structure minimale

```
mon-app/
├── deno.json
├── package.json
├── vite.config.ts
├── server.ts
└── src/
    ├── main.ts
    └── pages/
        └── Home.vue
```

---

## 1. `server.ts`

```ts
import { Hono } from "hono"
import { createInertia, pageToDiv, readViteManifest } from "deno-inertia"
import { toWebRequest } from "deno-inertia/hono"

const IS_PROD  = Deno.env.get("PROD_MODE") === "1"
const PORT     = Number(Deno.env.get("PORT") ?? 3000)
const VITE_URL = Deno.env.get("VITE_URL") ?? "http://localhost:5173"

// En production : lire le manifest généré par vite build
const manifest = IS_PROD
  ? await readViteManifest("dist/.vite/manifest.json")
  : null

const inertia = createInertia({
  version: "1.0.0",

  // Assets : Vite en dev, manifest en prod
  ...(IS_PROD && manifest
    ? { prod: { manifest, entry: "src/main.ts" } }
    : { vite: { url: VITE_URL, entry: "/src/main.ts" } }),

  // Template HTML complet
  template: (page, assets) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mon App</title>
  ${assets}
</head>
<body>
  ${pageToDiv(page)}
</body>
</html>`,
})

const app = new Hono()

// Route principale — rend le composant "Home" avec des props
app.get("/", async (c) =>
  inertia.render(toWebRequest(c), "Home", {
    message: "Hello depuis Hono + Vue 🦕",
  }),
)

Deno.serve({ port: PORT }, app.fetch)
console.log(`🦕 http://localhost:${PORT}`)
```

---

## 2. `src/main.ts` (Vue)

```ts
import { createApp, h } from "vue"
import { createInertiaApp } from "@inertiajs/vue3"

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("./pages/**/*.vue", { eager: true })
    const page  = pages[`./pages/${name}.vue`]
    if (!page) throw new Error(`Page introuvable : "${name}"`)
    return page as object
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
})
```

---

## 3. `src/pages/Home.vue`

```vue
<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <h1>{{ message }}</h1>
</template>
```

---

## 4. `deno.json`

```jsonc
{
  "imports": {
    "deno-inertia":      "jsr:@deno-inertia/core",
    "deno-inertia/hono": "jsr:@deno-inertia/core/hono",
    "hono":              "jsr:@hono/hono@^4"
  },
  "tasks": {
    "install": "npm install",
    "dev":     "deno run -A jsr:@deno-inertia/cli dev",
    "build":   "deno run -A jsr:@deno-inertia/cli build",
    "preview": "deno run -A jsr:@deno-inertia/cli preview"
  },
  "compilerOptions": {
    "lib": ["deno.ns", "dom", "dom.iterable", "esnext"]
  }
}
```

---

## 5. Lancer le projet

```bash
npm install       # installe Vite + Vue
deno task dev     # démarre Vite (:5173) + Deno (:3000)
```

Ouvrez `http://localhost:3000` — vous verrez `Hello depuis Hono + Vue 🦕`.

---

## Ce qui se passe

1. Le navigateur charge `http://localhost:3000/`
2. Deno répond avec le **HTML complet** (premier rendu) contenant `<div id="app" data-page="…">`
3. Vite injecte `@vite/client` (HMR) et `src/main.ts`
4. Vue monte le composant `Home` et hydrate les props JSON
5. Les navigations suivantes (`<Link href="…">`) font une requête avec `X-Inertia: true` → Deno répond du **JSON** → Vue met à jour la page sans rechargement

---

## Prochaines étapes

- [Configuration](./configuration.md) — options avancées de `createInertia()`
- [Props](./props.md) — lazy, deferred, merge props
- [Formulaires](./formulaires.md) — validation + error bags
- [CLI](./cli.md) — générer un projet complet avec `inertia init`
