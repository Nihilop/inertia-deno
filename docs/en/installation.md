# Installation

## Prerequisites

| Tool | Minimum version | Role |
|---|---|---|
| [Deno](https://deno.land) | 2.x | Server runtime |
| [Node.js](https://nodejs.org) | 18+ | Required for Vite (npm/npx) |

> **Tip** — The `@deno-inertia/cli` handles all of this automatically.
> See [CLI → init](./cli.md) to create a project with one command.

---

## Manual installation

### 1. `deno.json`

Add `@deno-inertia/core` to your project imports:

```jsonc
// deno.json
{
  "imports": {
    "deno-inertia": "jsr:@deno-inertia/core"
  }
}
```

With your router of choice:

```jsonc
// Hono
{
  "imports": {
    "deno-inertia":      "jsr:@deno-inertia/core",
    "deno-inertia/hono": "jsr:@deno-inertia/core/hono",
    "hono":              "jsr:@hono/hono@^4"
  }
}
```

```jsonc
// Oak
{
  "imports": {
    "deno-inertia":     "jsr:@deno-inertia/core",
    "deno-inertia/oak": "jsr:@deno-inertia/core/oak",
    "@oak/oak":         "jsr:@oak/oak@^17"
  }
}
```

### 2. `package.json` — npm dependencies (Vite + frontend)

```jsonc
// package.json
{
  "devDependencies": {
    "vite": "^6.0.0",

    // Vue 3
    "vue":                "^3.5.0",
    "@inertiajs/vue3":    "^2.0.0",
    "@vitejs/plugin-vue": "^5.0.0",

    // React 18 (alternative)
    "react":                "^18.3.0",
    "react-dom":            "^18.3.0",
    "@types/react":         "^18.3.0",
    "@types/react-dom":     "^18.3.0",
    "@inertiajs/react":     "^2.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

```bash
npm install      # or pnpm install / yarn / bun install
```

### 3. `vite.config.ts`

```ts
// Vue
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  server: { cors: true },          // allow requests from Deno server
  build: {
    manifest: true,                // generates .vite/manifest.json
    outDir: "dist",
    rollupOptions: { input: "src/main.ts" },
  },
})
```

```ts
// React
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: { cors: true },
  build: {
    manifest: true,
    outDir: "dist",
    rollupOptions: { input: "src/main.tsx" },
  },
})
```

### 4. `compilerOptions` (React only)

If you use React with `deno check`, add to `deno.json`:

```jsonc
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "lib": ["deno.ns", "dom", "dom.iterable", "esnext"]
  }
}
```

For Vue, only `lib` is needed (Vite handles JSX):

```jsonc
{
  "compilerOptions": {
    "lib": ["deno.ns", "dom", "dom.iterable", "esnext"]
  }
}
```

---

## Verification

```bash
deno check server.ts      # type-check the server
deno task dev             # start Vite + Deno server
```

→ See [Quick start](./quick-start.md) to continue.
