/**
 * Suite de tests unitaires — deno-inertia
 *
 * Couvre : protocole Inertia (HTML, SPA, 409), props (shared, always, lazy,
 * defer, merge, encryptHistory), named error bags, router (params, 404, 405,
 * middleware, groupes).
 *
 * Lancement :
 *   deno test --allow-none core.test.ts
 */

import { assertEquals, assertStringIncludes } from "jsr:@std/assert"
import { createInertia, pageToDiv } from "./core.ts"
import { createRouter } from "./router.ts"
import { lazy } from "./lazy.ts"
import { defer } from "./defer.ts"
import { merge } from "./merge.ts"
import type { InertiaConfig } from "./types.ts"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<InertiaConfig> = {}): InertiaConfig {
  return {
    template: (page, assets) => `<html><body>${pageToDiv(page)}${assets}</body></html>`,
    version: "1.0",
    ...overrides,
  }
}

function plainRequest(path: string, extraHeaders: Record<string, string> = {}): Request {
  return new Request(`http://localhost${path}`, { headers: extraHeaders })
}

function inertiaRequest(path: string, extraHeaders: Record<string, string> = {}): Request {
  return new Request(`http://localhost${path}`, {
    headers: {
      "X-Inertia": "true",
      "X-Inertia-Version": "1.0",
      ...extraHeaders,
    },
  })
}

function partialRequest(
  path: string,
  component: string,
  only: string[],
): Request {
  return inertiaRequest(path, {
    "X-Inertia-Partial-Component": component,
    "X-Inertia-Partial-Data": only.join(","),
  })
}

// ---------------------------------------------------------------------------
// pageToDiv
// ---------------------------------------------------------------------------

Deno.test("pageToDiv: échappe correctement les entités HTML", () => {
  const div = pageToDiv({ component: "Home", props: { x: "<script>" }, url: "/", version: null })
  assertStringIncludes(div, 'id="app"')
  assertStringIncludes(div, "data-page=")
  // Les < > doivent être échappés pour être safe dans un attribut
  assertStringIncludes(div, "&lt;script&gt;")
})

// ---------------------------------------------------------------------------
// render — première visite (HTML)
// ---------------------------------------------------------------------------

Deno.test("render: première visite → HTML complet avec div#app", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(plainRequest("/"), "Home", { title: "Test" })
  assertEquals(res.status, 200)
  assertEquals(res.headers.get("Content-Type"), "text/html; charset=utf-8")
  const body = await res.text()
  assertStringIncludes(body, 'id="app"')
  // Les " du JSON sont encodés en &quot; dans l'attribut data-page
  assertStringIncludes(body, "&quot;component&quot;:&quot;Home&quot;")
  assertStringIncludes(body, "&quot;title&quot;:&quot;Test&quot;")
})

// ---------------------------------------------------------------------------
// render — navigation SPA (X-Inertia: true)
// ---------------------------------------------------------------------------

Deno.test("render: X-Inertia: true → JSON PageData avec headers requis", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(inertiaRequest("/"), "Home", { title: "Test" })
  assertEquals(res.status, 200)
  assertEquals(res.headers.get("X-Inertia"), "true")
  assertEquals(res.headers.get("Vary"), "X-Inertia")
  assertEquals(res.headers.get("Content-Type"), "application/json")
  const page = await res.json()
  assertEquals(page.component, "Home")
  assertEquals(page.props.title, "Test")
  assertEquals(page.url, "/")
  assertEquals(page.version, "1.0")
})

// ---------------------------------------------------------------------------
// Version mismatch
// ---------------------------------------------------------------------------

Deno.test("render: version mismatch → 409 + X-Inertia-Location", async () => {
  const inertia = createInertia(makeConfig({ version: "2.0" }))
  // Client envoie version 1.0 mais serveur est 2.0
  const req = inertiaRequest("/dashboard", { "X-Inertia-Version": "1.0" })
  const res = await inertia.render(req, "Dashboard", {})
  assertEquals(res.status, 409)
  assertEquals(res.headers.get("X-Inertia-Location"), "/dashboard")
})

