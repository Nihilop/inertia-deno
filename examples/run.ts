/**
 * run.ts — Lance Vite (dev) ET le serveur Deno en parallèle.
 * En mode prod (--mode=prod), ne lance que le serveur Deno.
 *
 * Usage :
 *   deno run -A run.ts --router=hono --frontend=vue
 *   deno run -A run.ts --router=std  --frontend=react --mode=prod
 */

// ---- Parse args ----
const flags = Object.fromEntries(
  Deno.args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.slice(2).split("=")
      return [k, v ?? "true"]
    }),
) as Record<string, string>

const router    = flags.router    ?? "hono"
const frontend  = flags.frontend  ?? "vue"
const mode      = flags.mode      ?? "dev"      // "dev" | "prod"
const vitePort  = Number(flags["vite-port"] ?? 5173)
const appPort   = Number(flags["port"]      ?? 3000)
const isProd    = mode === "prod"

const ROUTERS   = ["hono", "oak", "std"]
const FRONTENDS = ["vue", "react"]

if (!ROUTERS.includes(router)) {
  console.error(`❌  Router inconnu: "${router}". Valeurs: ${ROUTERS.join(", ")}`)
  Deno.exit(1)
}
if (!FRONTENDS.includes(frontend)) {
  console.error(`❌  Frontend inconnu: "${frontend}". Valeurs: ${FRONTENDS.join(", ")}`)
  Deno.exit(1)
}

const cwd      = import.meta.dirname!
const isWin    = Deno.build.os === "windows"
const npx      = isWin ? "npx.cmd" : "npx"

console.log(`
╔═══════════════════════════════════════╗
║       deno-inertia  dev runner        ║
╠═══════════════════════════════════════╣
║  Mode     : ${mode.padEnd(26)}║
║  Router   : ${router.padEnd(26)}║
║  Frontend : ${frontend.padEnd(26)}║
${isProd
  ? `║  App      : http://localhost:${String(appPort).padEnd(14)}║`
  : `║  Vite     : http://localhost:${String(vitePort).padEnd(14)}║
║  App      : http://localhost:${String(appPort).padEnd(14)}║`}
╚═══════════════════════════════════════╝
`)

const procs: Deno.ChildProcess[] = []

// ---- Spawn Vite (dev uniquement) ----
if (!isProd) {
  const viteConfig = `vite.${frontend}.config.ts`
  const viteProc = new Deno.Command(npx, {
    args: ["vite", "--config", viteConfig, "--port", String(vitePort)],
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  }).spawn()
  procs.push(viteProc)
  // Laisse Vite démarrer
  await new Promise((r) => setTimeout(r, 1800))
}

// ---- Env vars pour le serveur Deno ----
const serverEnv: Record<string, string> = {
  ...Deno.env.toObject(),
  FRONTEND:  frontend,
  PORT:      String(appPort),
  VITE_URL:  `http://localhost:${vitePort}`,
  PROD_MODE: isProd ? "1" : "0",
}

// En mode prod, on pointe sur le dist compilé
if (isProd) {
  serverEnv.VITE_MANIFEST = `dist/${frontend}/.vite/manifest.json`
  serverEnv.ASSETS_BASE   = `/assets/`
}

// ---- Spawn serveur Deno (watch en dev seulement) ----
const useWatch = !isProd
const serverArgs = ["run", "-A", ...(useWatch ? ["--watch"] : []), `${router}/server.ts`]
const serverProc = new Deno.Command("deno", {
  args: serverArgs,
  cwd,
  env: serverEnv,
  stdout: "inherit",
  stderr: "inherit",
}).spawn()
procs.push(serverProc)

// ---- Cleanup CTRL+C ----
const cleanup = () => {
  for (const p of procs) {
    try { p.kill("SIGTERM") } catch { /* déjà mort */ }
  }
  Deno.exit(0)
}

Deno.addSignalListener("SIGINT", cleanup)
if (!isWin) Deno.addSignalListener("SIGTERM", cleanup)

await Promise.all(procs.map((p) => p.status))
