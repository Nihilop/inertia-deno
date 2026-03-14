# Adapters

deno-inertia uses only Web APIs (`Request`/`Response`).
Adapters bridge these standard types with frameworks that have
their own abstractions (Oak, Hono).

---

## std/http — no adapter needed

`std/http` and `createRouter()` work directly with `Request`/`Response`.
No adapter is required.

```ts
import { createInertia, createRouter } from "deno-inertia"

const inertia = createInertia({ /* ... */ })
const router  = createRouter()

router.get("/", (req) => inertia.render(req, "Home", {}))

Deno.serve({ port: 3000 }, router.handler)
```

---

## Hono — `deno-inertia/hono`

Hono natively uses Web APIs — its handlers receive and return
standard `Request`/`Response`. The adapter only provides `toWebRequest(c)`
to extract the `Request` from the Hono context.

### Import

```jsonc
// deno.json
{
  "imports": {
    "deno-inertia":      "jsr:@deno-inertia/core",
    "deno-inertia/hono": "jsr:@deno-inertia/core/hono",
    "hono":              "jsr:@hono/hono@^4"
  }
}
```

### `toWebRequest(c)`

```ts
import { createInertia } from "deno-inertia"
import { toWebRequest }  from "deno-inertia/hono"
import { Hono }          from "hono"

const inertia = createInertia({ /* ... */ })
const app     = new Hono()

app.get("/", (c) =>
  inertia.render(toWebRequest(c), "Home", { title: "Home" })
)

app.post("/form", async (c) => {
  const body   = await c.req.parseBody()
  const errors = validate(body)
  if (errors) {
    return inertia.renderWithErrors(toWebRequest(c), "Form", {}, errors)
  }
  return inertia.redirect("/thank-you")
})

Deno.serve({ port: 3000 }, app.fetch)
```

> **Why not `c.req.raw` directly?**
> `toWebRequest(c)` is the exact equivalent of `c.req.raw`.
> It is provided for symmetry with the Oak adapter and to clarify intent.
> Both approaches work.

### No `applyResponse`

Unlike Oak, Hono returns `Response` objects directly from its handlers.
Since deno-inertia natively produces `Response` objects, no conversion
is needed on return — just return the result of `render()` directly.

---

## Oak — `deno-inertia/oak`

Oak uses its own context system (`Context`) that abstracts
`Request` and `Response`. The adapter provides two functions:

- `toWebRequest(ctx)` — converts the Oak context to a Web API `Request`
- `applyResponse(ctx, res)` — applies a Web API `Response` to the Oak context

### Import

```jsonc
// deno.json
{
  "imports": {
    "deno-inertia":     "jsr:@deno-inertia/core",
    "deno-inertia/oak": "jsr:@deno-inertia/core/oak",
    "@oak/oak":         "jsr:@oak/oak@^17"
  }
}
```

### `toWebRequest(ctx)`

Reconstructs a Web API `Request` from the Oak context.

```ts
import { toWebRequest } from "deno-inertia/oak"

router.get("/", async (ctx) => {
  const req = toWebRequest(ctx)
  const res = await inertia.render(req, "Home", {})
  await applyResponse(ctx, res)
})
```

### `applyResponse(ctx, res)`

Applies a Web API `Response` to the Oak context:
- Copies the HTTP status
- Copies all headers (`Set-Cookie`, `X-Inertia`, `Vary`, etc.)
- Handles 303 redirects (SPA POST → GET)
- Handles 409 (version mismatch — only `X-Inertia-Location` matters)
- Writes the body (HTML or JSON)

```ts
import { createInertia }              from "deno-inertia"
import { toWebRequest, applyResponse } from "deno-inertia/oak"
import { Application, Router }         from "@oak/oak"

const inertia = createInertia({ /* ... */ })
const app     = new Application()
const router  = new Router()

router.get("/", async (ctx) => {
  const req = toWebRequest(ctx)
  const res = await inertia.render(req, "Home", {})
  await applyResponse(ctx, res)
})

router.post("/form", async (ctx) => {
  const body   = await ctx.request.body.formData()
  const errors = validate(Object.fromEntries(body))
  const req    = toWebRequest(ctx)

  if (errors) {
    const res = await inertia.renderWithErrors(req, "Form", {}, errors)
    await applyResponse(ctx, res)
    return
  }

  await applyResponse(ctx, inertia.redirect("/thank-you"))
})

app.use(router.routes())
app.use(router.allowedMethods())
app.listen({ port: 3000 })
```

---

## Why separate packages?

Adapters are in separate exports (`./hono`, `./oak`) to avoid forcing
dependencies on all projects. A project using only Hono
does not download Oak, and vice versa.

| Import | Added dependency |
|---|---|
| `deno-inertia` | none (pure Web API) |
| `deno-inertia/hono` | `@hono/hono` |
| `deno-inertia/oak` | `@oak/oak` |

---

## Creating a custom adapter

For any framework that exposes a Web API `Request`, integration is trivial:

```ts
// Hypothetical framework
framework.use(async (ctx, next) => {
  const req = ctx.webRequest           // already a standard Request
  const res = await router.handler(req)
  ctx.sendResponse(res)
})
```

If the framework does not expose a standard `Request`, reconstruct one:

```ts
function toWebRequest(ctx: CustomCtx): Request {
  return new Request(ctx.url, {
    method:  ctx.method,
    headers: new Headers(ctx.headers),
    body:    ctx.hasBody ? ctx.rawBody : undefined,
  })
}
```
