export type Router   = "hono" | "oak" | "std"
export type Frontend = "vue"  | "react"

export interface TemplateOptions {
  name:     string
  router:   Router
  frontend: Frontend
}

// ---------------------------------------------------------------------------
// deno.json
// ---------------------------------------------------------------------------

export function denoJson({ router, frontend }: TemplateOptions): string {
  const routerImport: Record<Router, string> = {
    hono: `    "hono":             "jsr:@hono/hono@^4",\n    "deno-inertia/hono": "jsr:@streemkit/inertia-deno/hono"`,
    oak:  `    "@oak/oak":         "jsr:@oak/oak@^17",\n    "deno-inertia/oak":  "jsr:@streemkit/inertia-deno/oak"`,
    std:  ``,
  }

  const extra = routerImport[router] ? `,\n${routerImport[router]}` : ""

  const compilerOptions = frontend === "react"
    ? `,\n  "compilerOptions": {\n    "jsx": "react-jsx",\n    "jsxImportSource": "react",\n    "lib": ["deno.ns", "dom", "dom.iterable", "esnext"]\n  }`
    : `,\n  "compilerOptions": {\n    "lib": ["deno.ns", "dom", "dom.iterable", "esnext"]\n  }`

  return `{
  "imports": {
    "deno-inertia": "jsr:@streemkit/inertia-deno"${extra}
  },
  "tasks": {
    "install": "deno run -A jsr:@streemkit/inertia-deno-cli install",
    "dev":     "deno run -A jsr:@streemkit/inertia-deno-cli dev",
    "build":   "deno run -A jsr:@streemkit/inertia-deno-cli build",
    "preview": "deno run -A jsr:@streemkit/inertia-deno-cli preview"
  }${compilerOptions}
}
`
}

// ---------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------

export function packageJson({ name, frontend }: TemplateOptions): string {
  const frontendDeps = frontend === "vue"
    ? `    "vue":                "^3.5.0",
    "@inertiajs/vue3":    "^2.0.0",
    "@vitejs/plugin-vue": "^5.0.0"`
    : `    "react":              "^18.3.0",
    "react-dom":          "^18.3.0",
    "@types/react":       "^18.3.0",
    "@types/react-dom":   "^18.3.0",
    "@inertiajs/react":   "^2.0.0",
    "@vitejs/plugin-react": "^4.0.0"`

  // JSON.stringify évite l'injection si name contient des guillemets
  return `{
  "name": ${JSON.stringify(name)},
  "private": true,
  "devDependencies": {
    "vite":       "^6.0.0",
    "typescript": "^5.0.0",
${frontendDeps}
  }
}
`
}

// ---------------------------------------------------------------------------
// vite.config.ts
// ---------------------------------------------------------------------------

export function viteConfig({ frontend }: TemplateOptions): string {
  if (frontend === "vue") {
    return `import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  server: { cors: true },
  build: {
    manifest: true,
    outDir: "dist",
    rollupOptions: { input: "src/main.ts" },
  },
})
`
  }
  return `import { defineConfig } from "vite"
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
`
}

// ---------------------------------------------------------------------------
// server.ts
// ---------------------------------------------------------------------------

