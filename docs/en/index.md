# deno-inertia — Documentation

**`@streemkit/inertia-deno`** is an [Inertia.js](https://inertiajs.com) server-side adapter for Deno.
It uses only standard Web APIs (`Request`, `Response`, `URLPattern`) and integrates
with any compatible framework or router (Hono, Oak, std/http, etc.).

---

## Table of contents

| Page | Description |
|------|-------------|
| [Installation](./installation.md) | Prerequisites, deno.json, npm |
| [Quick start](./quick-start.md) | Working project in 5 minutes |
| [Configuration](./configuration.md) | `InertiaConfig` — all fields |
| [Rendering](./rendering.md) | `render()`, `renderWithErrors()`, `redirect()` |
| [Props](./props.md) | normal, shared, always, lazy, defer, merge |
| [Forms & validation](./forms.md) | Errors, error bags, POST cycle |
| [Flash messages](./flash.md) | `__flash` cookie, auto-clear |
| [Router](./router.md) | `createRouter()`, params, middleware, groups |
| [Vite](./vite.md) | Dev + production integration |
| [Adapters](./adapters.md) | Hono, Oak, std/http |
| [Inertia v2](./inertia-v2.md) | Deferred, merge, encryptHistory |
| [TypeScript](./typescript.md) | `PropValue<T>`, `PageProps<T>`, all types |
| [CLI](./cli.md) | `@streemkit/inertia-deno-cli` — init, dev, build, preview |

---

## Overview

### What is Inertia.js?

Inertia.js is a protocol that creates server-driven SPAs without REST APIs or GraphQL.
The server renders pages as named components with JSON props.
The client (Vue, React, Svelte) mounts these components directly — SPA navigation
without manual JSON/fetch.

```
Browser ──[ GET / ]──────────────────────► Deno
        ◄──[ HTML + <div data-page="…"> ]──

Browser ──[ GET /about  X-Inertia:true ]──► Deno
        ◄──[ JSON { component, props, url } ]──
```

### Why deno-inertia?

| Constraint | Solution |
|---|---|
| Works with Hono, Oak, std/http… | Pure `Request`/`Response` API — no framework coupling |
| Inertia v1 + v2 | `lazy`, `defer`, `merge`, `encryptHistory` |
| Strict TypeScript | `PropValue<T>`, `PageProps<T>`, generics on `render<T>()` |
| Zero magic | Every behavior is explicit and testable |

### JSR packages

| Package | Role |
|---|---|
| `jsr:@streemkit/inertia-deno` | Main server library |
| `jsr:@streemkit/inertia-deno/hono` | Hono adapter (`toWebRequest`) |
| `jsr:@streemkit/inertia-deno/oak` | Oak adapter (`toWebRequest` + `applyResponse`) |
| `jsr:@streemkit/inertia-deno-cli` | CLI (init, dev, build, preview) |
