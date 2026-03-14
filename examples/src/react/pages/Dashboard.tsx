import { Deferred, router } from "@inertiajs/react"
import AppLayout from "../layouts/AppLayout"

interface Stats     { totalUsers: number; revenue: number; activeNow: number }
interface Post      { title: string; views: number }
interface ChartData { labels: string[]; data: number[] }
interface Activity  { id: number; text: string; time: string }

interface Props {
  router:    string
  stats?:    Stats
  topPosts?: Post[]
  chart?:    ChartData
  activity?: Activity[]
}

export default function Dashboard({ router: routerName, stats, topPosts, chart, activity }: Props) {
  return (
    <AppLayout>
      <div style={s.header}>
        <div style={s.badges}>
          <span style={{ ...s.badge, ...s.badgeReact }}>React 18</span>
          <span style={{ ...s.badge, ...s.badgeRouter }}>{routerName}</span>
        </div>
        <h1 style={s.h1}>📊 Dashboard</h1>
        <p style={s.subtitle}>
          Démo <code style={s.code}>defer()</code> (Inertia v2) et{" "}
          <code style={s.code}>lazy()</code> (partial reload manuel).
        </p>
      </div>

      <div style={s.grid}>
        {/* Stats: deferred (groupe "default") */}
        <div style={s.card}>
          <h3 style={s.h3}>Stats <code style={s.tag}>defer()</code></h3>
          <p style={s.hint}>Chargées automatiquement après le 1ᵉʳ rendu (groupe "default").</p>
          <Deferred data="stats" fallback={<Skeletons />}>
            {/* En React le JSX children est évalué avant que Deferred puisse
                le masquer — on garde le guard stats && pour éviter le crash */}
            {stats && (
              <div style={s.statsGrid}>
                <StatRow val={stats.totalUsers.toLocaleString("fr")} label="👥 Utilisateurs" />
                <StatRow val={`${stats.revenue.toLocaleString("fr")}€`}  label="💰 Revenu" />
                <StatRow val={String(stats.activeNow)} label="🟢 Actifs" />
              </div>
            )}
          </Deferred>
        </div>

        {/* Top posts: deferred (groupe "sidebar") */}
        <div style={s.card}>
          <h3 style={s.h3}>Top posts <code style={s.tag}>defer("sidebar")</code></h3>
          <p style={s.hint}>Groupe distinct — fetché en parallèle des stats.</p>
          <Deferred data="topPosts" fallback={<Skeletons />}>
            {topPosts && (
              <ul style={{ margin: 0, padding: 0 }}>
                {topPosts.map((post) => (
                  <li key={post.title} style={s.postItem}>
                    <span style={s.postTitle}>{post.title}</span>
                    <span style={s.postViews}>{post.views.toLocaleString("fr")} vues</span>
                  </li>
                ))}
              </ul>
            )}
          </Deferred>
        </div>
      </div>

      {/* Activity: merge (accumulation client) */}
      <div style={s.card}>
        <h3 style={s.h3}>Activité <code style={s.tag}>merge()</code></h3>
        <p style={s.hint}>
          Toujours incluse dans la réponse, mais le client Inertia v2{" "}
          <strong>accumule</strong> les nouvelles valeurs au lieu de remplacer.
          Idéal pour la pagination infinie / "load more".
        </p>
        <ul style={{ margin: 0, padding: 0 }}>
          {(activity ?? []).map((item) => (
            <li key={item.id} style={s.activityItem}>
              <span style={{ fontWeight: 500 }}>{item.text}</span>
              <span style={s.activityTime}>{item.time}</span>
            </li>
          ))}
        </ul>
        <button style={s.btnMore} onClick={() => router.reload({ only: ["activity"] })}>
          + Charger plus (merge)
        </button>
      </div>

      {/* Chart: lazy (partial reload explicite) */}
      <div style={s.card}>
        <h3 style={s.h3}>Graphique <code style={s.tag}>lazy()</code></h3>
        <p style={s.hint}>
          Non incluse dans le rendu initial ni dans les navigations SPA normales.
          Chargée uniquement via <code style={s.code}>router.reload({"{ only: ['chart'] }"})</code>.
        </p>
        {chart ? (
          <div style={s.chart}>
            {chart.data.map((val, i) => (
              <div key={i} style={s.barWrap}>
                <div style={{ ...s.bar, height: Math.round(val * 1.5) }} title={String(val)} />
                <span style={s.barLabel}>{chart.labels[i]}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={s.lazyEmpty}>
            <button style={s.btnLoad} onClick={() => router.reload({ only: ["chart"] })}>
              ⬇ Charger le graphique (lazy)
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function Skeletons() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
      {[0, 1, 2].map((i) => <div key={i} style={s.skeleton} />)}
    </div>
  )
}

function StatRow({ val, label }: { val: string; label: string }) {
  return (
    <div style={s.statRow}>
      <span style={s.statVal}>{val}</span>
      <span style={s.statKey}>{label}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  header:      { marginBottom: "2rem" },
  badges:      { display: "flex", gap: ".5rem", marginBottom: "1rem" },
  badge:       { padding: ".25rem .75rem", borderRadius: 99, fontSize: ".75rem", fontWeight: 600 },
  badgeReact:  { background: "#61dafb20", color: "#0ea5e9", border: "1px solid #61dafb40" },
  badgeRouter: { background: "#6366f120", color: "#6366f1", border: "1px solid #6366f140" },
  h1:          { fontSize: "2rem", marginBottom: ".5rem" },
  subtitle:    { color: "#71717a" },
  code:        { background: "#f0f0f2", padding: ".1rem .35rem", borderRadius: 4, fontSize: ".85em",
                 fontFamily: "ui-monospace, monospace" },
  tag:         { fontSize: ".75em", background: "#f0f0f2", padding: ".1rem .4rem", borderRadius: 4 },
  grid:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" },
  card:        { background: "#fff", border: "1px solid #e4e4e7", borderRadius: 8,
                 padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.08)", marginBottom: "1rem" },
  h3:          { fontSize: "1rem", margin: "0 0 .4rem" },
  hint:        { fontSize: ".8rem", color: "#71717a", margin: "0 0 1rem" },

  skeleton:    { height: 36, borderRadius: 6, background: "#f0f0f2" },

  statsGrid:   { display: "flex", flexDirection: "column", gap: ".75rem" },
  statRow:     { display: "flex", justifyContent: "space-between", alignItems: "center",
                 padding: ".75rem", background: "#f8f8f9", borderRadius: 6 },
  statVal:     { fontSize: "1.4rem", fontWeight: 700, color: "#6366f1" },
  statKey:     { fontSize: ".8rem", color: "#71717a" },

  postItem:    { display: "flex", justifyContent: "space-between", padding: ".6rem",
                 background: "#f8f8f9", borderRadius: 6, fontSize: ".875rem",
                 listStyle: "none", marginBottom: ".5rem" },
  postTitle:   { fontWeight: 500 },
  postViews:   { color: "#71717a", fontSize: ".8rem" },

  chart:       { display: "flex", alignItems: "flex-end", gap: ".75rem", height: 180, paddingTop: ".5rem" },
  barWrap:     { display: "flex", flexDirection: "column", alignItems: "center", gap: ".4rem", flex: 1 },
  bar:         { width: "100%", background: "#6366f1", borderRadius: "4px 4px 0 0", minHeight: 4 },
  barLabel:    { fontSize: ".75rem", color: "#71717a" },

  activityItem: { display: "flex", justifyContent: "space-between", padding: ".6rem",
                  background: "#f8f8f9", borderRadius: 6, fontSize: ".875rem",
                  listStyle: "none", marginBottom: ".5rem" },
  activityTime: { color: "#71717a", fontSize: ".8rem" },
  btnMore:      { width: "100%", padding: ".5rem 1.25rem", background: "transparent",
                  color: "#6366f1", border: "1px solid #6366f1", borderRadius: 8,
                  fontSize: ".875rem", fontWeight: 600, cursor: "pointer" },

  lazyEmpty:   { display: "flex", justifyContent: "center", padding: "2rem 0" },
  btnLoad:     { padding: ".65rem 1.5rem", background: "#6366f1", color: "#fff",
                 border: "none", borderRadius: 8, fontSize: ".9rem", fontWeight: 600, cursor: "pointer" },
}
