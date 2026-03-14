/**
 * Merge props (Inertia v2) — toujours calculées et incluses dans la réponse,
 * mais le client Inertia v2 ACCUMULE les nouvelles valeurs au lieu de remplacer.
 *
 * Cas d'usage typique : pagination infinie / "load more".
 * La réponse inclut la clé dans `mergedProps: string[]` pour signaler au client.
 *
 * Différence avec les autres marqueurs :
 *   - normal   → calculé, envoyé, client remplace
 *   - lazy()   → NON envoyé sauf si explicitement demandé en partial reload
 *   - defer()  → NON envoyé au 1er rendu, auto-fetché par le client (v2)
 *   - merge()  → calculé et envoyé, mais le client ACCUMULE (append pour les tableaux)
 *
 * @example
 *   inertia.render(request, "Feed", {
 *     posts: merge(() => getLatestPosts()),   // le client accumule les nouvelles pages
 *   })
 *
 * Côté client (Inertia v2) :
 *   // Chaque reload({ only: ['posts'] }) AJOUTE au tableau existant.
 *   router.reload({ only: ['posts'] })
 */
export class MergedProp<T = unknown> {
  constructor(readonly resolve: () => T | Promise<T>) {}
}

/**
 * Marque une prop comme mergeable.
 * Elle est toujours calculée et envoyée, mais le client accumule les valeurs.
 *
 * @param fn - Fonction de résolution (appelée à chaque render)
 */
export function merge<T>(fn: () => T | Promise<T>): MergedProp<T> {
  return new MergedProp(fn)
}

export function isMerged(value: unknown): value is MergedProp {
  return value instanceof MergedProp
}
