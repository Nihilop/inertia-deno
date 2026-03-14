# Flash messages

Les flash messages permettent d'afficher un message unique (succès, erreur, info)
après une redirection POST. Ils sont stockés dans un cookie HTTP-only `__flash`
avec `Max-Age=10` secondes.

```ts
import { readFlash, flashCookie, clearFlashCookie } from "deno-inertia"
```

---

## Interface `FlashMessage`

```ts
interface FlashMessage {
  success?: string
  error?:   string
  info?:    string
}
```

---

## Cycle complet

```
POST /form ──────────────────────────────────────────► Deno
                                                        ↓ flashCookie({ success: "…" })
◄── 303 redirect + Set-Cookie: __flash=…; Max-Age=10 ──

GET /dashboard (X-Inertia: true) ───────────────────► Deno
                                                        ↓ readFlash(req) dans always()
◄── JSON { props: { flash: { success: "…" } } } ──────
    Set-Cookie: __flash=; Max-Age=0 (auto-clear)
```

---

## `flashCookie(message)`

Génère la valeur d'un header `Set-Cookie` pour définir le flash.

```ts
import { flashCookie } from "deno-inertia"

app.post("/form", async (c) => {
  await processForm(await c.req.parseBody())

  return inertia.redirect("/dashboard", {
    "Set-Cookie": flashCookie({ success: "Formulaire envoyé !" }),
  })
})
```

Le cookie est créé avec :
- `HttpOnly` — inaccessible depuis JavaScript
- `SameSite=Lax` — protection CSRF
- `Path=/` — disponible sur toutes les routes
- `Max-Age=10` — expire après 10 secondes

---

## `readFlash(request)`

Lit et parse le cookie `__flash` depuis la requête entrante.

```ts
import { readFlash } from "deno-inertia"

const flash = readFlash(request)
// → { success: "Formulaire envoyé !" } ou null
```

Usage typique dans `InertiaConfig.always` pour exposer le flash à toutes les pages :

```ts
const inertia = createInertia({
  always: async (req) => ({
    flash: readFlash(req),    // null si pas de flash
  }),
})
```

---

## `clearFlashCookie()`

Génère la valeur d'un header `Set-Cookie` pour expirer le cookie flash.

```ts
import { clearFlashCookie } from "deno-inertia"

// Manuellement dans un middleware
const headers = new Headers()
headers.set("Set-Cookie", clearFlashCookie())
```

---

## Auto-clear avec `clearFlash`

L'option `clearFlash: true` dans `InertiaConfig` efface automatiquement le cookie
dans **chaque** réponse `render()`, sans code supplémentaire.

```ts
const inertia = createInertia({
  clearFlash: true,
  always: async (req) => ({
    flash: readFlash(req),
  }),
  // ...
})
```

> Le cookie n'est **pas** effacé sur les réponses 409 (version mismatch),
> pour que le flash survive un hard reload.

---

## Côté client Vue

```vue
<script setup>
const { props } = usePage()
const flash = computed(() => props.flash)
</script>

<template>
  <div v-if="flash?.success" class="alert alert-success">
    {{ flash.success }}
  </div>
  <div v-if="flash?.error" class="alert alert-error">
    {{ flash.error }}
  </div>
</template>
```

## Côté client React

```tsx
import { usePage } from "@inertiajs/react"

interface SharedProps {
  flash?: { success?: string; error?: string; info?: string } | null
}

function FlashMessage() {
  const { props } = usePage<SharedProps>()
  const flash = props.flash

  return (
    <>
      {flash?.success && <div className="alert-success">{flash.success}</div>}
      {flash?.error   && <div className="alert-error">{flash.error}</div>}
    </>
  )
}
```
