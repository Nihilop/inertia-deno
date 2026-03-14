# @streemkit/inertia-deno

**Inertia.js server-side adapter for Deno** — build modern single-page apps without a separate API layer, using the full-stack architecture you love.

Works with any Web API-compatible router: **Hono**, **Oak**, **std/http**, or the built-in micro-router.
Supports **Inertia v1 and v2** features: lazy props, deferred props, merge props, history encryption.

```sh
deno add jsr:@streemkit/inertia-deno
```

---

## Features

- **Zero framework lock-in** — uses only standard `Request`/`Response` primitives
- **Hono, Oak, std/http** adapters included out of the box
- **Vite integration** — HMR in dev, content-hashed assets in prod
- **Inertia v2** — deferred props, merge props, history encryption
- **Lazy props** — computed only when explicitly requested in a partial reload
- **Flash messages** — HTTP-only cookie-based, auto-cleared after consumption
- **Built-in micro-router** — `URLPattern`-based, supports middleware and route groups
- **TypeScript-first** — all public types exported, no slow types (JSR-compliant)

---

## Quick start

### With Hono

```ts
import { Hono } from "hono"
import { createInertia, pageToDiv } from "@streemkit/inertia-deno"
import { toWebRequest } from "@streemkit/inertia-deno/hono"

const inertia = createInertia({
  version: "1.0.0",
  vite: { entry: "src/main.ts" },
  template: (page, assets) => `<!DOCTYPE html>
<html>
  <head>${assets}</head>
  <body>${pageToDiv(page)}</body>
</html>`,
})

const app = new Hono()

app.get("/", (c) =>
  inertia.render(toWebRequest(c), "Home", { message: "Hello!" })
)

Deno.serve(app.fetch)
```

### With Oak

```ts
import { Application, Router } from "@oak/oak"
import { createInertia, pageToDiv } from "@streemkit/inertia-deno"
import { toWebRequest, applyResponse } from "@streemkit/inertia-deno/oak"

const inertia = createInertia({ /* ... */ })
const router  = new Router()

router.get("/", async (ctx) => {
  const res = await inertia.render(toWebRequest(ctx), "Home", { message: "Hello!" })
  await applyResponse(ctx, res)
})

const app = new Application()
app.use(router.routes())
await app.listen({ port: 3000 })
```

### With the built-in router (std/http)

```ts
import { createInertia, pageToDiv, createRouter } from "@streemkit/inertia-deno"

const inertia = createInertia({ /* ... */ })
const router  = createRouter()

router.get("/", (req) =>
  inertia.render(req, "Home", { message: "Hello!" })
)

Deno.serve(router.handler)
```

---

## Configuration

```ts
const inertia = createInertia({
  // Asset version — triggers a forced hard reload if the client has a different version
  version: "1.0.0",

  // Shared props — merged into every page; can be filtered out by a partial reload
  shared: (req) => ({
    auth: getUser(req),
  }),

  // Always props — included even in partial reloads (auth, flash, csrf…)
  always: (req) => ({
    flash: readFlash(req),
  }),

  // HTML template builder
  template: (page, assets) => `<!DOCTYPE html>
<html>
  <head>${assets}</head>
  <body>${pageToDiv(page)}</body>
</html>`,

  // Vite dev server — injects the client script + entry point for HMR
  vite: { entry: "src/main.ts" },

  // OR production mode — reads the Vite manifest for hashed filenames
  // prod: { manifest: await readViteManifest("dist/.vite/manifest.json"), entry: "src/main.ts" },

  // Automatically clear the flash cookie after each render
  clearFlash: true,

  // Encrypt browser history state (Inertia v2)
  encryptHistory: false,
})
```

---

## Props

### Lazy props

Excluded from every render by default. Resolved **only** when the client explicitly requests the key via a partial reload (`router.reload({ only: ['heavyChart'] })`):

```ts
import { lazy } from "@streemkit/inertia-deno"

inertia.render(req, "Dashboard", {
  summary:    getSummary(),              // computed on every render
  heavyChart: lazy(() => getChart()),   // computed only on partial reload
})
```

### Deferred props _(Inertia v2)_

Excluded from the first render — the server announces their keys in `deferredProps` and the **client auto-fetches** them after paint. Requires `@inertiajs/vue3@^2` or `@inertiajs/react@^2`:

```ts
import { defer } from "@streemkit/inertia-deno"

inertia.render(req, "Dashboard", {
  title:       "Dashboard",
  stats:       defer(() => getStats()),            // group "default"
  topUsers:    defer(() => getTopUsers()),          // group "default" — fetched together
  permissions: defer(() => getPerms(), "sidebar"), // separate group
})
```

