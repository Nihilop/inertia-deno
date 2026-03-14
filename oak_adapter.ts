/**
 * Bridge Oak v17 ↔ Web API standard (Request / Response).
 * deno-inertia ne dépend que du Web API — Oak a son propre wrapper.
 *
 * Import séparé pour ne pas forcer Oak comme dépendance pour tous :
 *   import { toWebRequest, applyResponse } from "jsr:@streemkit/inertia-deno/oak"
 */
import type { Context } from "@oak/oak"

/** Reconstruit un Web API Request depuis le contexte Oak. */
export function toWebRequest(ctx: Context): Request {
  return new Request(ctx.request.url.toString(), {
    method:  ctx.request.method,
    headers: new Headers([...ctx.request.headers.entries()]),
  })
}

/** Applique une Web API Response sur le contexte Oak. */
export async function applyResponse(ctx: Context, res: Response): Promise<void> {
  ctx.response.status = res.status

  // Copie tous les headers (Set-Cookie, X-Inertia, Vary, etc.)
  res.headers.forEach((value, key) => {
    ctx.response.headers.append(key, value)
  })

  // 303 → redirection SPA (POST → GET)
  if (res.status === 303) {
    const loc = res.headers.get("Location")
    if (loc) ctx.response.redirect(loc)
    return
  }

  // 409 → version mismatch : seul le header X-Inertia-Location compte
  if (res.status === 409) return

  // Corps de la réponse (HTML ou JSON)
  const ct = res.headers.get("Content-Type") ?? ""
  ctx.response.body = ct.includes("application/json")
    ? await res.json()
    : await res.text()
}
