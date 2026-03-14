# Inertia v2 — Advanced features

deno-inertia implements the three new features of the Inertia v2 protocol.
They require `@inertiajs/vue3@^2` or `@inertiajs/react@^2` on the client side.

```ts
import { defer, lazy, merge } from "deno-inertia"
```

---

## `defer(fn, group?)` — Deferred props

Deferred props are **excluded from the first render**.
Their keys are announced in `PageData.deferredProps` so the
Inertia v2 client loads them automatically after the initial render.

### Server

```ts
import { defer } from "deno-inertia"

router.get("/dashboard", async (req) =>
  inertia.render(req, "Dashboard", {
    title:    "Dashboard",                            // normal — rendered immediately
    stats:    defer(() => getStats()),                // "default" group
    topPosts: defer(() => getTopPosts()),             // "default" group (same request)
    sidebar:  defer(() => getSidebar(), "sidebar"),   // separate group
  })
)
```

### PageData sent (first render)

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

Props in the same group are loaded in **one request** (grouped partial reload).
Resolution order is parallel between groups.

### Vue client (Inertia v2)

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
      <p>Users: {{ stats!.totalUsers }}</p>
      <p>Revenue: {{ stats!.revenue }}</p>
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

### React client (Inertia v2)

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
        {/* Guard needed in React — JSX evaluated eagerly */}
        {stats && (
          <div>
            <p>Users: {stats.totalUsers}</p>
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

> **React guard** — Unlike Vue where slots are evaluated lazily,
> React JSX is evaluated eagerly even inside `<Deferred>`. Always
> guard with `{prop && ...}` to avoid errors before loading completes.

---

## `merge(fn)` — Accumulated props (infinite pagination)

Merge props are **always computed and included**, but the Inertia v2 client
**accumulates** new values instead of replacing old ones.
Ideal for infinite pagination or "load more" lists.

### Server

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

### PageData sent

```json
{
  "props": {
    "posts": [{ "id": 11 }, { "id": 12 }],
    "page": 2
  },
  "mergedProps": ["posts"]
}
```

The `mergedProps: ["posts"]` field signals the client that this prop
should be accumulated (appended) rather than replaced.

### Vue client

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
  <button @click="loadMore">Load more</button>
</template>
```

### React client

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
      <button onClick={loadMore}>Load more</button>
    </>
  )
}
```

---

## `encryptHistory` — History encryption

Encrypts browser history state. Useful for pages containing
sensitive data (medical forms, banking, etc.).

### Global configuration

```ts
const inertia = createInertia({
  encryptHistory: true,
  // ...
})
```

Propagated to `PageData.encryptHistory: true` — the Inertia v2 client
automatically encrypts state on each navigation.

---

## Behavior summary

| Marker | First render | SPA nav | Partial reload (requested) |
|---|---|---|---|
| `defer(fn)` | ❌ absent (announced in `deferredProps`) | ❌ | ✅ computed |
| `merge(fn)` | ✅ included + `mergedProps` | ✅ included | ✅ included + client accumulation |
| `lazy(fn)` | ❌ absent | ❌ absent | ✅ if in `X-Inertia-Partial-Data` |

---

## npm requirements

```jsonc
// Vue 3 — Inertia v2
{ "@inertiajs/vue3": "^2.0.0" }

// React — Inertia v2
{ "@inertiajs/react": "^2.0.0" }
```

v2 features (`<Deferred>`, merge accumulation, encryptHistory) do not work
with `@inertiajs/vue3@^1` or `@inertiajs/react@^1`.
