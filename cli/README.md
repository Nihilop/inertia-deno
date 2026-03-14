# @streemkit/inertia-deno-cli

**CLI for [@streemkit/inertia-deno](https://jsr.io/@streemkit/inertia-deno)** — scaffold a new Inertia.js + Deno project in seconds, and run dev/build/preview workflows.

---

## Install

```sh
deno install -g -A jsr:@streemkit/inertia-deno-cli -n inertia
```

Or run without installing:

```sh
deno run -A jsr:@streemkit/inertia-deno-cli <command>
```

---

## Commands

### `inertia init [name]`

Scaffold a new project interactively:

```sh
inertia init my-app
```

The wizard asks for:
- **Project name** — used as the folder name and `package.json` name
- **Frontend** — Vue 3 (Composition API + SFC) or React 18 (hooks + TSX)
- **Deno router** — Hono, Oak, or std/http

Generated project structure:

```
my-app/
├── deno.json        # Deno tasks + import map
├── package.json     # npm deps (Vite + frontend)
├── vite.config.ts   # Vite config
├── server.ts        # Deno server (Hono / Oak / std/http)
├── .gitignore
└── src/
    ├── main.ts       # (Vue) or main.tsx (React) — Inertia app entry
    └── pages/
        └── Home.vue  # (Vue) or Home.tsx (React)
```

After scaffolding:

```sh
cd my-app
deno task install   # npm install — Vite + Vue/React
deno task dev       # Vite :5173 + Deno server :3000 (HMR + auto-reload)
deno task build     # compile frontend → dist/
deno task preview   # production mode, no Vite
```

---

### `inertia dev`

Start the development environment: Vite (HMR) + Deno server (auto-reload on file change) in parallel.

```sh
inertia dev
inertia dev --port=8080 --vite-port=5173
inertia dev --server=src/server.ts
```

Options:

| Flag | Default | Description |
|---|---|---|
| `--server` | `server.ts` | Deno server entry file |
| `--vite-config` | `vite.config.ts` | Vite config file |
| `--port` | `3000` | Deno server port |
| `--vite-port` | `5173` | Vite dev server port |

---

### `inertia build`

Compile the frontend assets with Vite (`vite build`):

```sh
inertia build
inertia build --vite-config=vite.config.ts
```

Output goes to `dist/` (configured in `vite.config.ts`).

---

### `inertia preview`

Start the Deno server in production mode (no Vite):

```sh
inertia preview
inertia preview --port=8080
inertia preview --server=src/server.ts
```

---

### `inertia install`

Install npm dependencies (`node_modules`) using the detected package manager (npm, pnpm, yarn, or bun):

```sh
inertia install
```

---

## Use without global install

Add tasks to your `deno.json` so teammates don't need a global install:

```json
{
  "tasks": {
    "dev":     "deno run -A jsr:@streemkit/inertia-deno-cli dev",
    "build":   "deno run -A jsr:@streemkit/inertia-deno-cli build",
    "preview": "deno run -A jsr:@streemkit/inertia-deno-cli preview"
  }
}
```

Then simply:

```sh
deno task dev
deno task build
deno task preview
```

---

## Requirements

- [Deno](https://deno.land) ≥ 2.0
- [Node.js](https://nodejs.org) ≥ 18 (for Vite — only needed for `dev` / `build`)

---

## Related

- [@streemkit/inertia-deno](https://jsr.io/@streemkit/inertia-deno) — the server-side library
- [Inertia.js](https://inertiajs.com) — the protocol

---

## License

MIT © [streemkit](https://streemkit.com)
