import { join } from "@std/path"
import { input, select } from "../../prompt.ts"
import {
  type Router,
  type Frontend,
  type TemplateOptions,
  denoJson,
  packageJson,
  viteConfig,
  serverTs,
  mainTs,
  mainTsx,
  homeVue,
  homeTsx,
  gitignore,
} from "./templates.ts"

export async function init(nameArg?: string): Promise<void> {
  console.log(`
╔══════════════════════════════════════╗
║   deno-inertia — Nouveau projet 🦕    ║
╚══════════════════════════════════════╝
`)

  // ---- Questions ----
  let name = (nameArg ?? await input("Nom du projet", "my-inertia-app"))
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()

  // Valider : lettres minuscules, chiffres, tirets uniquement (compatible npm + dossier)
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    console.error(`\n❌ Nom invalide : "${name}"\n   Utilisez uniquement des lettres minuscules, chiffres et tirets (ex: my-app)\n`)
    Deno.exit(1)
  }

  const frontend = await select<Frontend>("Frontend", [
    { label: "Vue 3   (Composition API + SFC)", value: "vue" },
    { label: "React 18 (hooks + TSX)",           value: "react" },
  ])

  const router = await select<Router>("Router Deno", [
    { label: "Hono  — léger, TypeScript-first (recommandé)", value: "hono" },
    { label: "Oak   — middleware Express-like",               value: "oak" },
    { label: "std   — built-in, zéro dépendance",            value: "std" },
  ])

  const opts: TemplateOptions = { name, router, frontend }

  // ---- Création du répertoire ----
  const dir = join(Deno.cwd(), name)

  // Vérifier si le dossier existe déjà
  try {
    await Deno.stat(dir)
    console.error(`\n❌ Le dossier "${name}" existe déjà.\n   Supprimez-le ou choisissez un autre nom.\n`)
    Deno.exit(1)
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e
  }

  await Deno.mkdir(join(dir, "src", "pages"), { recursive: true })

  // ---- Fichiers à générer ----
  const files: Record<string, string> = {
    "deno.json":      denoJson(opts),
    "package.json":   packageJson(opts),
    "vite.config.ts": viteConfig(opts),
    "server.ts":      serverTs(opts),
    ".gitignore":     gitignore(),
    ...(frontend === "vue"
      ? {
          "src/main.ts":        mainTs(),
          "src/pages/Home.vue": homeVue(),
        }
      : {
          "src/main.tsx":       mainTsx(),
          "src/pages/Home.tsx": homeTsx(),
        }),
  }

  // ---- Écriture ----
  console.log()
  for (const [relPath, content] of Object.entries(files)) {
    await Deno.writeTextFile(join(dir, relPath), content)
    console.log(`  ✅ ${relPath}`)
  }

  // ---- Instructions ----
  const feName   = frontend === "vue" ? "Vue 3" : "React 18"
  const rtName   = { hono: "Hono", oak: "Oak", std: "std/http" }[router]
  const devEntry = frontend === "vue" ? "src/main.ts" : "src/main.tsx"

  console.log(`
✨ Projet "${name}" créé ! (${feName} + ${rtName})

  cd ${name}
  deno task install     # npm install — Vite + ${feName}
  deno task dev         # démarre Vite + serveur Deno en parallèle
  deno task build       # compile ${devEntry} → dist/
  deno task preview     # serveur prod sans Vite

Docs : https://jsr.io/@streemkit/inertia-deno
`)
}
