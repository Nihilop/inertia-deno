/**
 * Deferred props (Inertia v2) — absentes du render initial, chargées
 * automatiquement par le client via un partial reload après le premier rendu.
 *
 * Différence avec lazy() :
 *   - lazy()  → silencieux : le client doit demander explicitement la prop
 *   - defer() → déclaratif : le serveur annonce les clés via `deferredProps`
 *               dans le PageData, le client les fetch automatiquement
 *
 * Les props d'un même groupe sont chargées en une seule requête.
 *
 * @example
 *   inertia.render(request, "Dashboard", {
 *     title:       "Dashboard",            // prop normale, toujours présente
 *     heavyStats:  defer(() => getStats()), // chargée après le rendu initial
 *     topUsers:    defer(() => getTopUsers()),          // même groupe "default"
 *     permissions: defer(() => getPerms(), "sidebar"),  // groupe séparé
 *   })
 *
 * Côté client (Inertia v2 requis) :
 *   <Deferred data="heavyStats">
 *     <template #fallback><Spinner /></template>
 *     <template #default="{ heavyStats }">{{ heavyStats }}</template>
 *   </Deferred>
 */
export class DeferredProp<T = unknown> {
  constructor(
    readonly resolve: () => T | Promise<T>,
    /** Groupe de chargement — les props du même groupe sont fetchées ensemble */
    readonly group: string,
  ) {}
}

/**
 * Marque une prop comme deferred.
 * Elle sera absente du render initial et annoncée dans `deferredProps`.
 * Le client Inertia v2 la chargera automatiquement après le premier rendu.
 *
 * @param fn    - Fonction de résolution (appelée uniquement au moment du fetch)
 * @param group - Groupe de chargement (défaut: "default")
 */
export function defer<T>(fn: () => T | Promise<T>, group = "default"): DeferredProp<T> {
  if (!group.trim()) throw new Error('[deno-inertia] defer() group cannot be an empty string. Use the default ("default") or a non-empty name.')
  return new DeferredProp(fn, group)
}

export function isDeferred(value: unknown): value is DeferredProp {
  return value instanceof DeferredProp
}
