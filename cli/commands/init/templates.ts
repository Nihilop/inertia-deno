import cliMeta from "../../deno.json" with { type: "json" }

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
  const v = cliMeta.version

  const routerImport: Record<Router, string> = {
    hono: `    "hono":             "jsr:@hono/hono@^4",\n    "deno-inertia/hono": "jsr:@streemkit/inertia-deno@^${v}/hono"`,
    oak:  `    "@oak/oak":         "jsr:@oak/oak@^17",\n    "deno-inertia/oak":  "jsr:@streemkit/inertia-deno@^${v}/oak"`,
    std:  ``,
  }

  const extra = routerImport[router] ? `,\n${routerImport[router]}` : ""

  const compilerOptions = frontend === "react"
    ? `,\n  "compilerOptions": {\n    "jsx": "react-jsx",\n    "jsxImportSource": "react",\n    "lib": ["deno.ns", "dom", "dom.iterable", "esnext"]\n  }`
    : `,\n  "compilerOptions": {\n    "lib": ["deno.ns", "dom", "dom.iterable", "esnext"]\n  }`

  return `{
  "imports": {
    "deno-inertia": "jsr:@streemkit/inertia-deno@^${v}"${extra}
  },
  "tasks": {
    "install": "deno run -A jsr:@streemkit/inertia-deno-cli@^${v} install",
    "dev":     "deno run -A jsr:@streemkit/inertia-deno-cli@^${v} dev",
    "build":   "deno run -A jsr:@streemkit/inertia-deno-cli@^${v} build",
    "preview": "deno run -A jsr:@streemkit/inertia-deno-cli@^${v} preview"
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
  const entry     = frontend === "vue" ? "src/main.ts" : "src/main.tsx"
  const reactLine = frontend === "react" ? "\n  react: true," : ""

  // ---- imports par router ----
  const imports: Record<Router, string> = {
    hono: `import { Hono } from "hono"
import { createInertia, pageToDiv } from "deno-inertia"
import { toWebRequest, serveAssets } from "deno-inertia/hono"`,

    oak: `import { Application, Router } from "@oak/oak"
import { createInertia, pageToDiv, serveStaticAsset } from "deno-inertia"
import { toWebRequest, applyResponse } from "deno-inertia/oak"`,

    std: `import { createInertia, createRouter, pageToDiv, serveStaticAsset } from "deno-inertia"`,
  }

  // ---- corps du serveur par router ----
  const body: Record<Router, string> = {
    hono: `const app = new Hono()

if (Deno.env.get("PROD_MODE") === "1") {
  app.use("/assets/*", serveAssets("dist"))
}

app.get("/", (c) =>
  inertia.render(toWebRequest(c), "Home", { message: "Hello depuis Hono 🔥" }),
)

console.log(\`🔥 http://localhost:\${PORT}\`)
Deno.serve({ port: PORT }, app.fetch)`,

    oak: `const app    = new Application()
const router = new Router()

if (Deno.env.get("PROD_MODE") === "1") {
  app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith("/assets/")) {
      const res = await serveStaticAsset(toWebRequest(ctx), "dist")
      if (res) { await applyResponse(ctx, res); return }
    }
    await next()
  })
}

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

async function handler(request: Request): Promise<Response> {
  if (Deno.env.get("PROD_MODE") === "1" && new URL(request.url).pathname.startsWith("/assets/")) {
    const res = await serveStaticAsset(request, "dist")
    return res ?? new Response("404 Not Found", { status: 404 })
  }
  return router.handler(request)
}

console.log(\`🦕 http://localhost:\${PORT}\`)
Deno.serve({ port: PORT }, handler)`,
  }

  return `${imports[router]}

const PORT = Number(Deno.env.get("PORT") ?? 3000)

const inertia = createInertia({
  version: "1.0.0",
  entry: "${entry}",${reactLine}
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
