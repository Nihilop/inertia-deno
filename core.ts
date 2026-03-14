import type { InertiaConfig, PageData, PageProps, ValidationErrors } from "./types.ts"
import { viteDevScripts, viteProdAssets } from "./vite.ts"
import { isLazy } from "./lazy.ts"
import { isDeferred } from "./defer.ts"
import { isMerged } from "./merge.ts"
import { clearFlashCookie } from "./flash.ts"

// ---------------------------------------------------------------------------
// Helpers publics
// ---------------------------------------------------------------------------

/**
 * Sérialise les données de page dans le div racine Inertia.
 * Échappe les entités HTML pour une insertion sûre dans un attribut.
 */
export function pageToDiv(page: PageData): string {
  const json = JSON.stringify(page)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
  return `<div id="app" data-page="${json}"></div>`
}

/**
 * Crée une réponse de redirection Inertia (303 See Other).
 * À utiliser après un POST réussi — Inertia suit automatiquement en SPA.
 */
export function redirect(url: string, headers?: Record<string, string>): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: url, ...headers },
  })
}

// ---------------------------------------------------------------------------
// Partial reloads — helpers internes
// ---------------------------------------------------------------------------

function parsePartialKeys(header: string | null): Set<string> | null {
  if (!header) return null
  const keys = header.split(",").map((k) => k.trim()).filter(Boolean)
  return keys.length > 0 ? new Set(keys) : null
}

function applyPartialFilter(
  props: Record<string, unknown>,
  keys: Set<string>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).filter(([k]) => keys.has(k))
  )
}

// ---------------------------------------------------------------------------
// Résolution des props de page
// ---------------------------------------------------------------------------

interface ResolvedPageProps {
  /** Props résolues à inclure dans la réponse */
  resolved: Record<string, unknown>
  /**
   * Groupes de deferred props à annoncer dans PageData.
   * Vide lors des partial reloads (le client connaît déjà les groupes).
   * Ex: { default: ["stats", "topUsers"], sidebar: ["permissions"] }
   */
  deferredGroups: Record<string, string[]>
  /**
   * Clés des merge props résolues dans cette passe.
   * Filtrées ensuite pour ne garder que celles présentes dans finalProps.
   */
  mergedKeys: string[]
}

/**
 * Résout les props de page en tenant compte des trois types :
 *
 * - Props normales  → toujours incluses (sauf filtre partial reload)
 * - LazyProp        → absentes sauf si explicitement demandées en partial reload
 * - DeferredProp    → absentes ; leurs clés sont collectées dans `deferredGroups`
 *                     (annoncées au client) sauf si demandées en partial reload
 *
 * @param requestedKeys - null = render initial/SPA normal, Set = partial reload
 * @param isPartial     - true = ne pas remonter deferredGroups (client déjà informé)
 */
async function resolvePageProps(
  props: Record<string, unknown>,
  requestedKeys: Set<string> | null,
  isPartial: boolean,
): Promise<ResolvedPageProps> {
  const resolved: Record<string, unknown> = {}
  const deferredGroups: Record<string, string[]> = {}
  const mergedKeys: string[] = []

  for (const [key, value] of Object.entries(props)) {
    if (isDeferred(value)) {
      if (requestedKeys?.has(key)) {
        // Partial reload demandant cette prop → on la calcule
        resolved[key] = await value.resolve()
      } else if (!isPartial) {
        // Render initial / SPA normal → on annonce le groupe au client
        ;(deferredGroups[value.group] ??= []).push(key)
      }
      // En partial reload non-demandé : on ignore (client déjà informé)
    } else if (isLazy(value)) {
      if (requestedKeys?.has(key)) {
        // Lazy explicitement demandée → on la calcule
        resolved[key] = await value.resolve()
      }
      // Sinon : absente (pas d'annonce au client)
    } else if (isMerged(value)) {
      // Merge props : toujours calculées (comme une prop normale),
      // mais le client accumule au lieu de remplacer.
      resolved[key] = await value.resolve()
      mergedKeys.push(key)
    } else {
      resolved[key] = value
    }
  }

  return { resolved, deferredGroups, mergedKeys }
}

// ---------------------------------------------------------------------------
// Flash auto-clear
// ---------------------------------------------------------------------------

function appendFlashClear(headers: Headers, request: Request, config: InertiaConfig): void {
  if (!config.clearFlash) return
  const hasCookie = request.headers.get("Cookie")
    ?.split(";")
    .some((c) => c.trim().startsWith("__flash="))
  if (hasCookie) headers.append("Set-Cookie", clearFlashCookie())
}

// ---------------------------------------------------------------------------
// Factory principale
// ---------------------------------------------------------------------------

