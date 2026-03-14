# Router

`createRouter()` est un micro-router Web API sans dépendance.
Il supporte les paramètres nommés, le middleware et les groupes de routes.

```ts
import { createRouter } from "deno-inertia"

const router = createRouter()
```

---

## Méthodes HTTP

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

## Paramètres nommés

```ts
router.get("/posts/:slug/comments/:cid", (req, params) => {
  // params.slug, params.cid
  return Response.json(params)
})
```

- Notation `:nom` dans le chemin
- Les valeurs sont URL-décodées automatiquement
- Accessibles dans le deuxième argument du handler

---

## Codes de réponse automatiques

| Situation | Status |
|---|---|
| Aucune route ne correspond | 404 Not Found |
| Route trouvée mais mauvaise méthode | 405 Method Not Allowed |

---

## Middleware

`router.use(fn)` enregistre un middleware global exécuté avant chaque requête.
Les middlewares sont chaînés dans l'ordre d'enregistrement.

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

### Authentification

```ts
router.use(async (req, next) => {
  const { pathname } = new URL(req.url)

  // Routes publiques
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

### Court-circuit

Un middleware peut retourner directement une réponse sans appeler `next()` :

```ts
router.use(async (req, next) => {
  const token = req.headers.get("Authorization")
  if (!token) return new Response("Unauthorized", { status: 401 })
  return await next()
})
```

### Plusieurs middlewares

```ts
router.use(loggingMiddleware)   // exécuté en 1er
router.use(authMiddleware)      // exécuté en 2ème
// handler → exécuté en 3ème
```

---

## Groupes de routes

`router.group(prefix, fn)` préfixe un ensemble de routes.
Les groupes peuvent être **imbriqués**.

```ts
router.group("/api", (r) => {
  r.get("/status",  () => Response.json({ ok: true }))
  r.get("/version", () => Response.json({ v: "1.0.0" }))

  // Groupe imbriqué
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

Passer directement à `Deno.serve()` :

```ts
Deno.serve({ port: 3000 }, router.handler)
```

Ou comme handler dans `std/http` :

```ts
const response = await router.handler(request)
```

---

## Exemple complet

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

// API JSON (non-Inertia)
router.group("/api", (r) => {
  r.get("/health", () => Response.json({ status: "ok" }))
})

// Pages Inertia
router.get("/",       (req) => inertia.render(req, "Home", {}))
router.get("/about",  (req) => inertia.render(req, "About", {}))
router.post("/form",  async (req) => {
  const body   = await req.json()
  const errors = validate(body)
  if (errors) return inertia.renderWithErrors(req, "Form", {}, errors)
  return inertia.redirect("/merci")
})

// 404 Inertia
const handler = async (req: Request) => {
  const res = await router.handler(req)
  if (res.status === 404) {
    return inertia.render(req, "NotFound", {}, { status: 404 })
  }
  return res
}

Deno.serve({ port: 3000 }, handler)
```
