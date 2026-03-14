# TypeScript

deno-inertia est entièrement typé. Tous les types sont exportés depuis
`deno-inertia` et peuvent être importés directement.

```ts
import type {
  PageData,
  InertiaConfig,
  ValidationErrors,
  PropValue,
  PageProps,
  // ...
} from "deno-inertia"
```

---

## Types principaux

### `PageData`

Structure envoyée au client Inertia (dans `data-page` ou en JSON).

```ts
interface PageData {
  component:      string
  props:          Record<string, unknown>
  url:            string
  version:        string | null
  deferredProps?: Record<string, string[]>  // Inertia v2
  mergedProps?:   string[]                  // Inertia v2
  encryptHistory?: boolean                  // Inertia v2
}
```

### `InertiaConfig`

Configuration passée à `createInertia()`.

```ts
interface InertiaConfig {
  template:        (page: PageData, assets: string) => string
  version?:        string | (() => string | null)
  shared?:         PropsResolver
  always?:         PropsResolver
  vite?:           ViteDevConfig
  prod?:           ViteProdConfig
  clearFlash?:     boolean
  encryptHistory?: boolean
}
```

### `ValidationErrors`

Erreurs de validation retournées par `renderWithErrors()`.

```ts
type ValidationErrors = Record<string, string>
// ex: { email: "Email invalide", name: "Nom requis" }
```

### `PropsResolver` / `SharedPropsResolver`

Props partagées — objet statique ou fonction sync/async.

```ts
type PropsResolver =
  | Record<string, unknown>
  | ((request: Request) => Record<string, unknown> | Promise<Record<string, unknown>>)
```

---

## Props génériques : `PropValue<T>` et `PageProps<T>`

### `PropValue<T>`

Un type union qui représente toutes les formes qu'une prop serveur peut prendre :
valeur directe ou wrapped dans un marqueur.

```ts
type PropValue<T> = T | LazyProp<T> | DeferredProp<T> | MergedProp<T>
```

### `PageProps<T>`

Transforme un type de props de composant en acceptant `PropValue` pour chaque clé.

```ts
type PageProps<T extends Record<string, unknown>> = {
  [K in keyof T]: PropValue<NonNullable<T[K]>>
}
```

### Usage avec `render<T>()`

```ts
interface DashboardProps {
  router:   string
  stats?:   { totalUsers: number; revenue: number }
  chart?:   { labels: string[]; data: number[] }
  posts:    Post[]
}

// TypeScript valide chaque marqueur
inertia.render<DashboardProps>(req, "Dashboard", {
  router: "Hono",                    // ✅ string
  stats:  defer(getStats),           // ✅ DeferredProp<{ totalUsers; revenue }>
  chart:  lazy(getChart),            // ✅ LazyProp<{ labels; data }>
  posts:  merge(getPosts),           // ✅ MergedProp<Post[]>
})

// TypeScript error — mauvais type
inertia.render<DashboardProps>(req, "Dashboard", {
  router: 42,                        // ❌ number n'est pas string
  stats:  { totalUsers: 100 },       // ✅ valeur directe aussi acceptée
})
```

---

## Types Vite

### `ViteDevConfig`

```ts
interface ViteDevConfig {
  url?:   string   // défaut: "http://localhost:5173"
  entry:  string   // ex: "/src/main.ts"
  react?: boolean  // preamble React Refresh
}
```

### `ViteProdConfig`

```ts
interface ViteProdConfig {
  manifest: ViteManifest   // résultat de readViteManifest()
  entry:    string         // ex: "src/main.ts" (sans slash initial)
  base?:    string         // défaut: "/assets/"
}
```

### `ViteManifest` / `ManifestChunk`

```ts
interface ManifestChunk {
  file:      string
  src?:      string
  css?:      string[]
  imports?:  string[]
  isEntry?:  boolean
}

type ViteManifest = Record<string, ManifestChunk>
```

---

## Types Router

### `RouteHandler`

```ts
type RouteHandler = (
  request: Request,
  params:  Record<string, string>,
) => Response | Promise<Response>
```

### `MiddlewareFn`

```ts
type MiddlewareFn = (
  request: Request,
  next:    () => Promise<Response>,
) => Response | Promise<Response>
```

### `RouterGroup`

```ts
type RouterGroup = (router: ReturnType<typeof createRouter>) => void
```

---

## Types Flash

### `FlashMessage`

```ts
interface FlashMessage {
  success?: string
  error?:   string
  info?:    string
}
```

---

## Exemple — typage strict complet

```ts
import { createInertia, defer, lazy, merge, readFlash } from "deno-inertia"
import type { InertiaConfig, PageProps, ValidationErrors } from "deno-inertia"

// Props du composant Dashboard (côté serveur)
interface DashboardProps {
  router:      string
  userCount:   number
  stats?:      Stats          // sera passé via defer
  recentPosts: Post[]         // sera passé via merge
  heavyChart?: ChartData      // sera passé via lazy
}

// Config typée
const config: InertiaConfig = {
  version: "1.0.0",
  shared:  async (req) => ({ locale: "fr" }),
  always:  async (req) => ({ flash: readFlash(req) }),
  template: (page, assets) => `<html>...</html>`,
}

const inertia = createInertia(config)

// render<T> — TypeScript valide chaque prop
router.get("/dashboard", (req) =>
  inertia.render<DashboardProps>(req, "Dashboard", {
    router:      "std/http",
    userCount:   42,
    stats:       defer(getStats),
    recentPosts: merge(getPosts),
    heavyChart:  lazy(getChart),
  })
)

// renderWithErrors — erreurs typées
router.post("/form", async (req) => {
  const errors: ValidationErrors = {
    email: "Email invalide",
  }
  return inertia.renderWithErrors(req, "Form", { router: "std/http" }, errors)
})
```

---

## Référence complète des exports

```ts
// Fonctions
export { createInertia, pageToDiv, redirect }
export { viteDevScripts, viteProdAssets, readViteManifest, serveStaticAsset }
export { readFlash, flashCookie, clearFlashCookie }
export { createRouter }
export { lazy, LazyProp }
export { defer, DeferredProp }
export { merge, MergedProp }

// Types
export type { PageData, InertiaConfig, ViteDevConfig, ViteProdConfig }
export type { ViteManifest, ManifestChunk }
export type { SharedPropsResolver, PropsResolver }
export type { ValidationErrors }
export type { PropValue, PageProps }
export type { FlashMessage }
export type { RouteHandler, RouteParams, MiddlewareFn, RouterGroup }
```
