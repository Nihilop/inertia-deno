import { Link, usePage } from "@inertiajs/react"
import type { ReactNode } from "react"

interface SharedProps {
  auth?: { user: { name: string } | null }
  flash?: { success?: string; error?: string; info?: string } | null
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { props } = usePage<SharedProps>()
  const flash = props.flash
  const user  = props.auth?.user ?? null

  return (
    <div>
      <nav style={s.navbar}>
        <Link href="/" style={s.logo}>🦕 deno-inertia</Link>
        <div style={s.links}>
          {(["Home", "About", "Counter", "Form", "Dashboard"] as const).map((label) => (
            <Link key={label} href={`/${label === "Home" ? "" : label.toLowerCase()}`} style={s.link}>
              {label}
            </Link>
          ))}
        </div>
        <div>
          <span style={{ ...s.pill, ...(user ? {} : s.pillGuest) }}>
            {user ? `👤 ${user.name}` : "Invité"}
          </span>
        </div>
      </nav>

      {flash?.success && <div style={{ ...s.flash, ...s.flashSuccess }}>✅ {flash.success}</div>}
      {flash?.error   && <div style={{ ...s.flash, ...s.flashError }}>❌ {flash.error}</div>}
      {flash?.info    && <div style={{ ...s.flash, ...s.flashInfo }}>ℹ️ {flash.info}</div>}

      <div style={s.content}>{children}</div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  navbar:       { display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: ".8rem 2rem", background: "#18181b",
                  position: "sticky", top: 0, zIndex: 10, gap: "1rem" },
  logo:         { fontWeight: 700, fontSize: "1.05rem", color: "#fff", textDecoration: "none", flexShrink: 0 },
  links:        { display: "flex", gap: "1.25rem", flex: 1, justifyContent: "center" },
  link:         { color: "#a1a1aa", textDecoration: "none", fontSize: ".875rem" },
  pill:         { fontSize: ".75rem", padding: ".25rem .65rem", borderRadius: 99,
                  background: "#27272a", color: "#d4d4d8" },
  pillGuest:    { color: "#52525b" },
  flash:        { padding: ".75rem 2rem", fontSize: ".875rem", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: ".5rem" },
  flashSuccess: { background: "#dcfce7", color: "#166534", borderBottom: "1px solid #bbf7d0" },
  flashError:   { background: "#fee2e2", color: "#991b1b", borderBottom: "1px solid #fecaca" },
  flashInfo:    { background: "#dbeafe", color: "#1e40af", borderBottom: "1px solid #bfdbfe" },
  content:      { maxWidth: 780, margin: "0 auto", padding: "3rem 1.5rem" },
}
