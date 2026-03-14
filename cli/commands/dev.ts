import { detectPM, execCmd, installCmd } from "../pm.ts"

export interface DevArgs {
  server?: string
  "vite-config"?: string
  port?: string
  "vite-port"?: string
}

export async function dev(args: DevArgs): Promise<void> {
  const serverFile = args.server         ?? "server.ts"
  const viteConfig = args["vite-config"] ?? "vite.config.ts"
  const port       = args.port           ?? "3000"
  const vitePort   = args["vite-port"]   ?? "5173"

  const pm = await detectPM()

  // Vérification node_modules
  try {
    await Deno.stat("node_modules")
  } catch {
    const [cmd, ...cmdArgs] = installCmd(pm)
    console.warn(`⚠️  node_modules introuvable. Lancez d'abord : ${cmd} ${cmdArgs.join(" ")}\n`)
  }

  console.log(`
╔══════════════════════════════════════╗
║   deno-inertia — dev    (${pm.padEnd(4)})      ║
╠══════════════════════════════════════╣
║  Serveur : http://localhost:${port.padEnd(5)}    ║
║  Vite    : http://localhost:${vitePort.padEnd(5)}    ║
╚══════════════════════════════════════╝
`)

  const procs: Deno.ChildProcess[] = []

  // ---- Vite ----
  const [viteCmd, ...viteArgs] = execCmd(pm, "vite", "--config", viteConfig, "--port", vitePort)
  const viteProc = new Deno.Command(viteCmd, {
    args: viteArgs,
    stdout: "inherit",
    stderr: "inherit",
  }).spawn()
  procs.push(viteProc)

  // Laisse Vite démarrer
  await new Promise((r) => setTimeout(r, 1500))

  // ---- Serveur Deno (--watch) ----
  const serverProc = new Deno.Command("deno", {
    args: ["run", "-A", "--watch", serverFile],
    env: {
      ...Deno.env.toObject(),
      PORT:      port,
      VITE_URL:  `http://localhost:${vitePort}`,
      PROD_MODE: "0",
    },
    stdout: "inherit",
    stderr: "inherit",
  }).spawn()
  procs.push(serverProc)

  // ---- Cleanup CTRL+C ----
  const isWin = Deno.build.os === "windows"
  const cleanup = () => {
    for (const p of procs) {
      try { p.kill("SIGTERM") } catch { /* already gone */ }
    }
    Deno.exit(0)
  }
  Deno.addSignalListener("SIGINT", cleanup)
  if (!isWin) Deno.addSignalListener("SIGTERM", cleanup)

  await Promise.all(procs.map((p) => p.status))
}
