<script setup lang="ts">
import { ref } from "vue"
import { Link } from "@inertiajs/vue3"
import AppLayout from "../layouts/AppLayout.vue"

defineProps<{ router: string, counter: number }>()

const count = ref(0)
</script>

<template>
  <AppLayout>
    <div class="badge-row">
      <span class="badge vue">Vue 3</span>
      <span class="badge router">{{ router }}</span>
      <span class="badge router">{{ counter }}</span>
    </div>
    <h1>🔢 Counter</h1>

    <div class="card counter-card">
      <p class="hint">État client pur — réinitialisé à chaque navigation (comportement normal d'Inertia)</p>
      <div class="display">{{ count }}</div>
      <div class="controls">
        <button class="btn dec" @click="count--">−</button>
        <button class="btn reset" @click="count = 0">reset</button>
        <button class="btn inc" @click="count++">+</button>
      </div>
    </div>

    <p class="note">
      Navigue vers <Link href="/" class="link">Home</Link> puis reviens :
      le compteur sera remis à zéro (nouvelle instance de composant).
      C'est le comportement normal d'Inertia — l'état client ne persiste pas
      entre les navigations (contrairement à un store Pinia, lui persistant).
    </p>
  </AppLayout>
</template>

<style scoped>
.badge-row   { display: flex; gap: .5rem; margin-bottom: 1.2rem; }
.badge       { padding: .25rem .75rem; border-radius: 99px; font-size: .75rem; font-weight: 600; }
.badge.vue    { background: #42b88320; color: #42b883; border: 1px solid #42b88340; }
.badge.router { background: #6366f120; color: #6366f1; border: 1px solid #6366f140; }
h1           { font-size: 2.2rem; margin: 0 0 1.5rem; }
.card        { background: #fff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 2rem; }
.counter-card { text-align: center; }
.hint        { color: #888; font-size: .85rem; margin: 0 0 1.5rem; }
.display     { font-size: 5rem; font-weight: 700; line-height: 1; margin-bottom: 1.5rem; color: #42b883; }
.controls    { display: flex; justify-content: center; gap: .75rem; }
.btn         { width: 48px; height: 48px; border: none; border-radius: 8px; font-size: 1.4rem;
               cursor: pointer; font-weight: 700; transition: all .12s; }
.btn.dec     { background: #fee2e2; color: #ef4444; }
.btn.dec:hover  { background: #ef4444; color: #fff; }
.btn.inc     { background: #dcfce7; color: #22c55e; }
.btn.inc:hover  { background: #22c55e; color: #fff; }
.btn.reset   { width: 72px; background: #f4f4f5; color: #666; font-size: .8rem; }
.btn.reset:hover { background: #e4e4e7; }
.note        { color: #666; line-height: 1.7; margin-top: 1.25rem; font-size: .9rem; }
.link        { color: #42b883; text-decoration: none; font-weight: 600; }
.link:hover  { text-decoration: underline; }
</style>
