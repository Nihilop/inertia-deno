import { Application, Router } from "@oak/oak"
import { createInertia, serveStaticAsset, defer, lazy, merge } from "deno-inertia"
import { toWebRequest, applyResponse } from "deno-inertia/oak"
import { parseFormBody, validateForm, successResponse } from "../shared/form_handler.ts"
import { loadManifest, buildInertiaConfig, IS_PROD, FRONTEND, PORT, distDir } from "../shared/inertia_config.ts"

const manifest = await loadManifest()
const inertia  = createInertia(buildInertiaConfig(manifest, "Oak"))
const router   = new Router()
const app      = new Application()

// ---- Static assets (prod) ----
if (IS_PROD) {
  app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith("/assets/")) {
      const res = await serveStaticAsset(toWebRequest(ctx), distDir())
      if (res) { await applyResponse(ctx, res); return }
    }
    await next()
  })
}

// ---- Mock data (dashboard) ----
const dashStats = () => ({ totalUsers: 1_247, revenue: 89_234, activeNow: 42 })
const dashPosts = () => [
  { title: "Introduction à Deno 2.0",  views: 3_450 },
  { title: "Inertia.js + Deno",        views: 2_890 },
  { title: "Oak vs Hono — benchmark",  views: 1_230 },
]
const dashChart = () => ({
  labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"],
  data:   [45, 72, 58, 93, 81, 110],
})
const dashActivity = () => [
  { id: Date.now(),     text: "Alice a créé un compte",      time: "à l'instant" },
  { id: Date.now() + 1, text: "Bob a soumis le formulaire", time: "il y a 1 min" },
]

// ---- Routes GET ----
router.get("/",          async (ctx) => applyResponse(ctx, await inertia.render(toWebRequest(ctx), "Home",      { message: `Hello depuis Oak + ${FRONTEND} 🌳`, router: "Oak" })))
router.get("/about",     async (ctx) => applyResponse(ctx, await inertia.render(toWebRequest(ctx), "About",     { title: "À propos", router: "Oak" })))
router.get("/counter",   async (ctx) => applyResponse(ctx, await inertia.render(toWebRequest(ctx), "Counter",   { router: "Oak" })))
router.get("/form",      async (ctx) => applyResponse(ctx, await inertia.render(toWebRequest(ctx), "Form",      { router: "Oak" })))
router.get("/dashboard", async (ctx) => applyResponse(ctx, await inertia.render(toWebRequest(ctx), "Dashboard", {
  router:   "Oak",
  stats:    defer(dashStats),
  topPosts: defer(dashPosts, "sidebar"),
  chart:    lazy(dashChart),
  activity: merge(dashActivity),
})))

// ---- Route POST /form ----
router.post("/form", async (ctx) => {
  const req     = toWebRequest(ctx)
  const rawBody = await ctx.request.body.text()
  const fakeReq = new Request(req.url, {
    method:  "POST",
    headers: new Headers([...ctx.request.headers.entries()]),
    body:    rawBody,
  })
  const body   = await parseFormBody(fakeReq)
  const errors = validateForm(body)
  const res    = errors
    ? await inertia.renderWithErrors(req, "Form", { router: "Oak" }, errors)
    : successResponse()
  await applyResponse(ctx, res)
})

app.use(router.routes())
app.use(router.allowedMethods())

// ---- 404 Inertia ----
app.use(async (ctx) => {
  const req = toWebRequest(ctx)
  const res = await inertia.render(req, "NotFound", { router: "Oak" }, { status: 404 })
  await applyResponse(ctx, res)
})

console.log(`🌳 Oak   → http://localhost:${PORT}  (${FRONTEND} · ${IS_PROD ? "prod" : "dev"})`)
await app.listen({ port: PORT })