export function createInertia(config: InertiaConfig) {

  function resolveVersion(): string | null {
    if (!config.version) return null
    return typeof config.version === "function" ? config.version() : config.version
  }

  async function resolveShared(request: Request): Promise<Record<string, unknown>> {
    if (!config.shared) return {}
    if (typeof config.shared === "function") return await config.shared(request)
    return config.shared
  }

  async function resolveAlways(request: Request): Promise<Record<string, unknown>> {
    if (!config.always) return {}
    if (typeof config.always === "function") return await config.always(request)
    return config.always
  }

  function buildAssets(): string {
    if (config.vite) return viteDevScripts(config.vite)
    if (config.prod) return viteProdAssets(config.prod.entry, config.prod.manifest, config.prod.base)
    return ""
  }

  // ---- render principal ----
  async function render<T extends Record<string, unknown> = Record<string, unknown>>(
    request: Request,
    component: string,
    props: PageProps<T> = {} as PageProps<T>,
    responseInit?: ResponseInit,
  ): Promise<Response> {
    // Cast interne : PageProps<T> est compatible avec Record<string, unknown>
    const rawProps = props as Record<string, unknown>
    const url       = new URL(request.url)
    const isInertia = request.headers.get("X-Inertia") === "true"

    const shared = await resolveShared(request)
    const always = await resolveAlways(request)

    // ---- Navigation SPA (X-Inertia: true) ----
    if (isInertia) {
      // Version mismatch → force hard reload (le flash survit, pas de clear)
      const clientVersion = request.headers.get("X-Inertia-Version")
      const serverVersion = resolveVersion()
      if (serverVersion && clientVersion && clientVersion !== serverVersion) {
        return new Response(null, {
          status: 409,
          headers: { "X-Inertia-Location": url.pathname },
        })
      }

      const partialComponent = request.headers.get("X-Inertia-Partial-Component")
      const partialKeys      = parsePartialKeys(request.headers.get("X-Inertia-Partial-Data"))
      const isPartial        = !!(partialKeys && partialComponent === component)

      let finalProps: Record<string, unknown>
      let deferredGroups: Record<string, string[]> = {}
      let mergedKeys: string[] = []

      if (isPartial) {
        // Partial reload : résoudre lazy/deferred/merge demandées, filtrer le reste
        const result = await resolvePageProps(rawProps, partialKeys, true)
        const merged = { ...shared, ...result.resolved }
        finalProps   = { ...applyPartialFilter(merged, partialKeys), ...always }
        mergedKeys   = result.mergedKeys
        // deferredGroups reste vide : pas annoncé dans les partial reloads
      } else {
        // Navigation SPA normale : lazy/deferred absentes, deferred annoncées
        const result   = await resolvePageProps(rawProps, null, false)
        const merged   = { ...shared, ...result.resolved }
        finalProps     = { ...merged, ...always }
        deferredGroups = result.deferredGroups
        mergedKeys     = result.mergedKeys
      }

      // Clés merge effectivement présentes dans la réponse
      const mergedPropsKeys = mergedKeys.filter(k => k in finalProps)

      const page: PageData = {
        component,
        props:   finalProps,
        url:     url.pathname + url.search,
        version: resolveVersion(),
        ...(Object.keys(deferredGroups).length > 0 ? { deferredProps: deferredGroups } : {}),
        ...(mergedPropsKeys.length > 0               ? { mergedProps: mergedPropsKeys } : {}),
        ...(config.encryptHistory                    ? { encryptHistory: true }         : {}),
      }

      const headers = new Headers(responseInit?.headers)
      headers.set("X-Inertia", "true")
      headers.set("Vary", "X-Inertia")
      headers.set("Content-Type", "application/json")
      appendFlashClear(headers, request, config)

      return new Response(JSON.stringify(page), {
        status:  responseInit?.status ?? 200,
        headers,
      })
    }

    // ---- Première visite → HTML complet ----
    const { resolved, deferredGroups, mergedKeys } = await resolvePageProps(rawProps, null, false)
    const merged     = { ...shared, ...resolved }
    const finalProps = { ...merged, ...always }

    const mergedPropsKeys = mergedKeys.filter(k => k in finalProps)

    const page: PageData = {
      component,
      props:   finalProps,
      url:     url.pathname + url.search,
      version: resolveVersion(),
      ...(Object.keys(deferredGroups).length > 0 ? { deferredProps: deferredGroups } : {}),
      ...(mergedPropsKeys.length > 0               ? { mergedProps: mergedPropsKeys } : {}),
      ...(config.encryptHistory                    ? { encryptHistory: true }         : {}),
    }

    const assets = buildAssets()
    const html   = config.template(page, assets)

    const headers = new Headers(responseInit?.headers)
    headers.set("Content-Type", "text/html; charset=utf-8")
    appendFlashClear(headers, request, config)

    return new Response(html, {
      status:  responseInit?.status ?? 200,
      headers,
    })
  }

  /**
   * Render avec erreurs de validation (422).
   *
   * Si le header `X-Inertia-Error-Bag` est présent (ou si `errorBag` est fourni),
   * les erreurs sont namespaced : `{ errors: { [bag]: { champ: "message" } } }`.
   */
  async function renderWithErrors<T extends Record<string, unknown> = Record<string, unknown>>(
    request: Request,
    component: string,
    props: PageProps<T>,
    errors: ValidationErrors,
    errorBag?: string,
  ): Promise<Response> {
    const bag = errorBag ?? request.headers.get("X-Inertia-Error-Bag") ?? null
    const wrappedErrors = bag ? { [bag]: errors } : errors
    const merged = { ...(props as Record<string, unknown>), errors: wrappedErrors }
    return render(request, component, merged, { status: 422 })
  }

  return { render, renderWithErrors, redirect, pageToDiv }
}
