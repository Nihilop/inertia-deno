import type { LazyProp } from "./lazy.ts"
import type { DeferredProp } from "./defer.ts"
import type { MergedProp } from "./merge.ts"

/**
 * Données de page envoyées au client Inertia — dans le `data-page` div (premier rendu)
 * ou dans le corps JSON des requêtes SPA suivantes.
 *
 * Ne pas construire manuellement : utilisez `inertia.render()` ou `inertia.pageToDiv()`.
 */
export interface PageData {
  component: string
  props: Record<string, unknown>
  url: string
  version: string | null
  /**
   * Deferred props (Inertia v2) — map groupe → clés.
   * Présent uniquement dans les réponses initiales (pas dans les partial reloads).
   * Le client Inertia v2 fetch automatiquement chaque groupe en un partial reload.
   * Ex: { default: ["stats", "topUsers"], sidebar: ["permissions"] }
   */
  deferredProps?: Record<string, string[]>

  /**
   * Merge props (Inertia v2) — clés des props marquées avec merge().
   * Signale au client qu'il doit accumuler (append) les nouvelles valeurs
   * au lieu de remplacer lors d'un partial reload.
   */
  mergedProps?: string[]

  /**
   * History encryption (Inertia v2) — chiffre l'état de l'historique
   * côté browser. Configuré globalement via InertiaConfig.encryptHistory.
   */
  encryptHistory?: boolean
}

/** Configuration Vite pour le mode développement (HMR). Mutuellement exclusif avec `prod`. */
export interface ViteDevConfig {
  /** URL du serveur Vite en dev — défaut: "http://localhost:5173" */
  url?: string
  /** Entrée JS/TS — ex: "/src/vue/main.ts" */
  entry: string
  /**
   * Injecte le preamble React Refresh (@react-refresh) requis par @vitejs/plugin-react.
   * À activer si le frontend est React ; inutile avec Vue.
   * Sans ce preamble, plugin-react lève "can't detect preamble. Something is wrong."
   */
  react?: boolean
}

/** Configuration Vite pour le mode production (manifest). Mutuellement exclusif avec `vite`. */
export interface ViteProdConfig {
  /** Manifest Vite parsé via readViteManifest(). Chargé au démarrage. */
  manifest: ViteManifest
  /** Même entrée que Vite — ex: "src/vue/main.ts" (sans slash initial) */
  entry: string
  /** Préfixe URL des assets — défaut: "/assets/" */
  base?: string
}

/**
 * Résolveur de props — objet statique ou fonction (sync/async).
 */
export type PropsResolver =
  | Record<string, unknown>
  | ((request: Request) => Record<string, unknown> | Promise<Record<string, unknown>>)

/** Alias lisible pour les shared props */
export type SharedPropsResolver = PropsResolver

export interface InertiaConfig {
  /**
   * Version string ou factory.
   * Déclencheur de hard reload si le client a une version différente.
   */
  version?: string | (() => string | null)

  /**
   * Props partagées mergées dans chaque page (auth, flash, etc.).
   * Fusionnées avant les props de page. En partial reload, filtrées sauf `always`.
   */
  shared?: PropsResolver

  /**
   * Props toujours incluses, même lors d'un partial reload.
   * Idéal pour : auth.user, flash, csrf_token.
   */
  always?: PropsResolver

  /**
   * Builder du template HTML complet.
   * `page`   → données de page (à injecter via pageToDiv)
   * `assets` → balises <script>/<link> auto-générées
   */
  template: (page: PageData, assets: string) => string

  /** Config Vite dev (HMR). Mutuellement exclusif avec `prod`. */
  vite?: ViteDevConfig

  /** Config production (manifest Vite). Mutuellement exclusif avec `vite`. */
  prod?: ViteProdConfig

