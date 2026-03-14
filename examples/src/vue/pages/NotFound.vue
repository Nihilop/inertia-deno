<script setup lang="ts">
import { Link } from "@inertiajs/vue3"
import AppLayout from "../layouts/AppLayout.vue"

defineProps<{ router?: string }>()
</script>

<template>
  <AppLayout>
    <div class="container">
      <div class="code">404</div>
      <h1>Page introuvable</h1>
      <p>Cette page n'existe pas ou a été déplacée.</p>
      <Link href="/" class="btn">← Retour à l'accueil</Link>
    </div>
  </AppLayout>
</template>

<style scoped>
.container {
  text-align: center;
  padding: 4rem 1rem;
}
.code {
  font-size: 7rem;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, var(--primary), #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: .5rem;
}
h1 { font-size: 1.75rem; margin-bottom: .75rem; }
p  { color: var(--muted); margin-bottom: 2rem; }
.btn {
  display: inline-block;
  padding: .7rem 1.6rem;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius);
  text-decoration: none;
  font-weight: 600;
  transition: background .15s;
}
.btn:hover { background: var(--primary-h); }
</style>
