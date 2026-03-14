export { createInertia, pageToDiv, redirect } from "./core.ts"
export { viteDevScripts, viteProdAssets, readViteManifest, serveStaticAsset } from "./vite.ts"
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
