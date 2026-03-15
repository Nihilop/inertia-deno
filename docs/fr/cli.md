# CLI — `@streemkit/inertia-deno-cli`

`@streemkit/inertia-deno-cli` est un outil en ligne de commande pour créer et gérer
des projets deno-inertia.

---

## Installation

### Utilisation sans installation (recommandé)

Via `deno run`, directement depuis JSR :

```bash
deno run -A jsr:@streemkit/inertia-deno-cli init mon-app
```

### Installation globale

```bash
deno install -g -A jsr:@streemkit/inertia-deno-cli -n inertia
```

Puis :

```bash
inertia init mon-app
inertia dev
inertia build
inertia preview
```

### Via `deno task` (dans un projet existant)

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

## `init` — Créer un projet

Wizard interactif qui génère un projet complet.

```bash
inertia init [nom]
# ou
deno run -A jsr:@streemkit/inertia-deno-cli init [nom]
```

### Questions posées

1. **Nom du projet** — dossier créé dans le répertoire courant
2. **Frontend** — Vue 3 (Composition API + SFC) ou React 18 (hooks + TSX)
3. **Router Deno** — Hono (recommandé), Oak, ou std/http

### Fichiers générés

```
mon-app/
├── deno.json          ← imports, tasks, compilerOptions
├── package.json       ← Vite + frontend npm deps
├── vite.config.ts     ← config Vite (Vue ou React)
├── server.ts          ← serveur avec createInertia + router choisi
├── .gitignore
└── src/
    ├── main.ts        ← (Vue) ou main.tsx (React) — createInertiaApp
    └── pages/
        └── Home.vue   ← (ou Home.tsx pour React)
```

### Exemple de sortie

```
╔══════════════════════════════════════╗
║   deno-inertia — Nouveau projet 🦕    ║
╚══════════════════════════════════════╝

? Nom du projet › mon-app
? Frontend › Vue 3 (Composition API + SFC)
? Router Deno › Hono — léger, TypeScript-first (recommandé)

  ✅ deno.json
  ✅ package.json
  ✅ vite.config.ts
  ✅ server.ts
  ✅ .gitignore
  ✅ src/main.ts
  ✅ src/pages/Home.vue

✨ Projet "mon-app" créé ! (Vue 3 + Hono)

  cd mon-app
  deno task install
  deno task dev
```

---

## `dev` — Mode développement

Démarre **Vite** (`:5173`) et le **serveur Deno** (`:3000`) en parallèle.
Le serveur Deno tourne avec `--watch` pour le rechargement automatique.

```bash
inertia dev [options]
```

| Option | Défaut | Description |
|---|---|---|
| `--server` | `server.ts` | Fichier serveur Deno |
| `--vite-config` | `vite.config.ts` | Fichier config Vite |
| `--port` | `3000` | Port du serveur Deno |
| `--vite-port` | `5173` | Port du serveur Vite |

```bash
# Personnaliser les ports
inertia dev --port=8080 --vite-port=5174

# Serveur dans un sous-dossier
inertia dev --server=src/server.ts
```

---

## `build` — Compiler le frontend

Lance `vite build` pour compiler les assets dans `dist/`.

```bash
inertia build [options]
```

| Option | Défaut | Description |
|---|---|---|
| `--vite-config` | `vite.config.ts` | Fichier config Vite |

```bash
inertia build
# → dist/.vite/manifest.json
# → dist/assets/main-abc123.js
# → dist/assets/style-def456.css
```

---

## `preview` — Mode production

Démarre le serveur Deno en mode production (`PROD_MODE=1`).
Les assets sont servis depuis `dist/` via le manifest Vite.
Vite n'est **pas** démarré.

```bash
inertia preview [options]
```

| Option | Défaut | Description |
|---|---|---|
| `--server` | `server.ts` | Fichier serveur Deno |
| `--port` | `3000` | Port du serveur |

```bash
# Build puis preview
inertia build
inertia preview --port=8080
```

---

## `install` — Installer les dépendances npm

Installe les dépendances npm (Vite + frontend) en détectant automatiquement
le package manager.

```bash
inertia install
# Équivalent de : npm install / pnpm install / yarn / bun install
```

### Détection automatique du package manager

Le CLI détecte le package manager via les lockfiles présents :

| Lockfile | Package manager |
|---|---|
| `bun.lockb` | bun |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| *(aucun)* | npm |

---

## Options globales

```bash
inertia --help      # aide complète
inertia --version   # version du CLI (lue depuis deno.json)
inertia -h          # alias --help
inertia -v          # alias --version
```

> **Imports pinnés** — `init` génère un `deno.json` avec les imports JSR épinglés
> à la version exacte du CLI (ex: `jsr:@streemkit/inertia-deno@^0.1.3`),
> garantissant des installations reproductibles.

---

## Workflow complet

```bash
# 1. Créer un projet
deno run -A jsr:@streemkit/inertia-deno-cli init mon-app
cd mon-app

# 2. Installer les dépendances npm
deno task install

# 3. Développement (Vite + Deno en parallèle)
deno task dev
# → http://localhost:3000

# 4. Build pour la production
deno task build

# 5. Tester la version production
deno task preview
# → http://localhost:3000 (sans Vite, assets depuis dist/)
```
