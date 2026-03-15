# Adapters

deno-inertia utilise exclusivement les Web API (`Request`/`Response`).
Les adapters font le pont entre ces types standards et les frameworks qui ont
leurs propres abstractions (Oak, Hono).

---

## std/http — aucun adapter nécessaire

`std/http` et `createRouter()` travaillent directement avec `Request`/`Response`.
Aucun adapter n'est requis.

```ts
import { createInertia, createRouter } from "deno-inertia"

const inertia = createInertia({ /* ... */ })
const router  = createRouter()

router.get("/", (req) => inertia.render(req, "Home", {}))

Deno.serve({ port: 3000 }, router.handler)
```

---

## Hono — `deno-inertia/hono`

Hono utilise nativement les Web API — ses handlers reçoivent et retournent
des `Request`/`Response` standards. L'adapter fournit uniquement `toWebRequest(c)`
pour extraire le `Request` du contexte Hono.

### Import

```jsonc
// deno.json
{
  "imports": {
    "deno-inertia":      "jsr:@streemkit/inertia-deno",
    "deno-inertia/hono": "jsr:@streemkit/inertia-deno/hono",
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
  inertia.render(toWebRequest(c), "Home", { title: "Accueil" })
)

app.post("/form", async (c) => {
  const body   = await c.req.parseBody()
  const errors = validate(body)
  if (errors) {
    return inertia.renderWithErrors(toWebRequest(c), "Form", {}, errors)
  }
  return inertia.redirect("/merci")
})

Deno.serve({ port: 3000 }, app.fetch)
```

> **Pourquoi pas `c.req.raw` directement ?**
> `toWebRequest(c)` est l'équivalent exact de `c.req.raw`.
> Il est fourni pour la symétrie avec l'adapter Oak et pour clarifier l'intention.
> Les deux approches fonctionnent.

### `serveAssets(distDir, base?)`

Middleware Hono qui sert les assets Vite compilés depuis `dist/` avec
`Cache-Control: public, max-age=31536000, immutable` (noms de fichiers hashés).

```ts
import { serveAssets } from "deno-inertia/hono"

if (Deno.env.get("PROD_MODE") === "1") {
  app.use("/assets/*", serveAssets("dist"))
}
```

- Rejette les path traversal (`..`) avec 403
- Détecte automatiquement le type MIME depuis l'extension
- `base` — préfixe URL à retirer, défaut : `"/assets/"`

### Pas d'`applyResponse`

Contrairement à Oak, Hono retourne directement des `Response` depuis ses handlers.
Puisque deno-inertia produit nativement des `Response`, aucune conversion
n'est nécessaire en retour — on retourne directement le résultat de `render()`.

---

## Oak — `deno-inertia/oak`

Oak utilise son propre système de contexte (`Context`) qui abstrait
`Request` et `Response`. L'adapter fournit deux fonctions :

- `toWebRequest(ctx)` — convertit le contexte Oak en `Request` Web API
- `applyResponse(ctx, res)` — applique une `Response` Web API sur le contexte Oak

### Import

```jsonc
// deno.json
{
  "imports": {
    "deno-inertia":     "jsr:@streemkit/inertia-deno",
    "deno-inertia/oak": "jsr:@streemkit/inertia-deno/oak",
    "@oak/oak":         "jsr:@oak/oak@^17"
  }
}
```

### `toWebRequest(ctx)`

Reconstruit un `Request` Web API depuis le contexte Oak.

```ts
import { toWebRequest } from "deno-inertia/oak"

router.get("/", async (ctx) => {
  const req = toWebRequest(ctx)
  const res = await inertia.render(req, "Home", {})
  await applyResponse(ctx, res)
})
```

### `applyResponse(ctx, res)`

Applique une `Response` Web API sur le contexte Oak :
- Copie le status HTTP
- Copie tous les headers (`Set-Cookie`, `X-Inertia`, `Vary`, etc.)
- Gère les redirections 303 (SPA POST → GET)
- Gère les 409 (version mismatch — seul `X-Inertia-Location` compte)
- Écrit le corps (HTML ou JSON)

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

  await applyResponse(ctx, inertia.redirect("/merci"))
})

app.use(router.routes())
app.use(router.allowedMethods())
app.listen({ port: 3000 })
```

---

## Pourquoi des packages séparés ?

Les adapters sont dans des exports séparés (`./hono`, `./oak`) pour ne pas forcer
les dépendances sur tous les projets. Un projet qui utilise uniquement Hono
ne télécharge pas Oak, et inversement.

| Import | Dépendance ajoutée |
|---|---|
| `deno-inertia` | aucune (Web API pure) |
| `deno-inertia/hono` | `@hono/hono` |
| `deno-inertia/oak` | `@oak/oak` |

---

## Créer un adapter personnalisé

Pour tout framework qui expose un `Request` Web API, l'intégration est triviale :

```ts
// Framework hypothétique
framework.use(async (ctx, next) => {
  const req = ctx.webRequest           // déjà un Request standard
  const res = await router.handler(req)
  ctx.sendResponse(res)
})
```

Si le framework n'expose pas de `Request` standard, il suffit d'en reconstruire un :

```ts
function toWebRequest(ctx: CustomCtx): Request {
  return new Request(ctx.url, {
    method:  ctx.method,
    headers: new Headers(ctx.headers),
    body:    ctx.hasBody ? ctx.rawBody : undefined,
  })
}
```
