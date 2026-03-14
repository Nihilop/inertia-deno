# Router

`createRouter()` is a Web API micro-router with no dependencies.
It supports named parameters, middleware, and route groups.

```ts
import { createRouter } from "deno-inertia"

const router = createRouter()
```

---

## HTTP methods

```ts
router.get("/",         handler)
router.post("/form",    handler)
router.put("/user/:id", handler)
router.patch("/item/:id", handler)
router.delete("/post/:id", handler)
```

### `RouteHandler`

```ts
type RouteHandler = (
  request: Request,
  params:  Record<string, string>,
) => Response | Promise<Response>
```

```ts
router.get("/users/:id", (req, params) => {
  return Response.json({ userId: params.id })
})
```

---

## Named parameters

```ts
router.get("/posts/:slug/comments/:cid", (req, params) => {
  // params.slug, params.cid
  return Response.json(params)
})
```

- `:name` notation in the path
- Values are URL-decoded automatically
- Accessible in the second argument of the handler

---

## Automatic response codes

| Situation | Status |
|---|---|
| No matching route | 404 Not Found |
| Route found but wrong method | 405 Method Not Allowed |

---

## Middleware

`router.use(fn)` registers a global middleware executed before each request.
Middlewares are chained in registration order.

```ts
type MiddlewareFn = (
  request: Request,
  next:    () => Promise<Response>,
) => Response | Promise<Response>
```

### Logging

```ts
router.use(async (req, next) => {
  const start = Date.now()
  const res   = await next()
  const ms    = Date.now() - start
  console.log(`${req.method} ${new URL(req.url).pathname} → ${res.status} (${ms}ms)`)
  return res
})
```

### Authentication

```ts
router.use(async (req, next) => {
  const { pathname } = new URL(req.url)

  // Public routes
  if (pathname === "/" || pathname.startsWith("/public")) {
    return await next()
  }

  const user = await getSessionUser(req)
  if (!user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    })
  }

  return await next()
})
```

### Short-circuiting

A middleware can return a response directly without calling `next()`:

```ts
router.use(async (req, next) => {
  const token = req.headers.get("Authorization")
  if (!token) return new Response("Unauthorized", { status: 401 })
  return await next()
})
```

### Multiple middlewares

```ts
router.use(loggingMiddleware)   // executed first
router.use(authMiddleware)      // executed second
// handler → executed third
```

---

## Route groups

`router.group(prefix, fn)` prefixes a set of routes.
Groups can be **nested**.

```ts
router.group("/api", (r) => {
  r.get("/status",  () => Response.json({ ok: true }))
  r.get("/version", () => Response.json({ v: "1.0.0" }))

  // Nested group
  r.group("/admin", (r2) => {
    r2.get("/stats",  () => Response.json({ admin: true }))
    r2.post("/reset", () => Response.json({ done: true }))
  })
})
// → GET /api/status
// → GET /api/version
// → GET /api/admin/stats
// → POST /api/admin/reset
```

---

## `router.handler`

Pass directly to `Deno.serve()`:

```ts
Deno.serve({ port: 3000 }, router.handler)
```

Or as a handler in `std/http`:

```ts
const response = await router.handler(request)
```

---

## Full example

```ts
import { createInertia, createRouter, readFlash } from "deno-inertia"

const inertia = createInertia({ /* ... */ })
const router  = createRouter()

// Logging middleware
router.use(async (req, next) => {
  const res = await next()
  console.log(`${req.method} ${new URL(req.url).pathname} ${res.status}`)
  return res
})

// JSON API (non-Inertia)
router.group("/api", (r) => {
  r.get("/health", () => Response.json({ status: "ok" }))
})

// Inertia pages
router.get("/",      (req) => inertia.render(req, "Home", {}))
router.get("/about", (req) => inertia.render(req, "About", {}))
router.post("/form", async (req) => {
  const body   = await req.json()
  const errors = validate(body)
  if (errors) return inertia.renderWithErrors(req, "Form", {}, errors)
  return inertia.redirect("/thank-you")
})

// Inertia 404
const handler = async (req: Request) => {
  const res = await router.handler(req)
  if (res.status === 404) {
    return inertia.render(req, "NotFound", {}, { status: 404 })
  }
  return res
}

Deno.serve({ port: 3000 }, handler)
```
