/**
 * Shared props + always props communs aux 3 serveurs.
 *
 * shared → mergées dans chaque page, filtrables en partial reload
 * always → toujours incluses même en partial reload (auth, flash)
 */
import { readFlash, clearFlashCookie } from "deno-inertia"
import type { PropsResolver } from "deno-inertia"

/** Utilisateurs simulés — en prod : session DB/Redis */
const FAKE_USERS: Record<string, { name: string; email: string }> = {
  "user_abc": { name: "Nihilo", email: "nihilo@example.com" },
}

function readSessionUser(request: Request) {
  const cookieHeader = request.headers.get("Cookie") ?? ""
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("session_user="))
  if (!match) return null
  const id = match.slice("session_user=".length)
  return FAKE_USERS[id] ?? null
}

/**
 * Props partagées — filtrables en partial reload.
 * Ici : vides (tout est dans `always` pour cet exemple).
 */
export const sharedProps: PropsResolver = (_request: Request) => ({
  // Exemple : données non-critiques, filtrables
  // meta: { version: "1.0.0" },
})

/**
 * Props always — toujours incluses, même en partial reload.
 * Idéal pour auth.user et flash qui doivent être présents sur chaque page.
 */
export const alwaysProps: PropsResolver = (request: Request) => {
  const user  = readSessionUser(request)
  const flash = readFlash(request)
  return {
    auth:  { user },
    flash: flash ?? null,
  }
}

/** True si la requête porte un cookie flash à effacer */
export function hasFlash(request: Request): boolean {
  return (request.headers.get("Cookie") ?? "").includes("__flash=")
}

export { clearFlashCookie }
