import { Hono } from "hono"
import { createInertia, serveStaticAsset, defer, lazy, merge } from "deno-inertia"
import { toWebRequest } from "deno-inertia/hono"
import { parseFormBody, validateForm, successResponse } from "../shared/form_handler.ts"
import { buildInertiaConfig, IS_PROD, FRONTEND, PORT, distDir } from "../shared/inertia_config.ts"

const inertia = createInertia(buildInertiaConfig("Hono"))
const app      = new Hono()

// ---- Static assets (prod) ----
if (IS_PROD) {
  app.get("/assets/*", async (c) => {
    const res = await serveStaticAsset(c.req.raw, distDir())
    return res ?? c.notFound()
  })
}

// ---- Mock data (dashboard) ----
const dashStats    = () => ({ totalUsers: 1_247, revenue: 89_234, activeNow: 42 })
const dashPosts    = () => [
  { title: "Introduction à Deno 2.0",  views: 3_450 },
  { title: "Inertia.js + Deno",        views: 2_890 },
  { title: "Oak vs Hono — benchmark",  views: 1_230 },
]
const dashChart    = () => ({
  labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"],
  data:   [45, 72, 58, 93, 81, 110],
})
const dashActivity = () => [
  { id: Date.now(),     text: "Alice a créé un compte",      time: "à l'instant" },
  { id: Date.now() + 1, text: "Bob a soumis le formulaire", time: "il y a 1 min" },
]

// ---- Routes ----
app.get("/",          (c) => inertia.render(toWebRequest(c), "Home",      { message: `Hello depuis Hono + ${FRONTEND} 🔥`, router: "Hono" }))
app.get("/about",     (c) => inertia.render(toWebRequest(c), "About",     { title: "À propos", router: "Hono" }))
app.get("/counter",   (c) => inertia.render(toWebRequest(c), "Counter",   { router: "Hono", counter: 42 }))
app.get("/form",      (c) => inertia.render(toWebRequest(c), "Form",      { router: "Hono" }))
app.get("/dashboard", (c) => inertia.render(toWebRequest(c), "Dashboard", {
  router:   "Hono",
  stats:    defer(dashStats),
  topPosts: defer(dashPosts, "sidebar"),
  chart:    lazy(dashChart),
  activity: merge(dashActivity),
}))

app.post("/form", async (c) => {
  const req    = toWebRequest(c)
  const body   = await parseFormBody(req)
  const errors = validateForm(body)
  if (errors) return inertia.renderWithErrors(req, "Form", { router: "Hono" }, errors)
  return successResponse()
})

// ---- 404 Inertia ----
app.notFound((c) => inertia.render(toWebRequest(c), "NotFound", { router: "Hono" }, { status: 404 }))

console.log(`🔥 Hono  → http://localhost:${PORT}  (${FRONTEND} · ${IS_PROD ? "prod" : "dev"})`)
Deno.serve({ port: PORT }, app.fetch)
