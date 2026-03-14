# TypeScript

deno-inertia is fully typed. All types are exported from
`deno-inertia` and can be imported directly.

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

## Core types

### `PageData`

Structure sent to the Inertia client (in `data-page` or as JSON).

```ts
interface PageData {
  component:       string
  props:           Record<string, unknown>
  url:             string
  version:         string | null
  deferredProps?:  Record<string, string[]>  // Inertia v2
  mergedProps?:    string[]                  // Inertia v2
  encryptHistory?: boolean                   // Inertia v2
}
```

### `InertiaConfig`

Configuration passed to `createInertia()`.

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

Validation errors returned by `renderWithErrors()`.

```ts
type ValidationErrors = Record<string, string>
// e.g. { email: "Invalid email", name: "Name required" }
```

### `PropsResolver` / `SharedPropsResolver`

Shared props — static object or sync/async function.

```ts
type PropsResolver =
  | Record<string, unknown>
  | ((request: Request) => Record<string, unknown> | Promise<Record<string, unknown>>)
```

---

## Generic props: `PropValue<T>` and `PageProps<T>`

### `PropValue<T>`

A union type that represents all forms a server prop can take:
direct value or wrapped in a marker.

```ts
type PropValue<T> = T | LazyProp<T> | DeferredProp<T> | MergedProp<T>
```

### `PageProps<T>`

Transforms a component props type to accept `PropValue` for each key.

```ts
type PageProps<T extends Record<string, unknown>> = {
  [K in keyof T]: PropValue<NonNullable<T[K]>>
}
```

### Usage with `render<T>()`

```ts
interface DashboardProps {
  router:   string
  stats?:   { totalUsers: number; revenue: number }
  chart?:   { labels: string[]; data: number[] }
  posts:    Post[]
}

// TypeScript validates each marker
inertia.render<DashboardProps>(req, "Dashboard", {
  router: "Hono",                    // ✅ string
  stats:  defer(getStats),           // ✅ DeferredProp<{ totalUsers; revenue }>
  chart:  lazy(getChart),            // ✅ LazyProp<{ labels; data }>
  posts:  merge(getPosts),           // ✅ MergedProp<Post[]>
})

// TypeScript error — wrong type
inertia.render<DashboardProps>(req, "Dashboard", {
  router: 42,                        // ❌ number is not string
  stats:  { totalUsers: 100 },       // ✅ direct value also accepted
})
```

---

## Vite types

### `ViteDevConfig`

```ts
interface ViteDevConfig {
  url?:   string   // default: "http://localhost:5173"
  entry:  string   // e.g. "/src/main.ts"
  react?: boolean  // React Refresh preamble
}
```

### `ViteProdConfig`

```ts
interface ViteProdConfig {
  manifest: ViteManifest   // result of readViteManifest()
  entry:    string         // e.g. "src/main.ts" (no leading slash)
  base?:    string         // default: "/assets/"
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

## Router types

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

## Flash types

### `FlashMessage`

```ts
interface FlashMessage {
  success?: string
  error?:   string
  info?:    string
}
```

---

## Full example — strict typing

```ts
import { createInertia, defer, lazy, merge, readFlash } from "deno-inertia"
import type { InertiaConfig, PageProps, ValidationErrors } from "deno-inertia"

// Component props (server side)
interface DashboardProps {
  router:      string
  userCount:   number
  stats?:      Stats          // will be passed via defer
  recentPosts: Post[]         // will be passed via merge
  heavyChart?: ChartData      // will be passed via lazy
}

// Typed config
const config: InertiaConfig = {
  version: "1.0.0",
  shared:  async (req) => ({ locale: "en" }),
  always:  async (req) => ({ flash: readFlash(req) }),
  template: (page, assets) => `<html>...</html>`,
}

const inertia = createInertia(config)

// render<T> — TypeScript validates each prop
router.get("/dashboard", (req) =>
  inertia.render<DashboardProps>(req, "Dashboard", {
    router:      "std/http",
    userCount:   42,
    stats:       defer(getStats),
    recentPosts: merge(getPosts),
    heavyChart:  lazy(getChart),
  })
)

// renderWithErrors — typed errors
router.post("/form", async (req) => {
  const errors: ValidationErrors = {
    email: "Invalid email",
  }
  return inertia.renderWithErrors(req, "Form", { router: "std/http" }, errors)
})
```

---

## Full export reference

```ts
// Functions
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