  /**
   * Entry point Vite — raccourci pour la config auto dev/prod.
   * Lit `PROD_MODE` (env) : "1" → prod (lit le manifest via readTextFileSync),
   * sinon → dev (HMR via Vite dev server).
   * Ignoré si `vite` ou `prod` est aussi fourni (rétrocompatibilité totale).
   *
   * @example
   *   createInertia({ entry: "src/main.ts", template: ... })
   */
  entry?: string

  /**
   * Répertoire de build Vite — utilisé uniquement avec `entry`.
   * Le manifest est cherché à `${distDir}/.vite/manifest.json`.
   * Défaut: "dist"
   */
  distDir?: string

  /**
   * Injecte le preamble React Refresh — utilisé avec `entry`.
   * Inutile avec Vue. Identique à `vite.react`.
   */
  react?: boolean

  /**
   * Si true, efface automatiquement le cookie flash (__flash) dans chaque
   * réponse render (HTML et JSON). Évite d'appeler clearFlashCookie()
   * manuellement dans chaque middleware/handler.
   */
  clearFlash?: boolean

  /**
   * Si true, chiffre l'état de l'historique dans le browser (Inertia v2).
   * Appliqué globalement à toutes les pages de ce serveur Inertia.
   */
  encryptHistory?: boolean
}

/** Erreurs de validation — clé = champ, valeur = message */
export type ValidationErrors = Record<string, string>

/**
 * Valeur d'une prop serveur — valeur directe ou wrapped dans un marqueur.
 * Permet de typer strictement les props passées à `render<T>()`.
 *
 * @example
 *   type PropValue<Stats> = Stats | LazyProp<Stats> | DeferredProp<Stats> | MergedProp<Stats>
 */
export type PropValue<T> = T | LazyProp<T> | DeferredProp<T> | MergedProp<T>

/**
 * Type des props côté serveur pour `render<T>()`.
 * Transforme le type de props du composant en acceptant `PropValue` pour chaque clé.
 * Les clés optionnelles du composant (lazy/deferred) acceptent `PropValue<NonNullable<T[K]>>`.
 *
 * @example
 *   interface DashboardProps {
 *     router: string
 *     stats?: Stats         // sera passé comme defer(getStats)
 *     chart?: ChartData     // sera passé comme lazy(getChart)
 *   }
 *   inertia.render<DashboardProps>(req, "Dashboard", {
 *     router: "std/http",
 *     stats:  defer(getStats),  // ✅ DeferredProp<Stats>
 *     chart:  lazy(getChart),   // ✅ LazyProp<ChartData>
 *   })
 */
export type PageProps<T extends Record<string, unknown>> = {
  [K in keyof T]: PropValue<NonNullable<T[K]>>
}

/**
 * Instance retournée par `createInertia()`.
 * Type de retour explicite requis par JSR (no slow types).
 */
export interface InertiaInstance {
  render<T extends Record<string, unknown> = Record<string, unknown>>(
    request: Request,
    component: string,
    props?: PageProps<T>,
    responseInit?: ResponseInit,
  ): Promise<Response>

  renderWithErrors<T extends Record<string, unknown> = Record<string, unknown>>(
    request: Request,
    component: string,
    props: PageProps<T>,
    errors: ValidationErrors,
    errorBag?: string,
  ): Promise<Response>

  redirect(url: string, headers?: Record<string, string>): Response

  pageToDiv(page: PageData): string
}

/**
 * Entrée dans le manifest Vite (`.vite/manifest.json`).
 * Décrit un chunk produit par `vite build` — fichier haché, CSS associés, imports.
 */
export interface ManifestChunk {
  /** Nom de fichier haché — ex: "assets/main-Bx1Q3.js" */
  file: string
  /** Fichier source d'origine — présent uniquement pour les entrypoints */
  src?: string
  /** Fichiers CSS produits par ce chunk */
  css?: string[]
  /** Chunks importés par ce chunk */
  imports?: string[]
  /** true si c'est un entrypoint Vite */
  isEntry?: boolean
}

/** Manifest Vite complet — clé = chemin source relatif (ex: "src/main.ts") */
export type ViteManifest = Record<string, ManifestChunk>
