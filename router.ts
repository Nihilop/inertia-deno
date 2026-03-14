/**
 * Micro-router Web API standard — sans dépendance.
 *
 * Conçu pour Deno.serve() mais compatible avec tout handler (Request) => Response.
 * Supporte les paramètres de route (:id), les wildcards (*), GET/POST/PUT/PATCH/DELETE.
 * Supporte le middleware (router.use) et les groupes de routes (router.group).
 *
 * @example
 *   const router = createRouter()
 *
 *   // Middleware global (logging, auth…)
 *   router.use(async (req, next) => {
 *     console.log(req.method, req.url)
 *     return await next()
 *   })
 *
 *   // Groupe de routes préfixées
 *   router.group("/api", (r) => {
 *     r.get("/users", (req) => Response.json({ users: [] }))
 *   })
 *
 *   // Route simple
 *   router.get("/users/:id", (req, params) => Response.json({ id: params.id }))
 *   router.post("/form", async (req) => { ... })
 *
 *   Deno.serve(router.handler)
 */

/** Paramètres extraits de l'URL — ex: `/users/:id` → `{ id: "42" }` */
export type RouteParams = Record<string, string>

/**
 * Gestionnaire de route.
 * Reçoit la requête et les paramètres extraits du pattern, retourne une Response.
 *
 * @example
 *   router.get("/users/:id", (req, params) => Response.json({ id: params.id }))
 */
export type RouteHandler = (
  request: Request,
  params: RouteParams,
) => Response | Promise<Response>

/**
 * Fonction middleware.
 * Reçoit la requête et un `next()` vers la suite de la chaîne.
 * Doit retourner une Response (soit la sienne, soit celle de next()).
 *
 * @example
 *   router.use(async (req, next) => {
 *     const start = Date.now()
 *     const res = await next()
 *     console.log(`${req.method} ${new URL(req.url).pathname} ${Date.now() - start}ms`)
 *     return res
 *   })
 */
export type MiddlewareFn = (
  request: Request,
  next: () => Promise<Response>,
) => Response | Promise<Response>

/**
 * Instance retournée par `createRouter()`.
 * Type de retour explicite requis par JSR (no slow types).
 */
export interface InertiaRouter {
  get(path: string, handler: RouteHandler): void
  post(path: string, handler: RouteHandler): void
  put(path: string, handler: RouteHandler): void
  patch(path: string, handler: RouteHandler): void
  delete(path: string, handler: RouteHandler): void
  use(fn: MiddlewareFn): void
  group(prefix: string, fn: (r: RouterGroup) => void): void
  handler(request: Request): Promise<Response>
}

/**
 * Interface d'un groupe de routes (sous-routeur préfixé).
 * Passé au callback de router.group().
 */
export interface RouterGroup {
  get:    (path: string, handler: RouteHandler) => void
  post:   (path: string, handler: RouteHandler) => void
  put:    (path: string, handler: RouteHandler) => void
  patch:  (path: string, handler: RouteHandler) => void
  delete: (path: string, handler: RouteHandler) => void
  /** Groupes imbriqués — le prefix s'accumule */
  group:  (prefix: string, fn: (r: RouterGroup) => void) => void
}

interface Route {
  method: string
  pattern: URLPattern
  handler: RouteHandler
  /** Paramètres nommés dans l'ordre d'apparition — ex: ["id", "slug"] */
  paramNames: string[]
}

// ---------------------------------------------------------------------------
// Pattern compiler
// ---------------------------------------------------------------------------

/**
 * Convertit un chemin de route en URLPattern (Web API).
 *
 * "/users/:id/posts/:slug" → pattern + paramNames ["id", "slug"]
 */
function compilePattern(path: string): { pattern: URLPattern; paramNames: string[] } {
  const paramNames: string[] = []
  const patternStr = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name)
    return `:${name}`
  })
  return {
    pattern: new URLPattern({ pathname: patternStr }),
    paramNames,
  }
}

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export function createRouter(): InertiaRouter {
  const routes: Route[] = []
  const middlewares: MiddlewareFn[] = []

  function add(method: string, path: string, handler: RouteHandler) {
    const { pattern, paramNames } = compilePattern(path)
    routes.push({ method: method.toUpperCase(), pattern, handler, paramNames })
  }

  /** Crée un sous-routeur dont toutes les routes sont préfixées. */
  function makeGroup(prefix: string): RouterGroup {
    return {
      get:    (path, h) => add("GET",    prefix + path, h),
      post:   (path, h) => add("POST",   prefix + path, h),
      put:    (path, h) => add("PUT",    prefix + path, h),
      patch:  (path, h) => add("PATCH",  prefix + path, h),
      delete: (path, h) => add("DELETE", prefix + path, h),
      group:  (p, fn)   => fn(makeGroup(prefix + p)),
    }
  }

  const router = {
    get:    (path: string, h: RouteHandler) => add("GET",    path, h),
    post:   (path: string, h: RouteHandler) => add("POST",   path, h),
    put:    (path: string, h: RouteHandler) => add("PUT",    path, h),
    patch:  (path: string, h: RouteHandler) => add("PATCH",  path, h),
    delete: (path: string, h: RouteHandler) => add("DELETE", path, h),

    /**
     * Enregistre un middleware global exécuté avant chaque requête.
     * Les middlewares sont appliqués dans l'ordre d'enregistrement.
     */
    use: (fn: MiddlewareFn) => { middlewares.push(fn) },

    /**
     * Crée un groupe de routes partageant un préfixe d'URL.
     * Les groupes peuvent être imbriqués.
     *
     * @example
     *   router.group("/api", (r) => {
     *     r.get("/users", handler)    // → GET /api/users
     *     r.group("/admin", (r2) => {
     *       r2.get("/stats", handler) // → GET /api/admin/stats
     *     })
     *   })
     */
    group: (prefix: string, fn: (r: RouterGroup) => void) => fn(makeGroup(prefix)),

    /**
     * Handler principal — à passer directement à Deno.serve().
     *
     * Exécute la chaîne de middlewares puis dispatche vers la route correspondante.
     * Retourne 405 si la route existe mais la méthode ne correspond pas.
     * Retourne 404 si aucune route ne correspond.
     */
    handler: async (request: Request): Promise<Response> => {
      /** Logique de dispatch vers la route */
      const dispatch = async (): Promise<Response> => {
        const method = request.method.toUpperCase()
        let routeFound = false

        for (const route of routes) {
          const match = route.pattern.exec(request.url)
          if (!match) continue

          routeFound = true

          if (route.method !== method) continue

          // Extrait les paramètres nommés
          const groups = match.pathname.groups ?? {}
          const params: RouteParams = {}
          for (const name of route.paramNames) {
            const raw = groups[name] ?? ""
            try {
              params[name] = decodeURIComponent(raw)
            } catch {
              // Invalid percent-encoding → retourne le segment brut plutôt que de crasher
              params[name] = raw
            }
          }

          return await route.handler(request, params)
        }

        if (routeFound) {
          return new Response("405 Method Not Allowed", { status: 405 })
        }

        return new Response("404 Not Found", { status: 404 })
      }

      // Chaîne de middleware — chaque fn reçoit `next` vers la suivante
      const chain = middlewares.reduceRight<() => Promise<Response>>(
        (next, mw) => () => Promise.resolve(mw(request, next)),
        dispatch,
      )

      return chain()
    },
  }

  return router
}
