# Inertia v2 — Fonctionnalités avancées

deno-inertia implémente les trois nouvelles fonctionnalités du protocole Inertia v2.
Elles nécessitent `@inertiajs/vue3@^2` ou `@inertiajs/react@^2` côté client.

```ts
import { defer, lazy, merge } from "deno-inertia"
```

---

## `defer(fn, group?)` — Props différées

Les props différées sont **exclues du premier rendu**.
Leurs clés sont annoncées dans `PageData.deferredProps` pour que le client
Inertia v2 les charge automatiquement après le rendu initial.

### Serveur

```ts
import { defer } from "deno-inertia"

router.get("/dashboard", async (req) =>
  inertia.render(req, "Dashboard", {
    title:    "Dashboard",                            // normale — rendu immédiat
    stats:    defer(() => getStats()),                // groupe "default"
    topPosts: defer(() => getTopPosts()),             // groupe "default" (même requête)
    sidebar:  defer(() => getSidebar(), "sidebar"),   // groupe séparé
  })
)
```

### PageData envoyé (premier rendu)

```json
{
  "component": "Dashboard",
  "props": { "title": "Dashboard" },
  "deferredProps": {
    "default": ["stats", "topPosts"],
    "sidebar": ["sidebar"]
  }
}
```

Les props du même groupe sont chargées en **une seule requête** (partial reload groupé).
L'ordre de résolution est parallèle entre groupes, séquentiel si le client
attend chaque groupe avant le suivant.

### Client Vue (Inertia v2)

```vue
<script setup>
defineProps<{
  title: string
  stats?: { totalUsers: number; revenue: number }
  topPosts?: Array<{ id: number; title: string }>
}>()
</script>

<template>
  <h1>{{ title }}</h1>

  <Deferred data="stats">
    <template #fallback><Spinner /></template>
    <div>
      <p>Utilisateurs : {{ stats!.totalUsers }}</p>
      <p>Revenu : {{ stats!.revenue }}</p>
    </div>
  </Deferred>

  <Deferred data="topPosts">
    <template #fallback><Skeleton /></template>
    <ul>
      <li v-for="post in topPosts" :key="post.id">{{ post.title }}</li>
    </ul>
  </Deferred>
</template>
```

### Client React (Inertia v2)

```tsx
import { Deferred } from "@inertiajs/react"

interface DashboardProps {
  title: string
  stats?: { totalUsers: number; revenue: number }
  topPosts?: Array<{ id: number; title: string }>
}

export default function Dashboard({ title, stats, topPosts }: DashboardProps) {
  return (
    <>
      <h1>{title}</h1>

      <Deferred data="stats" fallback={<Spinner />}>
        {/* Guard nécessaire en React — JSX évalué eagerly */}
        {stats && (
          <div>
            <p>Utilisateurs : {stats.totalUsers}</p>
          </div>
        )}
      </Deferred>

      <Deferred data="topPosts" fallback={<Skeleton />}>
        {topPosts && (
          <ul>{topPosts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
        )}
      </Deferred>
    </>
  )
}
```

> **Guard React** — Contrairement à Vue où les slots sont évalués paresseusement,
> le JSX React est évalué eagerly même dans `<Deferred>`. Il faut toujours
> conditionner avec `{prop && ...}` pour éviter les erreurs avant le chargement.

---

## `merge(fn)` — Props accumulées (pagination infinie)

Les props merge sont **toujours calculées et incluses**, mais le client Inertia v2
**accumule** les nouvelles valeurs au lieu de remplacer les anciennes.
Idéal pour la pagination infinie ou les listes "load more".

### Serveur

```ts
import { merge } from "deno-inertia"

router.get("/feed", async (req) => {
  const url  = new URL(req.url)
  const page = Number(url.searchParams.get("page") ?? 1)

  return inertia.render(req, "Feed", {
    posts: merge(() => getPosts({ page })),
    page,
  })
})
```

### PageData envoyé

```json
{
  "props": {
    "posts": [{ "id": 11 }, { "id": 12 }],
    "page": 2
  },
  "mergedProps": ["posts"]
}
```

Le champ `mergedProps: ["posts"]` signale au client que cette prop
doit être accumulée (append) et non remplacée.

### Client Vue

```vue
<script setup>
const props = defineProps<{ posts: Post[]; page: number }>()

function loadMore() {
  router.reload({
    only: ["posts"],
    data: { page: props.page + 1 },
  })
}
</script>

<template>
  <PostList :posts="posts" />
  <button @click="loadMore">Charger plus</button>
</template>
```

### Client React

```tsx
function Feed({ posts, page }: { posts: Post[]; page: number }) {
  function loadMore() {
    router.reload({
      only: ["posts"],
      data: { page: page + 1 },
    })
  }

  return (
    <>
      <PostList posts={posts} />
      <button onClick={loadMore}>Charger plus</button>
    </>
  )
}
```

---

## `encryptHistory` — Chiffrement de l'historique

Chiffre l'état de l'historique côté navigateur. Utile pour les pages contenant
des données sensibles (formulaires médicaux, bancaires, etc.).

### Configuration globale

```ts
const inertia = createInertia({
  encryptHistory: true,
  // ...
})
```

Propagé dans `PageData.encryptHistory: true` — le client Inertia v2 chiffre
automatiquement l'état à chaque navigation.

### Configuration par page

Pour activer uniquement sur certaines pages, configurez `encryptHistory: false`
globalement et passez l'option via `responseInit` :

```ts
// Globalement désactivé
const inertia = createInertia({
  encryptHistory: false,
  // ...
})

// Activé page par page — via un PageData personnalisé
// (nécessite de construire manuellement la réponse ou une future API)
```

> Pour l'instant, `encryptHistory` est un flag global dans `InertiaConfig`.
> Une API page-par-page est prévue dans une version future.

---

## Résumé des comportements

| Marqueur | Premier rendu | Nav SPA | Partial reload (demandé) |
|---|---|---|---|
| `defer(fn)` | ❌ absent (annoncé dans `deferredProps`) | ❌ | ✅ calculé |
| `merge(fn)` | ✅ inclus + `mergedProps` | ✅ inclus | ✅ inclus + accumulation client |
| `lazy(fn)` | ❌ absent | ❌ absent | ✅ si dans `X-Inertia-Partial-Data` |

---

## Pré-requis npm

```jsonc
// Vue 3 — Inertia v2
{ "@inertiajs/vue3": "^2.0.0" }

// React — Inertia v2
{ "@inertiajs/react": "^2.0.0" }
```

Les features v2 (`<Deferred>`, accumulation merge, encryptHistory) ne fonctionnent
pas avec `@inertiajs/vue3@^1` ou `@inertiajs/react@^1`.
