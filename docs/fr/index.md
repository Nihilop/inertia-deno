# deno-inertia — Documentation

**`@streemkit/inertia-deno`** est un adaptateur serveur [Inertia.js](https://inertiajs.com) pour Deno.
Il utilise exclusivement les API Web standard (`Request`, `Response`, `URLPattern`) et s'intègre
avec n'importe quel framework ou router compatible (Hono, Oak, std/http, etc.).

---

## Table des matières

| Page | Description |
|------|-------------|
| [Installation](./installation.md) | Prérequis, deno.json, npm |
| [Démarrage rapide](./demarrage-rapide.md) | Projet fonctionnel en 5 minutes |
| [Configuration](./configuration.md) | `InertiaConfig` — tous les champs |
| [Rendu](./rendu.md) | `render()`, `renderWithErrors()`, `redirect()` |
| [Props](./props.md) | normal, shared, always, lazy, defer, merge |
| [Formulaires & validation](./formulaires.md) | Erreurs, error bags, cycle POST |
| [Flash messages](./flash.md) | Cookie `__flash`, auto-clear |
| [Router](./router.md) | `createRouter()`, params, middleware, groupes |
| [Vite](./vite.md) | Intégration dev + production |
| [Adapters](./adapters.md) | Hono, Oak, std/http |
| [Inertia v2](./inertia-v2.md) | Deferred, merge, encryptHistory |
| [TypeScript](./typescript.md) | `PropValue<T>`, `PageProps<T>`, tous les types |
| [CLI](./cli.md) | `@streemkit/inertia-deno-cli` — init, dev, build, preview |

---

## Vue d'ensemble

### Qu'est-ce qu'Inertia.js ?

Inertia.js est un protocole qui crée des SPA « server-driven » sans API REST ni GraphQL.
Le serveur rend les pages sous forme de composants nommés avec des props JSON.
Le client (Vue, React, Svelte) monte ces composants directement — navigation SPA sans
JSON/fetch manuel.

```
Navigateur ──[ GET / ]──────────────────────► Deno
            ◄──[ HTML + <div data-page="…"> ]──

Navigateur ──[ GET /about  X-Inertia:true ]──► Deno
            ◄──[ JSON { component, props, url } ]──
```

### Pourquoi deno-inertia ?

| Contrainte | Solution |
|---|---|
| Fonctionne avec Hono, Oak, std/http… | API `Request`/`Response` pure — aucun couplage framework |
| Inertia v1 + v2 | `lazy`, `defer`, `merge`, `encryptHistory` |
| TypeScript strict | `PropValue<T>`, `PageProps<T>`, génériques sur `render<T>()` |
| Zéro magie | Chaque comportement est explicite et testable |

### Packages JSR

| Package | Rôle |
|---|---|
| `jsr:@streemkit/inertia-deno` | Bibliothèque serveur principale |
| `jsr:@streemkit/inertia-deno/hono` | Adapter Hono (`toWebRequest`) |
| `jsr:@streemkit/inertia-deno/oak` | Adapter Oak (`toWebRequest` + `applyResponse`) |
| `jsr:@streemkit/inertia-deno-cli` | CLI (init, dev, build, preview) |