Deno.test("render: pas de mismatch si même version", async () => {
  const inertia = createInertia(makeConfig({ version: "1.0" }))
  const res = await inertia.render(inertiaRequest("/"), "Home", {})
  assertEquals(res.status, 200)
})

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

Deno.test("shared props: mergées dans chaque réponse", async () => {
  const inertia = createInertia(makeConfig({ shared: { user: "Alice" } }))
  const res = await inertia.render(inertiaRequest("/"), "Home", { title: "Test" })
  const page = await res.json()
  assertEquals(page.props.user, "Alice")
  assertEquals(page.props.title, "Test")
})

Deno.test("shared props (fonction async): résolues à chaque requête", async () => {
  let counter = 0
  const inertia = createInertia(makeConfig({
    shared: async () => ({ count: ++counter }),
  }))
  await inertia.render(inertiaRequest("/"), "Home", {})
  const res = await inertia.render(inertiaRequest("/"), "Home", {})
  const page = await res.json()
  assertEquals(page.props.count, 2)
})

// ---------------------------------------------------------------------------
// Always props
// ---------------------------------------------------------------------------

Deno.test("always props: incluses dans un partial reload", async () => {
  const inertia = createInertia(makeConfig({ always: { csrf: "token123" } }))
  const res = await inertia.render(
    partialRequest("/", "Home", ["title"]),
    "Home",
    { title: "Test", other: "ignored" },
  )
  const page = await res.json()
  assertEquals(page.props.csrf, "token123")
  assertEquals(page.props.title, "Test")
  assertEquals(page.props.other, undefined)
})

// ---------------------------------------------------------------------------
// Lazy props
// ---------------------------------------------------------------------------

Deno.test("lazy: absente du render initial", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(inertiaRequest("/"), "Home", {
    title: "Test",
    chart: lazy(() => ({ data: [1, 2, 3] })),
  })
  const page = await res.json()
  assertEquals(page.props.title, "Test")
  assertEquals(page.props.chart, undefined)
})

Deno.test("lazy: calculée si explicitement demandée en partial reload", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(
    partialRequest("/", "Home", ["chart"]),
    "Home",
    {
      title: "Test",
      chart: lazy(() => ({ data: [1, 2, 3] })),
    },
  )
  const page = await res.json()
  assertEquals(page.props.chart?.data[0], 1)
  // title non demandé → absent (pas une always prop)
  assertEquals(page.props.title, undefined)
})

Deno.test("lazy: absente d'une navigation SPA normale", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(inertiaRequest("/"), "Home", {
    chart: lazy(() => ({ data: [42] })),
  })
  const page = await res.json()
  assertEquals(page.props.chart, undefined)
})

// ---------------------------------------------------------------------------
// Deferred props
// ---------------------------------------------------------------------------

Deno.test("defer: exclue du render initial, annoncée dans deferredProps", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(inertiaRequest("/"), "Dashboard", {
    title: "Dashboard",
    stats:   defer(() => ({ total: 100 })),
    sidebar: defer(() => ({ posts: [] }), "sidebar"),
  })
  const page = await res.json()
  assertEquals(page.props.title, "Dashboard")
  assertEquals(page.props.stats, undefined)
  assertEquals(page.props.sidebar, undefined)
  assertEquals(page.deferredProps?.default, ["stats"])
  assertEquals(page.deferredProps?.sidebar, ["sidebar"])
})

Deno.test("defer: calculée si demandée en partial reload", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(
    partialRequest("/", "Dashboard", ["stats"]),
    "Dashboard",
    {
      stats: defer(() => ({ total: 100 })),
    },
  )
  const page = await res.json()
  assertEquals(page.props.stats?.total, 100)
  // Pas de deferredProps dans un partial reload
  assertEquals(page.deferredProps, undefined)
})

