import { useState } from "react"
import { Link } from "@inertiajs/react"
import AppLayout from "../layouts/AppLayout"

interface Props {
  router: string
}

export default function Counter({ router }: Props) {
  const [count, setCount] = useState(0)

  return (
    <AppLayout>
      <div style={s.badgeRow}>
        <span style={{ ...s.badge, ...s.badgeReact }}>React 18</span>
        <span style={{ ...s.badge, ...s.badgeRouter }}>{router}</span>
      </div>
      <h1 style={s.h1}>🔢 Counter</h1>

      <div style={s.card}>
        <p style={s.hint}>État client — survit aux navigations Inertia dans la même session</p>
        <div style={s.display}>{count}</div>
        <div style={s.controls}>
          <button style={{ ...s.btn, ...s.btnDec }} onClick={() => setCount(c => c - 1)}>−</button>
          <button style={{ ...s.btn, ...s.btnReset }} onClick={() => setCount(0)}>reset</button>
          <button style={{ ...s.btn, ...s.btnInc }} onClick={() => setCount(c => c + 1)}>+</button>
        </div>
      </div>

      <p style={s.note}>
        Navigue vers <Link href="/" style={s.link}>Home</Link> puis reviens :
        le compteur sera remis à zéro (nouvelle instance de composant).
        C'est le comportement normal d'Inertia — l'état client ne persiste pas
        entre les navigations (contrairement à un contexte React persistant).
      </p>
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
                 padding: "2rem", textAlign: "center" },
  hint:        { color: "#888", fontSize: ".85rem", margin: "0 0 1.5rem" },
  display:     { fontSize: "5rem", fontWeight: 700, lineHeight: 1, marginBottom: "1.5rem", color: "#0ea5e9" },
  controls:    { display: "flex", justifyContent: "center", gap: ".75rem" },
  btn:         { width: 48, height: 48, border: "none", borderRadius: 8, fontSize: "1.4rem",
                 cursor: "pointer", fontWeight: 700 },
  btnDec:      { background: "#fee2e2", color: "#ef4444" },
  btnInc:      { background: "#dcfce7", color: "#22c55e" },
  btnReset:    { width: 72, background: "#f4f4f5", color: "#666", fontSize: ".8rem" },
  note:        { color: "#666", lineHeight: 1.7, marginTop: "1.25rem", fontSize: ".9rem" },
  link:        { color: "#0ea5e9", textDecoration: "none", fontWeight: 600 },
}
