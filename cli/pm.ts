/**
 * Détection automatique du package manager.
 *
 * Ordre de priorité : lockfile présent → sinon npm.
 *   pnpm-lock.yaml → pnpm
 *   yarn.lock      → yarn
 *   bun.lockb      → bun
 *   (défaut)       → npm
 */

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun"

interface PMInfo {
  /** Commande d'installation (ex: "npm install") */
  install: string[]
  /** Commande pour exécuter un binaire local (ex: "npx vite") */
  exec:    (bin: string, ...args: string[]) => string[]
}

const INFO: Record<PackageManager, PMInfo> = {
  npm:  {
    install: ["install"],
    exec:    (bin, ...args) => ["npx", bin, ...args],
  },
  pnpm: {
    install: ["install"],
    exec:    (bin, ...args) => ["pnpm", "exec", bin, ...args],
  },
  yarn: {
    install: [],              // `yarn` sans sous-commande = install
    exec:    (bin, ...args) => ["yarn", bin, ...args],
  },
  bun:  {
    install: ["install"],
    exec:    (bin, ...args) => ["bunx", bin, ...args],
  },
}

/** Détecte le package manager à partir des lockfiles présents dans cwd. */
export async function detectPM(cwd = Deno.cwd()): Promise<PackageManager> {
  const checks: [string, PackageManager][] = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock",      "yarn"],
    ["bun.lockb",      "bun"],
  ]
  for (const [file, pm] of checks) {
    try {
      await Deno.stat(`${cwd}/${file}`)
      return pm
    } catch { /* absent */ }
  }
  return "npm"
}

/**
 * Retourne la commande + args pour installer les dépendances.
 *
 * @example
 *   const [cmd, ...args] = installCmd("pnpm")
 *   // → ["pnpm", "install"]
 */
export function installCmd(pm: PackageManager): string[] {
  const isWin = Deno.build.os === "windows"
  const bin   = isWin && pm !== "bun" ? `${pm}.cmd` : pm
  return [bin, ...INFO[pm].install]
}

/**
 * Retourne la commande + args pour exécuter un binaire local.
 *
 * @example
 *   const [cmd, ...args] = execCmd("pnpm", "vite", "--port", "5173")
 *   // → ["pnpm", "exec", "vite", "--port", "5173"]
 */
export function execCmd(pm: PackageManager, bin: string, ...args: string[]): string[] {
  const isWin = Deno.build.os === "windows"
  const parts = INFO[pm].exec(bin, ...args)

  // Sur Windows : cmd.exe pour npm et pnpm, pas pour bunx/yarn
  if (isWin && (pm === "npm" || pm === "pnpm")) {
    parts[0] = `${parts[0]}.cmd`
  }
  return parts
}