```vue
<!-- Vue 3 (Inertia v2) -->
<Deferred data="stats">
  <template #fallback><Spinner /></template>
  <template #default="{ stats }">{{ stats.total }} users</template>
</Deferred>
```

### Merge props _(Inertia v2)_

Always computed and sent, but the **client accumulates** values instead of replacing on partial reload — useful for infinite scroll / load-more patterns:

```ts
import { merge } from "@streemkit/inertia-deno"

inertia.render(req, "Feed", {
  posts: merge(() => getLatestPosts(req)),
})

// Client-side: each reload({ only: ['posts'] }) appends to the existing array
```

---

## Form validation

```ts
import { redirect } from "@streemkit/inertia-deno"
import type { ValidationErrors } from "@streemkit/inertia-deno"

router.post("/contact", async (req) => {
  const body   = await req.formData()
  const errors: ValidationErrors = {}

  if (!body.get("email")) errors.email = "Required"
  if (!body.get("message")) errors.message = "Required"

  if (Object.keys(errors).length > 0) {
    // Returns 422 — Inertia client re-populates form.errors
    return inertia.renderWithErrors(req, "Contact", {}, errors)
  }

  await sendEmail(body)
  return redirect("/contact?success=1")
})
```

---

## Flash messages

```ts
import { readFlash, flashCookie, redirect } from "@streemkit/inertia-deno"

// 1. Include flash in always props (available on every page)
const inertia = createInertia({
  always:     (req) => ({ flash: readFlash(req) }),
  clearFlash: true, // auto-clears the cookie on the next response
})

// 2. Set a flash message after a successful POST
router.post("/contact", async (req) => {
  await sendEmail(req)
  return redirect("/contact", {
    "Set-Cookie": flashCookie({ success: "Message sent!" }),
  })
})
```

---

## Built-in router

A lightweight `URLPattern`-based router with no dependencies — pass `router.handler` directly to `Deno.serve()`:

```ts
import { createRouter } from "@streemkit/inertia-deno"

const router = createRouter()

// Global middleware (logging, auth guards, session…)
router.use(async (req, next) => {
  const start = Date.now()
  const res   = await next()
  console.log(`${req.method} ${new URL(req.url).pathname} ${Date.now() - start}ms`)
  return res
})

// Route groups with a shared prefix
router.group("/admin", (r) => {
  r.get("/dashboard", adminDashboard)
  r.get("/users",     adminUsers)
  r.group("/settings", (r2) => {
    r2.get("/", adminSettings)
  })
})

// Named URL parameters
router.get("/posts/:slug", (req, params) =>
  inertia.render(req, "Post", { slug: params.slug })
)

Deno.serve(router.handler)
```

---

## Vite integration

**Development (HMR):**

```ts
createInertia({
  vite: {
    entry: "src/main.ts",
    url:   "http://localhost:5173", // default
    react: true,                   // inject React Refresh preamble
  },
})
```

**Production:**

```ts
import { readViteManifest, serveStaticAsset } from "@streemkit/inertia-deno"

const manifest = await readViteManifest("dist/.vite/manifest.json")

const inertia = createInertia({
  prod: {
    manifest,
    entry: "src/main.ts",
    base:  "/assets/", // default
  },
})

// Serve hashed static files with immutable cache headers
router.get("/assets/*", (req) => serveStaticAsset(req, "dist"))
```

---

## Scaffold a new project

The companion CLI scaffolds a ready-to-run project in seconds:

```sh
deno install -g -A jsr:@streemkit/inertia-deno-cli -n inertia
inertia init my-app
```

Interactive wizard — choose **Vue 3** or **React 18**, and **Hono**, **Oak**, or **std/http**:

```
cd my-app
deno task install   # npm install (Vite + frontend deps)
deno task dev       # Vite :5173 + Deno server :3000 in parallel
deno task build     # compile frontend → dist/
deno task preview   # production mode, no Vite
```

See [@streemkit/inertia-deno-cli](https://jsr.io/@streemkit/inertia-deno-cli) for full CLI docs.

---

## Inertia protocol — how it works

| Situation | Request | Response |
|---|---|---|
| First visit | `GET` (no `X-Inertia` header) | Full HTML page |
| SPA navigation | `GET` + `X-Inertia: true` | `200` JSON `{ component, props, url, version }` |
| Form POST | `POST` + `X-Inertia: true` | `422` JSON (errors) or `303` redirect |
| Asset version mismatch | `X-Inertia-Version` ≠ server | `409` + `X-Inertia-Location` (force hard reload) |
| Partial reload | `GET` + `X-Inertia-Partial-Data: key1,key2` | `200` JSON with only requested props |
| Deferred props | `GET` + `X-Inertia-Partial-Data` (auto) | `200` JSON with deferred group props |

---

## License

MIT © [streemkit](https://streemkit.com)
