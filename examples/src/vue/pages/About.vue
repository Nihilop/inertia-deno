<script setup lang="ts">
import { Link } from "@inertiajs/vue3"
import AppLayout from "../layouts/AppLayout.vue"

defineProps<{
  title: string
  router: string
}>()
</script>

<template>
  <AppLayout>
    <div class="badge-row">
      <span class="badge vue">Vue 3</span>
      <span class="badge router">{{ router }}</span>
    </div>
    <h1>{{ title }}</h1>

    <div class="card">
      <h2>Le protocole Inertia en action</h2>
      <p>
        Cette page a été chargée <strong>sans rechargement complet</strong>.
        Ouvre l'onglet Réseau de ton navigateur et clique entre Home et About :
        tu verras des requêtes <code>fetch()</code> avec l'en-tête
        <code>X-Inertia: true</code>, auxquelles le serveur répond en JSON.
      </p>
    </div>

    <div class="card">
      <h2>Architecture de deno-inertia</h2>
      <ul>
        <li><code>createInertia()</code> — factory router-agnostique</li>
        <li><code>(Request) → Response</code> — Web API standard uniquement</li>
        <li>Vite reste un outil de build/dev ; zéro Node en runtime</li>
        <li>Le client <code>@inertiajs/vue3</code> est réutilisé tel quel</li>
      </ul>
    </div>

    <Link href="/" class="btn">← Retour Home</Link>
  </AppLayout>
</template>

<style scoped>
.badge-row { display: flex; gap: .5rem; margin-bottom: 1.2rem; }
.badge     { padding: .25rem .75rem; border-radius: 99px; font-size: .75rem; font-weight: 600; }
.badge.vue    { background: #42b88320; color: #42b883; border: 1px solid #42b88340; }
.badge.router { background: #6366f120; color: #6366f1; border: 1px solid #6366f140; }
h1         { font-size: 2.2rem; margin: 0 0 1.5rem; }
.card      { background: #fff; border: 1px solid #e4e4e7; border-radius: 10px;
             padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
.card h2   { margin: 0 0 .6rem; font-size: 1.05rem; }
.card p, .card li { color: #555; line-height: 1.7; }
.card ul   { margin: 0; padding-left: 1.2rem; }
.card li   { margin-bottom: .25rem; }
code       { background: #f0f0f0; padding: .1rem .35rem; border-radius: 4px; font-size: .85em; }
.btn       { display: inline-block; margin-top: 1rem; padding: .7rem 1.6rem;
             background: #18181b; color: #fff; border-radius: 8px;
             text-decoration: none; font-weight: 600; transition: background .15s; }
.btn:hover { background: #42b883; }
</style>
