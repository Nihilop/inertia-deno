<script setup lang="ts">
import { Deferred, router } from "@inertiajs/vue3"
import AppLayout from "../layouts/AppLayout.vue"

interface Stats     { totalUsers: number; revenue: number; activeNow: number }
interface Post      { title: string; views: number }
interface ChartData { labels: string[]; data: number[] }
interface Activity  { id: number; text: string; time: string }

defineProps<{
  router:    string
  stats?:    Stats
  topPosts?: Post[]
  chart?:    ChartData
  activity?: Activity[]
}>()

function loadChart() {
  router.reload({ only: ["chart"] })
}

function loadMore() {
  router.reload({ only: ["activity"] })
}
</script>

<template>
  <AppLayout>
    <div class="page-header">
      <div class="badge-row">
        <span class="badge vue">Vue 3</span>
        <span class="badge router">{{ router }}</span>
      </div>
      <h1>📊 Dashboard</h1>
      <p class="subtitle">
        Démo <code>defer()</code> (Inertia v2) et <code>lazy()</code> (partial reload manuel).
      </p>
    </div>

    <div class="grid">
      <!-- Stats: deferred (groupe "default") -->
      <div class="card">
        <h3>Stats <code class="tag">defer()</code></h3>
        <p class="hint">Chargées automatiquement après le 1ᵉʳ rendu (groupe "default").</p>
        <Deferred data="stats">
          <template #fallback>
            <div class="skeletons">
              <div class="skeleton" v-for="n in 3" :key="n" />
            </div>
          </template>
          <div class="stats-grid">
            <div class="stat">
              <span class="stat-val">{{ stats!.totalUsers.toLocaleString("fr") }}</span>
              <span class="stat-key">👥 Utilisateurs</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ stats!.revenue.toLocaleString("fr") }}€</span>
              <span class="stat-key">💰 Revenu</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ stats!.activeNow }}</span>
              <span class="stat-key">🟢 Actifs</span>
            </div>
          </div>
        </Deferred>
      </div>

      <!-- Top posts: deferred (groupe "sidebar") -->
      <div class="card">
        <h3>Top posts <code class="tag">defer("sidebar")</code></h3>
        <p class="hint">Groupe distinct — fetché en parallèle des stats.</p>
        <Deferred data="topPosts">
          <template #fallback>
            <div class="skeletons">
              <div class="skeleton" v-for="n in 3" :key="n" />
            </div>
          </template>
          <ul class="post-list">
            <li v-for="post in topPosts" :key="post.title" class="post-item">
              <span class="post-title">{{ post.title }}</span>
              <span class="post-views">{{ post.views.toLocaleString("fr") }} vues</span>
            </li>
          </ul>
        </Deferred>
      </div>
    </div>

    <!-- Activity: merge (partial reload qui accumule) -->
    <div class="card">
      <h3>Activité <code class="tag">merge()</code></h3>
      <p class="hint">
        Toujours incluse dans la réponse, mais le client Inertia v2 <strong>accumule</strong>
        les nouvelles valeurs au lieu de remplacer.
        Idéal pour la pagination infinie / "load more".
      </p>
      <ul class="activity-list">
        <li v-for="item in activity" :key="item.id" class="activity-item">
          <span class="activity-text">{{ item.text }}</span>
          <span class="activity-time">{{ item.time }}</span>
        </li>
      </ul>
      <button class="btn-more" @click="loadMore">+ Charger plus (merge)</button>
    </div>

    <!-- Chart: lazy (partial reload explicite) -->
    <div class="card">
      <h3>Graphique <code class="tag">lazy()</code></h3>
      <p class="hint">
        Non incluse dans le rendu initial ni dans les navigations SPA normales.
        Chargée uniquement via <code>router.reload({ only: ['chart'] })</code>.
      </p>
      <div v-if="chart" class="chart">
        <div v-for="(val, i) in chart.data" :key="i" class="bar-wrap">
          <div class="bar" :style="{ height: Math.round(val * 1.5) + 'px' }" :title="String(val)" />
          <span class="bar-label">{{ chart.labels[i] }}</span>
        </div>
      </div>
      <div v-else class="lazy-empty">
        <button class="btn-load" @click="loadChart">⬇ Charger le graphique (lazy)</button>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.page-header { margin-bottom: 2rem; }
h1 { font-size: 2rem; margin-bottom: .5rem; }
.subtitle { color: var(--muted); }

.badge-row { display: flex; gap: .5rem; margin-bottom: 1rem; }
.badge     { padding: .25rem .75rem; border-radius: 99px; font-size: .75rem; font-weight: 600; }
.badge.vue    { background: #42b88320; color: #42b883; border: 1px solid #42b88340; }
.badge.router { background: #6366f120; color: #6366f1; border: 1px solid #6366f140; }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }

.card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 1.5rem;
  box-shadow: var(--shadow); margin-bottom: 1rem;
}
h3    { font-size: 1rem; margin: 0 0 .4rem; }
.tag  { font-size: .75em; }
.hint { font-size: .8rem; color: var(--muted); margin-bottom: 1rem; }

/* Skeletons */
.skeletons { display: flex; flex-direction: column; gap: .5rem; }
.skeleton  {
  height: 36px; border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f2 25%, #e4e4e7 50%, #f0f0f2 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

/* Stats */
.stats-grid { display: flex; flex-direction: column; gap: .75rem; }
.stat { display: flex; justify-content: space-between; align-items: center;
        padding: .75rem; background: var(--bg); border-radius: 6px; }
.stat-val { font-size: 1.4rem; font-weight: 700; color: var(--primary); }
.stat-key { font-size: .8rem; color: var(--muted); }

/* Posts */
.post-list { display: flex; flex-direction: column; gap: .5rem; }
.post-item { display: flex; justify-content: space-between; padding: .6rem;
             background: var(--bg); border-radius: 6px; font-size: .875rem; }
.post-title { font-weight: 500; }
.post-views { color: var(--muted); font-size: .8rem; }

/* Chart */
.chart     { display: flex; align-items: flex-end; gap: .75rem; height: 180px; padding-top: .5rem; }
.bar-wrap  { display: flex; flex-direction: column; align-items: center; gap: .4rem; flex: 1; }
.bar       { width: 100%; background: var(--primary); border-radius: 4px 4px 0 0;
             transition: height .4s ease; min-height: 4px; }
.bar-label { font-size: .75rem; color: var(--muted); }

/* Activity */
.activity-list  { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }
.activity-item  { display: flex; justify-content: space-between; padding: .6rem;
                  background: var(--bg); border-radius: 6px; font-size: .875rem; }
.activity-text  { font-weight: 500; }
.activity-time  { color: var(--muted); font-size: .8rem; }
.btn-more {
  padding: .5rem 1.25rem; background: transparent; color: var(--primary);
  border: 1px solid var(--primary); border-radius: var(--radius);
  font-size: .875rem; font-weight: 600; cursor: pointer; transition: all .15s;
  width: 100%;
}
.btn-more:hover { background: var(--primary); color: #fff; }

/* Lazy */
.lazy-empty { display: flex; justify-content: center; padding: 2rem 0; }
.btn-load {
  padding: .65rem 1.5rem; background: var(--primary); color: #fff;
  border: none; border-radius: var(--radius); font-size: .9rem; font-weight: 600;
  cursor: pointer; transition: background .15s;
}
.btn-load:hover { background: var(--primary-h); }
</style>
