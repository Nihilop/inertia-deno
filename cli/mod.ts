/**
 * @deno-inertia/cli — CLI pour deno-inertia
 *
 * Usage global :
 *   deno install -g -A jsr:@deno-inertia/cli -n inertia
 *   inertia init mon-projet
 *   inertia dev
 *
 * Usage via deno task (sans install global) :
 *   # deno.json → "dev": "deno run -A jsr:@deno-inertia/cli dev"
 *   deno task dev
 */

import { parseArgs } from "@std/cli/parse-args"
import { dev }     from "./commands/dev.ts"
import { build }   from "./commands/build.ts"
import { preview } from "./commands/preview.ts"
import { init }    from "./commands/init/index.ts"
import { detectPM, installCmd } from "./pm.ts"

const HELP = `
deno-inertia — CLI pour @deno-inertia/core

Usage:
  inertia <commande> [options]
  deno run -A jsr:@deno-inertia/cli <commande> [options]

Commandes:
  init [nom]   Créer un nouveau projet (wizard interactif)
  dev          Démarrer en mode développement (Vite + serveur Deno)
  build        Compiler les assets frontend  (vite build)
  preview      Démarrer en mode production   (sans Vite)
  install      Installer les dépendances npm (node_modules)

Options communes:
  --server       Fichier serveur Deno     [défaut: server.ts]
  --vite-config  Config Vite              [défaut: vite.config.ts]
  --port         Port du serveur Deno     [défaut: 3000]
  --vite-port    Port du serveur Vite     [défaut: 5173]
  -h, --help     Affiche cette aide
  -v, --version  Affiche la version

Exemples:
  inertia init mon-app
  inertia dev --port=8080
  inertia dev --server=src/server.ts --vite-config=vite.config.ts
  inertia build
  inertia preview --port=8080
`

const args = parseArgs(Deno.args, {
  string:  ["server", "vite-config", "port", "vite-port"],
  boolean: ["help", "version"],
  alias:   { h: "help", v: "version" },
  default: {
    server:       "server.ts",
    "vite-config": "vite.config.ts",
    port:          "3000",
    "vite-port":   "5173",
  },
})

if (args.version) {
  console.log("@deno-inertia/cli 0.1.0")
  Deno.exit(0)
}

const [command, ...rest] = args._ as string[]

if (args.help || !command) {
  console.log(HELP)
  Deno.exit(args.help ? 0 : 1)
}

switch (command) {
  case "init":
    await init(rest[0])
    break

  case "dev":
    await dev(args)
    break

  case "build":
    await build(args)
    break

  case "preview":
    await preview(args)
    break

  case "install": {
    const pm = await detectPM()
    const [cmd, ...cmdArgs] = installCmd(pm)
    console.log(`📦 ${cmd} ${cmdArgs.join(" ")}...\n`)
    const proc   = new Deno.Command(cmd, { args: cmdArgs, stdout: "inherit", stderr: "inherit" }).spawn()
    const status = await proc.status
    Deno.exit(status.code)
    break
  }

  default:
    console.error(`Commande inconnue : "${command}"\nUtilisez --help pour la liste des commandes.`)
    Deno.exit(1)
}
