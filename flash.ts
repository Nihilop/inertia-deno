/**
 * Flash messages — stockage cookie HTTP-only.
 *
 * Principe :
 *   1. Après un POST réussi, on set un cookie "flash" avec le message JSON.
 *   2. Au prochain GET, on lit le cookie, on l'injecte dans les shared props,
 *      et on demande au navigateur de le supprimer (Max-Age=0).
 *
 * Usage dans un serveur :
 *
 *   // Dans shared props :
 *   shared: (req) => ({ flash: readFlash(req) })
 *
 *   // Dans un handler POST :
 *   return redirect("/form", { "Set-Cookie": flashCookie({ success: "Envoyé !" }) })
 */

export interface FlashMessage {
  success?: string
  error?: string
  info?: string
  [key: string]: string | undefined
}

const COOKIE_NAME = "__flash"

/**
 * Lit et décode le cookie flash depuis un Request.
 * Retourne null s'il n'y a rien.
 */
export function readFlash(request: Request): FlashMessage | null {
  const cookieHeader = request.headers.get("Cookie") ?? ""
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))

  if (!match) return null

  try {
    const raw = decodeURIComponent(match.slice(COOKIE_NAME.length + 1))
    return JSON.parse(raw) as FlashMessage
  } catch {
    return null
  }
}

/**
 * Génère la valeur du header Set-Cookie pour poser un flash.
 * Le cookie est HTTP-only, SameSite=Lax, Path=/.
 * Max-Age=10 : suffisant pour survivre à une redirection.
 */
export function flashCookie(message: FlashMessage): string {
  const value = encodeURIComponent(JSON.stringify(message))
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=10`
}

/**
 * Génère le header Set-Cookie qui supprime le cookie flash.
 * À appeler après avoir consommé le flash dans les shared props.
 */
export function clearFlashCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
