import { readViteManifest, pageToDiv } from "deno-inertia"
import type { InertiaConfig, ViteManifest, PageData } from "deno-inertia"
import { sharedProps, alwaysProps } from "./shared_props.ts"

export const FRONTEND    = Deno.env.get("FRONTEND")    ?? "vue"
export const IS_PROD     = Deno.env.get("PROD_MODE")   === "1"
export const VITE_URL    = Deno.env.get("VITE_URL")    ?? "http://localhost:5173"
export const ASSETS_BASE = Deno.env.get("ASSETS_BASE") ?? "/assets/"
export const PORT        = Number(Deno.env.get("PORT") ?? 3000)

export function entryForFrontend(): string {
  return FRONTEND === "vue" ? "src/vue/main.ts" : "src/react/main.tsx"
}

export function distDir(): string {
  return `dist/${FRONTEND}`
}

export async function loadManifest(): Promise<ViteManifest | null> {
  if (!IS_PROD) return null
  const manifestPath = Deno.env.get("VITE_MANIFEST") ?? `dist/${FRONTEND}/.vite/manifest.json`
  try {
    return await readViteManifest(manifestPath)
  } catch {
    console.error(`\n❌  Manifest Vite introuvable : ${manifestPath}`)
    console.error(`   → Lancez d'abord : deno task build:${FRONTEND}\n`)
    Deno.exit(1)
  }
}

export function buildInertiaConfig(
  manifest: ViteManifest | null,
  routerName: string,
): InertiaConfig {
  const entry = entryForFrontend()

  const isReact = FRONTEND === "react"
  const assetConfig = IS_PROD && manifest
    ? { prod: { manifest, entry, base: ASSETS_BASE } }
    : { vite: { url: VITE_URL, entry: `/${entry}`, react: isReact } }

  return {
    version:    "1.0.0",
    shared:     sharedProps,
    always:     alwaysProps,
    clearFlash: true,
    ...assetConfig,
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
