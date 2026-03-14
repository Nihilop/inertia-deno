# Props

deno-inertia supporte cinq types de props, chacun avec un comportement différent
selon le contexte de rendu (initial, SPA, partial reload).

---

## Ordre de fusion

```
shared  (InertiaConfig.shared)
  +
page props  (passées à render())
  +
always  (InertiaConfig.always)   ← écrase les deux précédents si conflit
```

En partial reload (`X-Inertia-Partial-Data`), `shared` est filtré mais `always` est toujours inclus.

---

## Props normales

Calculées et envoyées à chaque rendu.

```ts
inertia.render(req, "Home", {
  title:   "Accueil",
  user:    await getUser(req),
  posts:   await getPosts(),
})
```

---

## `shared` — props partagées

Définies dans `InertiaConfig.shared`. Fusionnées dans chaque page.

```ts
const inertia = createInertia({
  shared: async (req) => ({
    locale: "fr",
    appName: "Mon App",
  }),
  // ...
})
```

Côté client Vue, toutes les pages ont accès à `usePage().props.locale`.

**Attention** — En partial reload, `shared` est filtré si les clés ne sont pas dans
`X-Inertia-Partial-Data`. Pour des props garanties même en partial reload, utilisez `always`.

---

## `always` — props toujours incluses

Définies dans `InertiaConfig.always`. Incluses dans **tous** les rendus,
y compris les partial reloads.

```ts
const inertia = createInertia({
  always: async (req) => ({
    auth:  { user: await getUser(req) },
    flash: await readFlash(req),
  }),
})
```

---

## `lazy(fn)` — props lazy

Exclues de tout rendu sauf si **explicitement demandées** dans un partial reload
via `X-Inertia-Partial-Data`.

```ts
import { lazy } from "deno-inertia"

inertia.render(req, "Dashboard", {
  title: "Dashboard",                      // normale — toujours présente
  chart: lazy(() => getChartData()),        // absente jusqu'à demande explicite
})
```

**Cas d'usage** — données coûteuses chargées à la demande par l'utilisateur.

Côté client Vue :

```ts
// Charge la prop "chart" uniquement quand l'utilisateur clique
router.reload({ only: ["chart"] })
```

Côté client React :

```tsx
<button onClick={() => router.reload({ only: ["chart"] })}>
  Charger le graphique
</button>

{chart && <Chart data={chart} />}
```

> **Note React** — Contrairement à Vue (slots lazy), le JSX React est évalué
> eagerly. Utilisez `{chart && <Chart />}` plutôt que `chart!.data`.

---

## `defer(fn, group?)` — props différées (Inertia v2)

Exclues du **premier rendu**, annoncées dans `PageData.deferredProps`.
Le client Inertia v2 les charge automatiquement après le rendu initial.

```ts
import { defer } from "deno-inertia"

inertia.render(req, "Dashboard", {
  title:    "Dashboard",
  stats:    defer(() => getStats()),              // groupe "default"
  topPosts: defer(() => getTopPosts()),           // groupe "default"
  sidebar:  defer(() => getSidebar(), "sidebar"), // groupe séparé
})
```

Les props du même groupe sont chargées en **une seule requête**.

**PageData envoyé au client (premier rendu) :**
```json
{
  "component": "Dashboard",
  "props": { "title": "Dashboard" },
  "deferredProps": {
    "default":  ["stats", "topPosts"],
    "sidebar":  ["sidebar"]
  }
}
```

Côté client Vue (Inertia v2) :

```vue
<Deferred data="stats">
  <template #fallback><Spinner /></template>
  <div>{{ stats.totalUsers }}</div>
</Deferred>
```

Côté client React (Inertia v2) :

```tsx
<Deferred data="stats" fallback={<Spinner />}>
  {/* Guard nécessaire en React — JSX évalué eagerly */}
  {stats && <div>{stats.totalUsers}</div>}
</Deferred>
```

Nécessite `@inertiajs/vue3@^2` ou `@inertiajs/react@^2`.

---

## `merge(fn)` — props accumulées (Inertia v2)

Toujours calculées et envoyées, mais le client Inertia v2 **accumule** les valeurs
au lieu de remplacer. Idéal pour la pagination infinie.

```ts
import { merge } from "deno-inertia"

inertia.render(req, "Feed", {
  posts: merge(() => getLatestPosts()),
})
```

**PageData envoyé :**
```json
{
  "props": { "posts": [...] },
  "mergedProps": ["posts"]
}
```

Côté client Vue :

```ts
// Chaque reload() AJOUTE les nouveaux posts au tableau existant
router.reload({ only: ["posts"] })
```

---

## Résumé des comportements

| Type | Rendu initial | Nav SPA | Partial reload (demandé) | Partial reload (non demandé) |
|---|---|---|---|---|
| Normale | ✅ | ✅ | ✅ | ❌ filtré |
| `shared` | ✅ | ✅ | ✅ si dans la liste | ❌ filtré |
| `always` | ✅ | ✅ | ✅ toujours | ✅ toujours |
| `lazy(fn)` | ❌ absent | ❌ absent | ✅ calculée | ❌ absent |
| `defer(fn)` | ❌ → annoncée | ❌ → annoncée | ✅ calculée | ❌ ignorée |
| `merge(fn)` | ✅ | ✅ | ✅ + signal `mergedProps` | ✅ |

---

## Typage strict avec `PageProps<T>`

```ts
import type { PageProps } from "deno-inertia"

interface DashboardProps {
  router:   string
  stats?:   Stats       // optional → sera passé via defer()
  chart?:   ChartData   // optional → sera passé via lazy()
  posts:    Post[]      // required → valeur directe ou merge()
}

// TypeScript valide chaque marqueur
inertia.render<DashboardProps>(req, "Dashboard", {
  router: "Hono",
  stats:  defer(getStats),    // ✅ DeferredProp<Stats>
  chart:  lazy(getChart),     // ✅ LazyProp<ChartData>
  posts:  merge(getPosts),    // ✅ MergedProp<Post[]>
})
```

→ Voir [TypeScript](./typescript.md) pour les détails des types.
