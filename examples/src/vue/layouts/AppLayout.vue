<script setup lang="ts">
import { Link, usePage } from "@inertiajs/vue3"
import { computed } from "vue"

const page = usePage<{
  auth?: { user: { name: string } | null }
  flash?: { success?: string; error?: string; info?: string } | null
}>()

const flash = computed(() => page.props.flash)
const user  = computed(() => page.props.auth?.user ?? null)
</script>

<template>
  <div class="app">
    <nav class="navbar">
      <Link href="/" class="nav-logo">🦕 deno-inertia</Link>
      <div class="nav-links">
        <Link href="/" class="nav-link">Home</Link>
        <Link href="/about" class="nav-link">About</Link>
        <Link href="/counter" class="nav-link">Counter</Link>
        <Link href="/form" class="nav-link">Form</Link>
        <Link href="/dashboard" class="nav-link">Dashboard</Link>
      </div>
      <div class="nav-user">
        <span v-if="user" class="user-pill">👤 {{ user.name }}</span>
        <span v-else class="user-pill guest">Invité</span>
      </div>
    </nav>

    <!-- Flash messages -->
    <div v-if="flash?.success" class="flash flash-success">✅ {{ flash.success }}</div>
    <div v-if="flash?.error"   class="flash flash-error">  ❌ {{ flash.error }}</div>
    <div v-if="flash?.info"    class="flash flash-info">   ℹ️  {{ flash.info }}</div>

    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.app     { min-height: 100vh; }

.navbar  {
  display: flex; align-items: center; justify-content: space-between;
  padding: .8rem 2rem; background: #18181b;
  position: sticky; top: 0; z-index: 10;
  gap: 1rem;
}
.nav-logo  { font-weight: 700; font-size: 1.05rem; color: #fff; text-decoration: none; flex-shrink: 0; }
.nav-links { display: flex; gap: 1.25rem; flex: 1; justify-content: center; }
.nav-link  { color: #a1a1aa; text-decoration: none; font-size: .875rem; transition: color .15s; }
.nav-link:hover { color: #fff; }
.nav-user  { flex-shrink: 0; }
.user-pill {
  font-size: .75rem; padding: .25rem .65rem; border-radius: 99px;
  background: #27272a; color: #d4d4d8;
}
.user-pill.guest { color: #52525b; }

.flash {
  padding: .75rem 2rem; font-size: .875rem; font-weight: 500;
  display: flex; align-items: center; gap: .5rem;
}
.flash-success { background: #dcfce7; color: #166534; border-bottom: 1px solid #bbf7d0; }
.flash-error   { background: #fee2e2; color: #991b1b; border-bottom: 1px solid #fecaca; }
.flash-info    { background: #dbeafe; color: #1e40af; border-bottom: 1px solid #bfdbfe; }

.content { max-width: 780px; margin: 0 auto; padding: 3rem 1.5rem; }
</style>
