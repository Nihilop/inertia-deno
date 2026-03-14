# Installation

## Prérequis

| Outil | Version minimale | Rôle |
|---|---|---|
| [Deno](https://deno.land) | 2.x | Runtime serveur |
| [Node.js](https://nodejs.org) | 18+ | Nécessaire pour Vite (npm/npx) |

> **Astuce** — Le CLI `@streemkit/inertia-deno-cli` gère tout ça automatiquement.
> Voir [CLI → init](./cli.md) pour créer un projet en une commande.

---

## Installation manuelle

### 1. `deno.json`

Ajoutez `@streemkit/inertia-deno` dans les imports de votre projet :

```jsonc
// deno.json
{
  "imports": {
    "deno-inertia": "jsr:@streemkit/inertia-deno"
  }
}
```

Avec le router de votre choix :

```jsonc
// Hono
{
  "imports": {
    "deno-inertia":      "jsr:@streemkit/inertia-deno",
    "deno-inertia/hono": "jsr:@streemkit/inertia-deno/hono",
    "hono":              "jsr:@hono/hono@^4"
  }
}
```

```jsonc
// Oak
{
  "imports": {
    "deno-inertia":     "jsr:@streemkit/inertia-deno",
    "deno-inertia/oak": "jsr:@streemkit/inertia-deno/oak",
    "@oak/oak":         "jsr:@oak/oak@^17"
  }
}
```

### 2. `package.json` — dépendances npm (Vite + frontend)

```jsonc
// package.json
{
  "devDependencies": {
    "vite": "^6.0.0",

    // Vue 3
    "vue":                "^3.5.0",
    "@inertiajs/vue3":    "^2.0.0",
    "@vitejs/plugin-vue": "^5.0.0",

    // React 18 (alternative)
    "react":                "^18.3.0",
    "react-dom":            "^18.3.0",
    "@types/react":         "^18.3.0",
    "@types/react-dom":     "^18.3.0",
    "@inertiajs/react":     "^2.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

```bash
npm install      # ou pnpm install / yarn / bun install
```

### 3. `vite.config.ts`

```ts
// Vue
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  server: { cors: true },          // autorise les requêtes depuis le serveur Deno
  build: {
    manifest: true,                // génère .vite/manifest.json
    outDir: "dist",
    rollupOptions: { input: "src/main.ts" },
  },
})
```

```ts
// React
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: { cors: true },
  build: {
    manifest: true,
    outDir: "dist",
    rollupOptions: { input: "src/main.tsx" },
  },
})
```

### 4. `compilerOptions` (React uniquement)

Si vous utilisez React avec `deno check`, ajoutez dans `deno.json` :

```jsonc
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "lib": ["deno.ns", "dom", "dom.iterable", "esnext"]
  }
}
```

Pour Vue, seul `lib` est nécessaire (Vite gère le JSX) :

```jsonc
{
  "compilerOptions": {
    "lib": ["deno.ns", "dom", "dom.iterable", "esnext"]
  }
}
```

---

## Vérification

```bash
deno check server.ts      # type-check du serveur
deno task dev             # démarre Vite + serveur Deno
```

→ Voir [Démarrage rapide](./demarrage-rapide.md) pour la suite.
