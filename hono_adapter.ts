/**
 * Adapter Hono → deno-inertia.
 *
 * Hono utilise nativement le Web API (Request / Response), donc l'intégration
 * est plus légère que pour Oak. L'adapter fournit :
 *   - toWebRequest(c)        → extrait le Request standard depuis le contexte Hono
 *   - serveAssets(distDir)   → middleware Hono pour servir les assets Vite en prod
 *
 * Contrairement à l'adapter Oak, pas besoin d'applyResponse() : les handlers
 * Hono retournent directement une Response, que deno-inertia produit nativement.
 *
 * @example
 *   import { createInertia } from "deno-inertia"
 *   import { toWebRequest, serveAssets } from "deno-inertia/hono"
 *   import { Hono } from "hono"
 *
 *   const inertia = createInertia(config)
 *   const app = new Hono()
 *
 *   if (IS_PROD) app.use("/assets/*", serveAssets("dist"))
 *   app.get("/", (c) => inertia.render(toWebRequest(c), "Home", { ... }))
 *
 * Import séparé pour ne pas forcer Hono comme dépendance :
 *   import { toWebRequest, serveAssets } from "jsr:@streemkit/inertia-deno/hono"
 */
import type { Context, Next } from "hono"
import { serveStaticAsset } from "./vite.ts"

/**
 * Extrait le Web API Request depuis un contexte Hono.
 * Équivalent de `c.req.raw`, fourni pour symétrie avec l'adapter Oak.
 */
export function toWebRequest(c: Context): Request {
  return c.req.raw
}

/**
 * Middleware Hono pour servir les assets statiques compilés par Vite.
 *
 * Gère les MIME types, le Cache-Control immutable et rejette les path traversal.
 * Passe au middleware suivant si l'URL ne commence pas par `base`.
 *
 * @param distDir - Répertoire de build Vite, ex: "dist"
 * @param base    - Préfixe URL des assets, défaut: "/assets/"
 *
 * @example
 *   import { serveAssets } from "deno-inertia/hono"
 *
 *   if (IS_PROD) app.use("/assets/*", serveAssets("dist"))
 */
export function serveAssets(
  distDir: string,
  base = "/assets/",
): (c: Context, next: Next) => Promise<Response | void> {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const res = await serveStaticAsset(c.req.raw, distDir, base)
    if (res) return res
    await next()
  }
}
