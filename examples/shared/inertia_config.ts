import { pageToDiv } from "deno-inertia"
import type { InertiaConfig, PageData } from "deno-inertia"
import { sharedProps, alwaysProps } from "./shared_props.ts"

export const FRONTEND = Deno.env.get("FRONTEND") ?? "vue"
export const IS_PROD  = Deno.env.get("PROD_MODE") === "1"
export const PORT     = Number(Deno.env.get("PORT") ?? 3000)

export function distDir(): string {
  return `dist/${FRONTEND}`
}

export function buildInertiaConfig(routerName: string): InertiaConfig {
  return {
    version:    "1.0.0",
    entry:      FRONTEND === "vue" ? "src/vue/main.ts" : "src/react/main.tsx",
    distDir:    distDir(),
    react:      FRONTEND === "react",
    shared:     sharedProps,
    always:     alwaysProps,
    clearFlash: true,
    template: (page: PageData, assets: string) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>deno-inertia · ${routerName} · ${FRONTEND}</title>
  ${assets}
</head>
<body>
  ${pageToDiv(page)}
</body>
</html>`,
  }
}
