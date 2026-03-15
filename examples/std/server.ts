import { createInertia, serveStaticAsset, createRouter, defer, lazy, merge } from "deno-inertia"
import { parseFormBody, validateForm, successResponse } from "../shared/form_handler.ts"
import { buildInertiaConfig, IS_PROD, FRONTEND, PORT, distDir } from "../shared/inertia_config.ts"

const inertia = createInertia(buildInertiaConfig("std/http"))
const router   = createRouter()

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

// ---- Middleware (logging) ----
router.use(async (req, next) => {
  const start = Date.now()
  const res   = await next()
  const { pathname } = new URL(req.url)
  console.log(`[std] ${req.method} ${pathname} → ${res.status} (${Date.now() - start}ms)`)
  return res
})

// ---- Route groups (API JSON non-Inertia) ----
router.group("/api", (r) => {
  r.get("/status", (_req) => Response.json({ status: "ok", version: "1.0.0" }))
  r.get("/dashboard/data", (_req) => Response.json(dashStats()))
})

// ---- Routes GET ----
router.get("/",          (req) => inertia.render(req, "Home",      { message: `Hello depuis std/http + ${FRONTEND} 🦕`, router: "std/http" }))
router.get("/about",     (req) => inertia.render(req, "About",     { title: "À propos", router: "std/http" }))
router.get("/counter",   (req) => inertia.render(req, "Counter",   { router: "std/http" }))
router.get("/form",      (req) => inertia.render(req, "Form",      { router: "std/http" }))
router.get("/dashboard", (req) => inertia.render(req, "Dashboard", {
  router:   "std/http",
  stats:    defer(dashStats),
  topPosts: defer(dashPosts, "sidebar"),
  chart:    lazy(dashChart),
  activity: merge(dashActivity),
}))

// ---- Route POST /form ----
router.post("/form", async (req) => {
  const body   = await parseFormBody(req)
  const errors = validateForm(body)
  if (errors) return inertia.renderWithErrors(req, "Form", { router: "std/http" }, errors)
  return successResponse()
})

// ---- Handler principal ----
async function handler(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)

  if (IS_PROD && pathname.startsWith("/assets/")) {
    const res = await serveStaticAsset(request, distDir())
    return res ?? new Response("404 Not Found", { status: 404 })
  }

  const response = await router.handler(request)

  if (response.status === 404) {
    return inertia.render(request, "NotFound", { router: "std/http" }, { status: 404 })
  }

  return response
}

console.log(`🦕 std/http → http://localhost:${PORT}  (${FRONTEND} · ${IS_PROD ? "prod" : "dev"})`)
Deno.serve({ port: PORT }, handler)