// ---------------------------------------------------------------------------
// Merge props
// ---------------------------------------------------------------------------

Deno.test("merge: toujours calculée et incluse dans la réponse", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(inertiaRequest("/"), "Feed", {
    posts: merge(() => [{ id: 1 }, { id: 2 }]),
  })
  const page = await res.json()
  assertEquals(page.props.posts?.length, 2)
  assertEquals(page.mergedProps, ["posts"])
})

Deno.test("merge: clé présente dans mergedProps du partial reload", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(
    partialRequest("/", "Feed", ["posts"]),
    "Feed",
    { posts: merge(() => [{ id: 3 }]) },
  )
  const page = await res.json()
  assertEquals(page.props.posts[0].id, 3)
  assertEquals(page.mergedProps, ["posts"])
})

// ---------------------------------------------------------------------------
// encryptHistory
// ---------------------------------------------------------------------------

Deno.test("encryptHistory: propagé dans PageData si activé globalement", async () => {
  const inertia = createInertia(makeConfig({ encryptHistory: true }))
  const res = await inertia.render(inertiaRequest("/"), "Home", {})
  const page = await res.json()
  assertEquals(page.encryptHistory, true)
})

Deno.test("encryptHistory: absent si non configuré", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(inertiaRequest("/"), "Home", {})
  const page = await res.json()
  assertEquals(page.encryptHistory, undefined)
})

// ---------------------------------------------------------------------------
// Named error bags
// ---------------------------------------------------------------------------

Deno.test("renderWithErrors: erreurs directes (pas de bag)", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.renderWithErrors(
    inertiaRequest("/form"),
    "Form",
    { router: "std" },
    { email: "Email requis" },
  )
  assertEquals(res.status, 422)
  const page = await res.json()
  assertEquals(page.props.errors?.email, "Email requis")
})

Deno.test("renderWithErrors: errorBag → errors namespaced", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.renderWithErrors(
    inertiaRequest("/form"),
    "Form",
    {},
    { email: "Email requis" },
    "contact",
  )
  assertEquals(res.status, 422)
  const page = await res.json()
  assertEquals(page.props.errors?.contact?.email, "Email requis")
})

Deno.test("renderWithErrors: X-Inertia-Error-Bag header → bag automatique", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.renderWithErrors(
    inertiaRequest("/form", { "X-Inertia-Error-Bag": "login" }),
    "Form",
    {},
    { password: "Mot de passe requis" },
  )
  assertEquals(res.status, 422)
  const page = await res.json()
  assertEquals(page.props.errors?.login?.password, "Mot de passe requis")
})

// ---------------------------------------------------------------------------
// Router — routes de base
// ---------------------------------------------------------------------------

Deno.test("router: route GET simple", async () => {
  const router = createRouter()
  router.get("/about", () => new Response("ok", { status: 200 }))
  const res = await router.handler(plainRequest("/about"))
  assertEquals(res.status, 200)
  assertEquals(await res.text(), "ok")
})

Deno.test("router: 404 si aucune route", async () => {
  const router = createRouter()
  router.get("/about", () => new Response("ok"))
  const res = await router.handler(plainRequest("/unknown"))
  assertEquals(res.status, 404)
})

Deno.test("router: 405 si route trouvée mais mauvaise méthode", async () => {
  const router = createRouter()
  router.get("/form", () => new Response("ok"))
  const res = await router.handler(
    new Request("http://localhost/form", { method: "POST" }),
  )
  assertEquals(res.status, 405)
})

// ---------------------------------------------------------------------------
// Router — paramètres nommés
// ---------------------------------------------------------------------------

Deno.test("router: paramètre nommé :id", async () => {
  const router = createRouter()
  router.get("/users/:id", (_req, params) => Response.json({ id: params.id }))
  const res = await router.handler(plainRequest("/users/42"))
  assertEquals(res.status, 200)
  const body = await res.json()
  assertEquals(body.id, "42")
})

