import { Link } from "@inertiajs/react"
import AppLayout from "../layouts/AppLayout"

interface Props {
  message: string
  router: string
}

export default function Home({ message, router }: Props) {
  return (
    <AppLayout>
      <div style={s.hero}>
        <div style={s.badgeRow}>
          <span style={{ ...s.badge, ...s.badgeReact }}>React 18</span>
          <span style={{ ...s.badge, ...s.badgeRouter }}>{router}</span>
        </div>
        <h1 style={s.h1}>🏠 Home</h1>
        <p style={s.lead}>{message}</p>
        <p style={s.desc}>
          Cette page est rendue via <code style={s.code}>deno-inertia</code>.
          Lors du premier chargement, le serveur Deno retourne le HTML complet.
          Les navigations suivantes utilisent le protocole Inertia
          (JSON + header <code style={s.code}>X-Inertia: true</code>).
        </p>
        <div style={s.actions}>
          <Link href="/about" style={{ ...s.btn, ...s.btnPrimary }}>À propos →</Link>
          <Link href="/counter" style={{ ...s.btn, ...s.btnSecondary }}>Counter (état client) →</Link>
        </div>
      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  hero:        { textAlign: "center", paddingTop: "2rem" },
  badgeRow:    { display: "flex", justifyContent: "center", gap: ".5rem", marginBottom: "1.2rem" },
  badge:       { padding: ".25rem .75rem", borderRadius: 99, fontSize: ".75rem", fontWeight: 600 },
  badgeReact:  { background: "#61dafb20", color: "#0ea5e9", border: "1px solid #61dafb40" },
  badgeRouter: { background: "#6366f120", color: "#6366f1", border: "1px solid #6366f140" },
  h1:          { fontSize: "2.8rem", margin: "0 0 .75rem" },
  lead:        { fontSize: "1.25rem", color: "#555", marginBottom: "1rem" },
  desc:        { color: "#666", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 2rem" },
  code:        { background: "#f0f0f0", padding: ".1rem .35rem", borderRadius: 4, fontSize: ".88em" },
  actions:     { display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" },
  btn:         { display: "inline-block", padding: ".7rem 1.6rem", borderRadius: 8,
                 textDecoration: "none", fontWeight: 600 },
  btnPrimary:  { background: "#0ea5e9", color: "#fff" },
  btnSecondary:{ background: "#f4f4f5", color: "#333" },
}

