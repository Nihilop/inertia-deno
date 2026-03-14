import { Link } from "@inertiajs/react"
import AppLayout from "../layouts/AppLayout"

export default function NotFound() {
  return (
    <AppLayout>
      <div style={s.container}>
        <div style={s.code}>404</div>
        <h1 style={s.h1}>Page introuvable</h1>
        <p style={s.p}>Cette page n'existe pas ou a été déplacée.</p>
        <Link href="/" style={s.btn}>← Retour à l'accueil</Link>
      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  container: { textAlign: "center", padding: "4rem 1rem" },
  code: {
    fontSize: "7rem", fontWeight: 900, lineHeight: 1,
    background: "linear-gradient(135deg, #6366f1, #a855f7)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", marginBottom: ".5rem",
    display: "block",
  },
  h1:  { fontSize: "1.75rem", margin: "0 0 .75rem" },
  p:   { color: "#71717a", marginBottom: "2rem" },
  btn: {
    display: "inline-block", padding: ".7rem 1.6rem",
    background: "#6366f1", color: "#fff", borderRadius: 8,
    textDecoration: "none", fontWeight: 600,
  },
}