export function serverTs({ router, frontend }: TemplateOptions): string {
  const entry    = frontend === "vue" ? "src/main.ts" : "src/main.tsx"
  const reactOpt = frontend === "react" ? ", react: true" : ""

  // ---- imports par router ----
  const imports: Record<Router, string> = {
    hono: `import { Hono } from "hono"
import { createInertia, pageToDiv, readViteManifest } from "deno-inertia"
import { toWebRequest } from "deno-inertia/hono"`,

    oak: `import { Application, Router } from "@oak/oak"
import { createInertia, pageToDiv, readViteManifest } from "deno-inertia"
import { toWebRequest, applyResponse } from "deno-inertia/oak"`,

    std: `import { createInertia, createRouter, pageToDiv, readViteManifest } from "deno-inertia"`,
  }

  // ---- corps du serveur par router ----
  const body: Record<Router, string> = {
    hono: `const app = new Hono()

app.get("/", async (c) =>
  inertia.render(toWebRequest(c), "Home", { message: "Hello depuis Hono 🔥" }),
)

Deno.serve({ port: PORT }, app.fetch)
console.log(\`🔥 http://localhost:\${PORT}\`)`,

    oak: `const app    = new Application()
const router = new Router()

router.get("/", async (ctx) =>
  applyResponse(ctx, await inertia.render(toWebRequest(ctx), "Home", { message: "Hello depuis Oak 🌳" })),
)

app.use(router.routes())
app.use(router.allowedMethods())

console.log(\`🌳 http://localhost:\${PORT}\`)
await app.listen({ port: PORT })`,

    std: `const router = createRouter()

router.get("/", (req) =>
  inertia.render(req, "Home", { message: "Hello depuis std/http 🦕" }),
)

console.log(\`🦕 http://localhost:\${PORT}\`)
Deno.serve({ port: PORT }, router.handler)`,
  }

  return `${imports[router]}

const IS_PROD  = Deno.env.get("PROD_MODE") === "1"
const PORT     = Number(Deno.env.get("PORT")     ?? 3000)
const VITE_URL = Deno.env.get("VITE_URL")        ?? "http://localhost:5173"

const manifest = IS_PROD
  ? await readViteManifest("dist/.vite/manifest.json")
  : null

const inertia = createInertia({
  version: "1.0.0",
  ...(IS_PROD && manifest
    ? { prod: { manifest, entry: "${entry}" } }
    : { vite: { url: VITE_URL, entry: "/${entry}"${reactOpt} } }),
  template: (page, assets) => \`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mon App</title>
  \${assets}
</head>
<body>
  \${pageToDiv(page)}
</body>
</html>\`,
})

${body[router]}
`
}

// ---------------------------------------------------------------------------
// src/main.ts  (Vue)
// ---------------------------------------------------------------------------

export function mainTs(): string {
  return `import { createApp, h } from "vue"
import { createInertiaApp } from "@inertiajs/vue3"

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("./pages/**/*.vue", { eager: true })
    const page  = pages[\`./pages/\${name}.vue\`]
    if (!page) throw new Error(\`[inertia] Page introuvable : "\${name}"\`)
    return page as object
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
})
`
}

// ---------------------------------------------------------------------------
// src/main.tsx  (React)
// ---------------------------------------------------------------------------

export function mainTsx(): string {
  return `import { createInertiaApp } from "@inertiajs/react"
import { createRoot } from "react-dom/client"

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("./pages/**/*.tsx", { eager: true })
    const page  = pages[\`./pages/\${name}.tsx\`]
    if (!page) throw new Error(\`[inertia] Page introuvable : "\${name}"\`)
    return page as object
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
`
}

// ---------------------------------------------------------------------------
// src/pages/Home.vue
// ---------------------------------------------------------------------------

export function homeVue(): string {
  return `<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <div style="font-family: sans-serif; max-width: 640px; margin: 5rem auto; text-align: center;">
    <h1 style="font-size: 2rem; margin-bottom: 1rem;">{{ message }}</h1>
    <p style="color: #71717a;">
      Bienvenue sur votre app <strong>deno-inertia</strong> + Vue 3.
    </p>
    <p style="font-size: .85rem; color: #a1a1aa; margin-top: 2rem;">
      Éditez <code>src/pages/Home.vue</code> et <code>server.ts</code> pour commencer.
    </p>
  </div>
</template>
`
}

// ---------------------------------------------------------------------------
// src/pages/Home.tsx
// ---------------------------------------------------------------------------

export function homeTsx(): string {
  return `export default function Home({ message }: { message: string }) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "5rem auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>{message}</h1>
      <p style={{ color: "#71717a" }}>
        Bienvenue sur votre app <strong>deno-inertia</strong> + React.
      </p>
      <p style={{ fontSize: ".85rem", color: "#a1a1aa", marginTop: "2rem" }}>
        Éditez <code>src/pages/Home.tsx</code> et <code>server.ts</code> pour commencer.
      </p>
    </div>
  )
}
`
}

// ---------------------------------------------------------------------------
// .gitignore
// ---------------------------------------------------------------------------

export function gitignore(): string {
  return `node_modules/
dist/
.env
.env.local
`
}
