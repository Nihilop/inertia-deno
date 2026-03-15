/**
 * @streemkit/inertia-deno — Inertia.js server-side adapter for Deno.
 *
 * Integrates with any Web API-compatible router (Hono, Oak, std/http, etc.)
 * using only standard `Request`/`Response` primitives. Supports Inertia v1 and v2
 * features: lazy props, deferred props, merge props, and history encryption.
 *
 * @example Basic usage with Hono
 * ```ts
 * import { Hono } from "hono"
 * import { createInertia, pageToDiv, readViteManifest } from "@streemkit/inertia-deno"
 * import { toWebRequest } from "@streemkit/inertia-deno/hono"
 *
 * const inertia = createInertia({
 *   version: "1.0.0",
 *   vite: { entry: "/src/main.ts" },
 *   template: (page, assets) => `<!DOCTYPE html>
 * <html><head>${assets}</head><body>${pageToDiv(page)}</body></html>`,
 * })
 *
 * const app = new Hono()
 * app.get("/", (c) => inertia.render(toWebRequest(c), "Home", { message: "Hello!" }))
 * Deno.serve(app.fetch)
 * ```
 *
 * @module
 */
export { createInertia, pageToDiv, redirect } from "./core.ts"
export { viteDevScripts, viteProdAssets, readViteManifest, serveStaticAsset, resolveViteConfig } from "./vite.ts"
export { readFlash, flashCookie, clearFlashCookie } from "./flash.ts"
export { createRouter } from "./router.ts"
export { lazy, LazyProp } from "./lazy.ts"
export { defer, DeferredProp } from "./defer.ts"
export { merge, MergedProp } from "./merge.ts"
export type {
  PageData,
  InertiaConfig,
  InertiaInstance,
  ViteDevConfig,
  ViteProdConfig,
  ViteManifest,
  ManifestChunk,
  SharedPropsResolver,
  PropsResolver,
  ValidationErrors,
  PropValue,
  PageProps,
} from "./types.ts"
export type { FlashMessage } from "./flash.ts"
export type { RouteHandler, RouteParams, MiddlewareFn, RouterGroup, InertiaRouter } from "./router.ts"
