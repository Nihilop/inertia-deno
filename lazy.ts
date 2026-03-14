/**
 * Lazy props — exclues du render initial et des navigations SPA normales.
 * Calculées uniquement si la clé est explicitement demandée dans un partial
 * reload via l'header X-Inertia-Partial-Data.
 *
 * @example
 *   inertia.render(request, "Dashboard", {
 *     summary: await getSummary(),           // calculée à chaque render
 *     heavyChart: lazy(() => getChart()),    // calculée seulement en partial reload
 *   })
 */
export class LazyProp<T = unknown> {
  constructor(readonly resolve: () => T | Promise<T>) {}
}

/**
 * Marque une prop comme lazy.
 * Elle sera absente du premier rendu et des navigations SPA normales.
 * Elle ne sera résolue que si son nom figure dans X-Inertia-Partial-Data.
 */
export function lazy<T>(fn: () => T | Promise<T>): LazyProp<T> {
  return new LazyProp(fn)
}

export function isLazy(value: unknown): value is LazyProp {
  return value instanceof LazyProp
}
