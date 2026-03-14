# Props

deno-inertia supports five types of props, each with different behavior
depending on the render context (initial, SPA, partial reload).

---

## Merge order

```
shared  (InertiaConfig.shared)
  +
page props  (passed to render())
  +
always  (InertiaConfig.always)   ← overwrites both if conflict
```

In a partial reload (`X-Inertia-Partial-Data`), `shared` is filtered but `always` is always included.

---

## Normal props

Computed and sent on every render.

```ts
inertia.render(req, "Home", {
  title:   "Home",
  user:    await getUser(req),
  posts:   await getPosts(),
})
```

---

## `shared` — shared props

Defined in `InertiaConfig.shared`. Merged into every page.

```ts
const inertia = createInertia({
  shared: async (req) => ({
    locale:  "en",
    appName: "My App",
  }),
  // ...
})
```

On the client, all pages have access to `usePage().props.locale`.

**Note** — In a partial reload, `shared` is filtered if keys are not in
`X-Inertia-Partial-Data`. For props guaranteed in all renders, use `always`.

---

## `always` — always-included props

Defined in `InertiaConfig.always`. Included in **all** renders,
including partial reloads.

```ts
const inertia = createInertia({
  always: async (req) => ({
    auth:  { user: await getUser(req) },
    flash: await readFlash(req),
  }),
})
```

---

## `lazy(fn)` — lazy props

Excluded from all renders unless **explicitly requested** in a partial reload
via `X-Inertia-Partial-Data`.

```ts
import { lazy } from "deno-inertia"

inertia.render(req, "Dashboard", {
  title: "Dashboard",                      // normal — always present
  chart: lazy(() => getChartData()),        // absent until explicitly requested
})
```

**Use case** — expensive data loaded on demand by the user.

Vue client:

```ts
// Load the "chart" prop only when the user clicks
router.reload({ only: ["chart"] })
```

React client:

```tsx
<button onClick={() => router.reload({ only: ["chart"] })}>
  Load chart
</button>

{chart && <Chart data={chart} />}
```

> **React note** — Unlike Vue (lazy slots), React JSX is evaluated eagerly.
> Use `{chart && <Chart />}` rather than `chart!.data`.

---

## `defer(fn, group?)` — deferred props (Inertia v2)

Excluded from the **first render**, announced in `PageData.deferredProps`.
The Inertia v2 client loads them automatically after the initial render.

```ts
import { defer } from "deno-inertia"

inertia.render(req, "Dashboard", {
  title:    "Dashboard",
  stats:    defer(() => getStats()),              // "default" group
  topPosts: defer(() => getTopPosts()),           // "default" group
  sidebar:  defer(() => getSidebar(), "sidebar"), // separate group
})
```

Props in the same group are loaded in **one request**.

**PageData sent to client (first render):**
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

Vue client (Inertia v2):

```vue
<Deferred data="stats">
  <template #fallback><Spinner /></template>
  <div>{{ stats.totalUsers }}</div>
</Deferred>
```

React client (Inertia v2):

```tsx
<Deferred data="stats" fallback={<Spinner />}>
  {/* Guard needed in React — JSX evaluated eagerly */}
  {stats && <div>{stats.totalUsers}</div>}
</Deferred>
```

Requires `@inertiajs/vue3@^2` or `@inertiajs/react@^2`.

---

## `merge(fn)` — accumulated props (Inertia v2)

Always computed and sent, but the Inertia v2 client **accumulates** values
instead of replacing. Ideal for infinite pagination.

```ts
import { merge } from "deno-inertia"

inertia.render(req, "Feed", {
  posts: merge(() => getLatestPosts()),
})
```

**PageData sent:**
```json
{
  "props": { "posts": [...] },
  "mergedProps": ["posts"]
}
```

Vue client:

```ts
// Each reload() APPENDS new posts to the existing array
router.reload({ only: ["posts"] })
```

---

## Behavior summary

| Type | Initial render | SPA nav | Partial reload (requested) | Partial reload (not requested) |
|---|---|---|---|---|
| Normal | ✅ | ✅ | ✅ | ❌ filtered |
| `shared` | ✅ | ✅ | ✅ if in list | ❌ filtered |
| `always` | ✅ | ✅ | ✅ always | ✅ always |
| `lazy(fn)` | ❌ absent | ❌ absent | ✅ computed | ❌ absent |
| `defer(fn)` | ❌ → announced | ❌ → announced | ✅ computed | ❌ ignored |
| `merge(fn)` | ✅ | ✅ | ✅ + `mergedProps` signal | ✅ |

---

## Strict typing with `PageProps<T>`

```ts
import type { PageProps } from "deno-inertia"

interface DashboardProps {
  router:   string
  stats?:   Stats       // optional → passed via defer()
  chart?:   ChartData   // optional → passed via lazy()
  posts:    Post[]      // required → direct value or merge()
}

// TypeScript validates each marker
inertia.render<DashboardProps>(req, "Dashboard", {
  router: "Hono",
  stats:  defer(getStats),    // ✅ DeferredProp<Stats>
  chart:  lazy(getChart),     // ✅ LazyProp<ChartData>
  posts:  merge(getPosts),    // ✅ MergedProp<Post[]>
})
```

→ See [TypeScript](./typescript.md) for type details.