Deno.test("router: multiples paramètres nommés", async () => {
  const router = createRouter()
  router.get("/posts/:slug/comments/:cid", (_req, params) =>
    Response.json({ slug: params.slug, cid: params.cid }),
  )
  const res = await router.handler(plainRequest("/posts/hello-world/comments/5"))
  const body = await res.json()
  assertEquals(body.slug, "hello-world")
  assertEquals(body.cid, "5")
})

// ---------------------------------------------------------------------------
// Router — middleware
// ---------------------------------------------------------------------------

Deno.test("router: middleware exécuté avant le handler (ordre before/after)", async () => {
  const router = createRouter()
  const log: string[] = []

  router.use(async (req, next) => {
    log.push("before")
    const res = await next()
    log.push("after")
    return res
  })

  router.get("/", () => {
    log.push("handler")
    return new Response("ok")
  })

  await router.handler(plainRequest("/"))
  assertEquals(log, ["before", "handler", "after"])
})

Deno.test("router: middlewares chaînés dans l'ordre d'enregistrement", async () => {
  const router = createRouter()
  const log: string[] = []

  router.use(async (req, next) => { log.push("mw1"); return await next() })
  router.use(async (req, next) => { log.push("mw2"); return await next() })

  router.get("/", () => { log.push("handler"); return new Response("ok") })

  await router.handler(plainRequest("/"))
  assertEquals(log, ["mw1", "mw2", "handler"])
})

Deno.test("router: middleware peut court-circuiter le handler", async () => {
  const router = createRouter()

  router.use((_req, _next) => new Response("blocked", { status: 403 }))
  router.get("/secret", () => new Response("secret"))

  const res = await router.handler(plainRequest("/secret"))
  assertEquals(res.status, 403)
  assertEquals(await res.text(), "blocked")
})

// ---------------------------------------------------------------------------
// Router — groupes de routes
// ---------------------------------------------------------------------------

Deno.test("router: groupe de routes préfixé", async () => {
  const router = createRouter()
  router.group("/api", (r) => {
    r.get("/status", () => Response.json({ ok: true }))
    r.get("/version", () => Response.json({ v: "1.0" }))
  })

  const res1 = await router.handler(plainRequest("/api/status"))
  assertEquals(res1.status, 200)
  assertEquals((await res1.json()).ok, true)

  const res2 = await router.handler(plainRequest("/api/version"))
  assertEquals((await res2.json()).v, "1.0")
})

Deno.test("router: groupes imbriqués", async () => {
  const router = createRouter()
  router.group("/api", (r) => {
    r.group("/admin", (r2) => {
      r2.get("/stats", () => Response.json({ admin: true }))
    })
  })

  const res = await router.handler(plainRequest("/api/admin/stats"))
  assertEquals(res.status, 200)
  assertEquals((await res.json()).admin, true)

  // Route hors du groupe → 404
  const res404 = await router.handler(plainRequest("/admin/stats"))
  assertEquals(res404.status, 404)
})

// ---------------------------------------------------------------------------
// responseInit — status personnalisé
// ---------------------------------------------------------------------------

Deno.test("render: responseInit.status respecté", async () => {
  const inertia = createInertia(makeConfig())
  const res = await inertia.render(
    plainRequest("/not-found"),
    "NotFound",
    {},
    { status: 404 },
  )
  assertEquals(res.status, 404)
})

// ---------------------------------------------------------------------------
// redirect
// ---------------------------------------------------------------------------

Deno.test("redirect: retourne 303 avec header Location", async () => {
  const inertia = createInertia(makeConfig())
  const res = inertia.redirect("/dashboard")
  assertEquals(res.status, 303)
  assertEquals(res.headers.get("Location"), "/dashboard")
})
