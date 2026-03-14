<script setup lang="ts">
import { useForm } from "@inertiajs/vue3"
import AppLayout from "../layouts/AppLayout.vue"

defineProps<{
  router: string
  errors?: Record<string, string>
}>()

const form = useForm({
  name:    "",
  email:   "",
  message: "",
})

const submit = () => form.post("/form", { errorBag: "contact" })
</script>

<template>
  <AppLayout>
    <div class="page-header">
      <h1>📬 Formulaire</h1>
      <p class="subtitle">
        Démo <code>useForm</code> d'Inertia — POST géré côté serveur Deno,
        validation, flash message et redirection SPA.
      </p>
    </div>

    <form class="card" @submit.prevent="submit">
      <!-- Nom -->
      <div class="field" :class="{ error: form.errors.name }">
        <label>Nom <span class="required">*</span></label>
        <input v-model="form.name" type="text" placeholder="Jean Dupont" />
        <span v-if="form.errors.name" class="error-msg">{{ form.errors.name }}</span>
      </div>

      <!-- Email -->
      <div class="field" :class="{ error: form.errors.email }">
        <label>Email <span class="required">*</span></label>
        <input v-model="form.email" type="email" placeholder="jean@example.com" />
        <span v-if="form.errors.email" class="error-msg">{{ form.errors.email }}</span>
      </div>

      <!-- Message -->
      <div class="field" :class="{ error: form.errors.message }">
        <label>Message <span class="required">*</span></label>
        <textarea v-model="form.message" rows="4" placeholder="Votre message…" />
        <span v-if="form.errors.message" class="error-msg">{{ form.errors.message }}</span>
      </div>

      <div class="form-footer">
        <span class="hint">
          <template v-if="form.processing">⏳ Envoi en cours…</template>
          <template v-else-if="form.wasSuccessful">✅ Envoyé !</template>
          <template v-else>Les champs * sont obligatoires</template>
        </span>
        <button type="submit" class="btn-submit" :disabled="form.processing">
          Envoyer →
        </button>
      </div>
    </form>

    <div class="card info-card">
      <h2>Comment ça marche ?</h2>
      <ol>
        <li>
          <code>form.post("/form", { errorBag: "contact" })</code> envoie un <code>POST</code>
          avec headers <code>X-Inertia: true</code> et <code>X-Inertia-Error-Bag: contact</code>
        </li>
        <li>
          Le serveur lit <code>X-Inertia-Error-Bag</code> via <code>renderWithErrors()</code>
          et namespaces les erreurs : <code>{ errors: { contact: { champ: "msg" } } }</code>
        </li>
        <li>Inertia extrait automatiquement <code>errors.contact</code> dans <code>form.errors</code></li>
        <li>
          En cas de succès → <code>303</code> vers <code>/form</code> + cookie flash.
          Inertia suit la redirection et rafraîchit la page.
        </li>
        <li>Le flash est lu depuis le cookie et injecté dans les shared props.</li>
      </ol>
    </div>
  </AppLayout>
</template>

<style scoped>
.page-header { margin-bottom: 2rem; }
h1 { font-size: 2rem; margin-bottom: .5rem; }
.subtitle { color: var(--muted); }

.card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 1.75rem;
  box-shadow: var(--shadow); margin-bottom: 1.25rem;
}

.field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: 1.25rem; }
.field:last-child { margin-bottom: 0; }
.field.error input, .field.error textarea { border-color: var(--danger); }

label { font-size: .875rem; font-weight: 600; color: #374151; }
.required { color: var(--danger); }

input, textarea {
  padding: .6rem .85rem; border: 1px solid var(--border); border-radius: var(--radius);
  font-size: .95rem; font-family: inherit; transition: border-color .15s, box-shadow .15s;
  background: var(--bg); color: var(--text);
}
input:focus, textarea:focus {
  outline: none; border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99,102,241,.15);
}
textarea { resize: vertical; }

.error-msg { font-size: .8rem; color: var(--danger); font-weight: 500; }

.form-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border);
}
.hint { font-size: .85rem; color: var(--muted); }

.btn-submit {
  padding: .65rem 1.5rem; background: var(--primary); color: #fff;
  border: none; border-radius: var(--radius); font-size: .95rem; font-weight: 600;
  cursor: pointer; transition: background .15s;
}
.btn-submit:hover:not(:disabled) { background: var(--primary-h); }
.btn-submit:disabled { opacity: .6; cursor: not-allowed; }

.info-card h2 { font-size: 1rem; margin-bottom: .75rem; color: #374151; }
.info-card ol { padding-left: 1.25rem; list-style: decimal; }
.info-card li { color: var(--muted); line-height: 1.8; font-size: .9rem; }
</style>
