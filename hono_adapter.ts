/**
 * Adapter Hono → deno-inertia.
 *
 * Hono utilise nativement le Web API (Request / Response), donc l'intégration
 * est plus légère que pour Oak. L'adapter fournit :
 *   - toWebRequest(c)  → extrait le Request standard depuis le contexte Hono
 *
 * Contrairement à l'adapter Oak, pas besoin d'applyResponse() : les handlers
 * Hono retournent directement une Response, que deno-inertia produit nativement.
 *
 * @example
 *   import { createInertia } from "deno-inertia"
 *   import { toWebRequest } from "deno-inertia/hono"
 *   import { Hono } from "hono"
 *
 *   const inertia = createInertia(config)
 *   const app = new Hono()
 *
 *   app.get("/", (c) => inertia.render(toWebRequest(c), "Home", { ... }))
 *
 * Import séparé pour ne pas forcer Hono comme dépendance :
 *   import { toWebRequest } from "jsr:@streemkit/inertia-deno/hono"
 */
import type { Context } from "hono"

/**
 * Extrait le Web API Request depuis un contexte Hono.
 * Équivalent de `c.req.raw`, fourni pour symétrie avec l'adapter Oak.
 */
export function toWebRequest(c: Context): Request {
  return c.req.raw
}
