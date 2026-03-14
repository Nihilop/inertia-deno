<script setup lang="ts">
import { Link } from "@inertiajs/vue3"
import AppLayout from "../layouts/AppLayout.vue"

defineProps<{
  message: string
  router: string
}>()
</script>

<template>
  <AppLayout>
    <div class="hero">
      <div class="badge-row">
        <span class="badge vue">Vue 3</span>
        <span class="badge router">{{ router }}</span>
      </div>
      <h1>🏠 Home</h1>
      <p class="lead">{{ message }}</p>
      <p class="desc">
        Cette page est rendue via <code>deno-inertia</code>.
        Lors du premier chargement, le serveur Deno retourne le HTML complet.
        Les navigations suivantes utilisent le protocole Inertia
        (JSON + header <code>X-Inertia: true</code>).
      </p>
      <div class="actions">
        <Link href="/about" class="btn primary">À propos →</Link>
        <Link href="/counter" class="btn secondary">Counter (état client) →</Link>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.hero      { text-align: center; padding-top: 2rem; }
.badge-row { display: flex; justify-content: center; gap: .5rem; margin-bottom: 1.2rem; }
.badge     { padding: .25rem .75rem; border-radius: 99px; font-size: .75rem; font-weight: 600; }
.badge.vue    { background: #42b88320; color: #42b883; border: 1px solid #42b88340; }
.badge.router { background: #6366f120; color: #6366f1; border: 1px solid #6366f140; }
h1         { font-size: 2.8rem; margin: 0 0 .75rem; }
.lead      { font-size: 1.25rem; color: #555; margin-bottom: 1rem; }
.desc      { color: #666; line-height: 1.7; max-width: 520px; margin: 0 auto 2rem; }
code       { background: #f0f0f0; padding: .1rem .35rem; border-radius: 4px; font-size: .88em; }
.actions   { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; }
.btn       { display: inline-block; padding: .7rem 1.6rem; border-radius: 8px;
             text-decoration: none; font-weight: 600; transition: all .15s; }
.btn.primary   { background: #42b883; color: #fff; }
.btn.primary:hover { background: #369e6b; }
.btn.secondary { background: #f4f4f5; color: #333; }
.btn.secondary:hover { background: #e4e4e7; }
</style>
