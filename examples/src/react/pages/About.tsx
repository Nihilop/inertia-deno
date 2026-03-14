import { Link } from "@inertiajs/react"
import AppLayout from "../layouts/AppLayout"

interface Props {
  title: string
  router: string
}

export default function About({ title, router }: Props) {
  return (
    <AppLayout>
      <div style={s.badgeRow}>
        <span style={{ ...s.badge, ...s.badgeReact }}>React 18</span>
        <span style={{ ...s.badge, ...s.badgeRouter }}>{router}</span>
      </div>
      <h1 style={s.h1}>{title}</h1>

      <div style={s.card}>
        <h2 style={s.cardTitle}>Le protocole Inertia en action</h2>
        <p style={s.cardText}>
          Cette page a été chargée <strong>sans rechargement complet</strong>.
          Ouvre l'onglet Réseau de ton navigateur et clique entre Home et About :
          tu verras des requêtes <code style={s.code}>fetch()</code> avec l'en-tête{" "}
          <code style={s.code}>X-Inertia: true</code>, auxquelles le serveur répond en JSON.
        </p>
      </div>

      <div style={s.card}>
        <h2 style={s.cardTitle}>Architecture de deno-inertia</h2>
        <ul style={s.list}>
          <li><code style={s.code}>createInertia()</code> — factory router-agnostique</li>
          <li><code style={s.code}>(Request) → Response</code> — Web API standard uniquement</li>
          <li>Vite reste un outil de build/dev ; zéro Node en runtime</li>
          <li>Le client <code style={s.code}>@inertiajs/react</code> est réutilisé tel quel</li>
        </ul>
      </div>

      <Link href="/" style={s.btn}>← Retour Home</Link>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  badgeRow:    { display: "flex", gap: ".5rem", marginBottom: "1.2rem" },
  badge:       { padding: ".25rem .75rem", borderRadius: 99, fontSize: ".75rem", fontWeight: 600 },
  badgeReact:  { background: "#61dafb20", color: "#0ea5e9", border: "1px solid #61dafb40" },
  badgeRouter: { background: "#6366f120", color: "#6366f1", border: "1px solid #6366f140" },
  h1:          { fontSize: "2.2rem", margin: "0 0 1.5rem" },
  card:        { background: "#fff", border: "1px solid #e4e4e7", borderRadius: 10,
                 padding: "1.25rem 1.5rem", marginBottom: "1rem" },
  cardTitle:   { margin: "0 0 .6rem", fontSize: "1.05rem" },
  cardText:    { color: "#555", lineHeight: 1.7, margin: 0 },
  list:        { margin: 0, paddingLeft: "1.2rem", color: "#555", lineHeight: 2 },
  code:        { background: "#f0f0f0", padding: ".1rem .35rem", borderRadius: 4, fontSize: ".85em" },
  btn:         { display: "inline-block", marginTop: "1rem", padding: ".7rem 1.6rem",
                 background: "#18181b", color: "#fff", borderRadius: 8,
                 textDecoration: "none", fontWeight: 600 },
}

