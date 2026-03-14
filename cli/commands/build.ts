import { detectPM, execCmd } from "../pm.ts"

export async function build(args: { "vite-config"?: string }): Promise<void> {
  const viteConfig = args["vite-config"] ?? "vite.config.ts"
  const pm = await detectPM()

  console.log(`🔨 Build frontend (${pm})...\n`)

  const [cmd, ...cmdArgs] = execCmd(pm, "vite", "build", "--config", viteConfig)
  const proc = new Deno.Command(cmd, {
    args: cmdArgs,
    stdout: "inherit",
    stderr: "inherit",
  }).spawn()

  const status = await proc.status
  if (status.success) console.log("\n✅ Build terminé → dist/")
  Deno.exit(status.code)
}
