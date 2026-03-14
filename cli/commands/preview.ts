export async function preview(args: { server?: string; port?: string }): Promise<void> {
  const serverFile = args.server ?? "server.ts"
  const port       = args.port   ?? "3000"
  const isWin      = Deno.build.os === "windows"

  // Vérification du dist/
  try {
    await Deno.stat("dist")
  } catch {
    console.warn("⚠️  dist/ introuvable. Lancez d'abord : deno task build\n")
  }

  console.log(`🚀 Preview → http://localhost:${port}\n`)

  const proc = new Deno.Command("deno", {
    args: ["run", "-A", serverFile],
    env: {
      ...Deno.env.toObject(),
      PORT:      port,
      PROD_MODE: "1",
    },
    stdout: "inherit",
    stderr: "inherit",
  }).spawn()

  const cleanup = () => {
    try { proc.kill("SIGTERM") } catch { /* already gone */ }
    Deno.exit(0)
  }
  Deno.addSignalListener("SIGINT", cleanup)
  if (!isWin) Deno.addSignalListener("SIGTERM", cleanup)

  await proc.status
}
