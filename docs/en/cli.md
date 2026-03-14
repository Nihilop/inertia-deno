# CLI — `@streemkit/inertia-deno-cli`

`@streemkit/inertia-deno-cli` is a command-line tool to create and manage
deno-inertia projects.

---

## Installation

### Without global install (recommended)

Via `deno run`, directly from JSR:

```bash
deno run -A jsr:@streemkit/inertia-deno-cli init my-app
```

### Global install

```bash
deno install -g -A jsr:@streemkit/inertia-deno-cli -n inertia
```

Then:

```bash
inertia init my-app
inertia dev
inertia build
inertia preview
```

### Via `deno task` (in an existing project)

```jsonc
// deno.json
{
  "tasks": {
    "install": "deno run -A jsr:@streemkit/inertia-deno-cli install",
    "dev":     "deno run -A jsr:@streemkit/inertia-deno-cli dev",
    "build":   "deno run -A jsr:@streemkit/inertia-deno-cli build",
    "preview": "deno run -A jsr:@streemkit/inertia-deno-cli preview"
  }
}
```

---

## `init` — Create a project

Interactive wizard that generates a complete project.

```bash
inertia init [name]
# or
deno run -A jsr:@streemkit/inertia-deno-cli init [name]
```

### Questions asked

1. **Project name** — folder created in current directory
2. **Frontend** — Vue 3 (Composition API + SFC) or React 18 (hooks + TSX)
3. **Deno router** — Hono (recommended), Oak, or std/http

### Generated files

```
my-app/
├── deno.json          ← imports, tasks, compilerOptions
├── package.json       ← Vite + frontend npm deps
├── vite.config.ts     ← Vite config (Vue or React)
├── server.ts          ← server with createInertia + chosen router
├── .gitignore
└── src/
    ├── main.ts        ← (Vue) or main.tsx (React) — createInertiaApp
    └── pages/
        └── Home.vue   ← (or Home.tsx for React)
```

### Example output

```
╔══════════════════════════════════════╗
║   deno-inertia — New project 🦕       ║
╚══════════════════════════════════════╝

? Project name › my-app
? Frontend › Vue 3 (Composition API + SFC)
? Deno router › Hono — lightweight, TypeScript-first (recommended)

  ✅ deno.json
  ✅ package.json
  ✅ vite.config.ts
  ✅ server.ts
  ✅ .gitignore
  ✅ src/main.ts
  ✅ src/pages/Home.vue

✨ Project "my-app" created! (Vue 3 + Hono)

  cd my-app
  deno task install
  deno task dev
```

---

## `dev` — Development mode

Starts **Vite** (`:5173`) and the **Deno server** (`:3000`) in parallel.
The Deno server runs with `--watch` for automatic restart.

```bash
inertia dev [options]
```

| Option | Default | Description |
|---|---|---|
| `--server` | `server.ts` | Deno server file |
| `--vite-config` | `vite.config.ts` | Vite config file |
| `--port` | `3000` | Deno server port |
| `--vite-port` | `5173` | Vite server port |

```bash
# Custom ports
inertia dev --port=8080 --vite-port=5174

# Server in subdirectory
inertia dev --server=src/server.ts
```

---

## `build` — Compile the frontend

Runs `vite build` to compile assets into `dist/`.

```bash
inertia build [options]
```

| Option | Default | Description |
|---|---|---|
| `--vite-config` | `vite.config.ts` | Vite config file |

```bash
inertia build
# → dist/.vite/manifest.json
# → dist/assets/main-abc123.js
# → dist/assets/style-def456.css
```

---

## `preview` — Production mode

Starts the Deno server in production mode (`PROD_MODE=1`).
Assets are served from `dist/` via the Vite manifest.
Vite is **not** started.

```bash
inertia preview [options]
```

| Option | Default | Description |
|---|---|---|
| `--server` | `server.ts` | Deno server file |
| `--port` | `3000` | Server port |

```bash
# Build then preview
inertia build
inertia preview --port=8080
```

---

## `install` — Install npm dependencies

Installs npm dependencies (Vite + frontend) by automatically detecting
the package manager.

```bash
inertia install
# Equivalent to: npm install / pnpm install / yarn / bun install
```

### Automatic package manager detection

The CLI detects the package manager via present lockfiles:

| Lockfile | Package manager |
|---|---|
| `bun.lockb` | bun |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| *(none)* | npm |

---

## Global options

```bash
inertia --help      # full help
inertia --version   # CLI version
inertia -h          # alias --help
inertia -v          # alias --version
```

---

## Full workflow

```bash
# 1. Create a project
deno run -A jsr:@streemkit/inertia-deno-cli init my-app
cd my-app

# 2. Install npm dependencies
deno task install

# 3. Development (Vite + Deno in parallel)
deno task dev
# → http://localhost:3000

# 4. Build for production
deno task build

# 5. Test the production build
deno task preview
# → http://localhost:3000 (no Vite, assets from dist/)
```
