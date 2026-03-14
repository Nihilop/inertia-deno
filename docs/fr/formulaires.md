# Formulaires et validation

## Cycle POST → redirect

Le protocole Inertia impose le pattern **PRG (Post/Redirect/Get)** pour les formulaires :

```
Client  ──[ POST /form ]───────────────────► Deno
        ◄──[ 422 + errors ]────────────────  (erreurs de validation)
       ou
        ◄──[ 303 See Other → /merci ]──────  (succès)
```

---

## Validation basique

```ts
app.post("/contact", async (c) => {
  const body = await c.req.parseBody() as Record<string, string>

  // Validation manuelle (ou avec une lib comme zod)
  const errors: Record<string, string> = {}
  if (!body.email?.includes("@")) errors.email = "Email invalide"
  if (!body.message)               errors.message = "Message requis"

  if (Object.keys(errors).length > 0) {
    // 422 — le client Inertia préserve les props du formulaire
    return inertia.renderWithErrors(
      toWebRequest(c),
      "Contact",
      { router: "Hono" },  // props normales de la page
      errors,
    )
  }

  await sendEmail(body)
  return inertia.redirect("/merci")
})
```

Côté client Vue :

```vue
<script setup>
const form = useForm({ email: "", message: "" })
</script>

<template>
  <form @submit.prevent="form.post('/contact')">
    <input v-model="form.email" />
    <span v-if="form.errors.email">{{ form.errors.email }}</span>

    <textarea v-model="form.message" />
    <span v-if="form.errors.message">{{ form.errors.message }}</span>

    <button type="submit" :disabled="form.processing">Envoyer</button>
  </form>
</template>
```

---

## Named error bags

Quand une page contient **plusieurs formulaires**, isolez les erreurs
avec un `errorBag` pour éviter qu'elles se mélangent.

```ts
// Serveur — errorBag "login"
app.post("/login", async (c) => {
  const errors = validateLogin(await c.req.parseBody())
  if (errors) {
    return inertia.renderWithErrors(req, "Auth", {}, errors, "login")
  }
  return inertia.redirect("/dashboard")
})

// Serveur — errorBag "register"
app.post("/register", async (c) => {
  const errors = validateRegister(await c.req.parseBody())
  if (errors) {
    return inertia.renderWithErrors(req, "Auth", {}, errors, "register")
  }
  return inertia.redirect("/dashboard")
})
```

**Structure des erreurs avec bag :**

```json
// Sans bag : props.errors = { email: "Email invalide" }
// Avec bag "login" : props.errors = { login: { email: "Email invalide" } }
```

Côté client Vue :

```ts
// Formulaire de login
const loginForm = useForm({ email: "", password: "" })
loginForm.post("/login", { errorBag: "login" })

// Accès aux erreurs namespaced
loginForm.errors.email   // ← géré automatiquement par useForm()

// Ou manuellement via usePage()
const { props } = usePage()
props.errors?.login?.email
```

Côté client React :

```tsx
// useForm gère le errorBag automatiquement
const form = useForm({ email: "", password: "" })
form.post("/login", { errorBag: "login" })

// form.errors.email ← extrait automatiquement du bag "login"
```

### Via header `X-Inertia-Error-Bag`

Le client envoie `X-Inertia-Error-Bag: login` dans les headers.
`renderWithErrors` le détecte automatiquement si `errorBag` n'est pas passé explicitement :

```ts
// Pas besoin de passer errorBag — lu depuis les headers
return inertia.renderWithErrors(req, "Auth", {}, errors)
// → errors namespaced si X-Inertia-Error-Bag: login est présent
```

---

## Flash message après succès

```ts
import { flashCookie, redirect } from "deno-inertia"

app.post("/profile", async (c) => {
  await updateProfile(await c.req.parseBody())
  return inertia.redirect("/profile", {
    "Set-Cookie": flashCookie({ success: "Profil mis à jour !" }),
  })
})
```

→ Voir [Flash messages](./flash.md) pour le cycle complet.

---

## Parser le body

Hono et Oak ont leurs propres méthodes. Voici des helpers pratiques :

```ts
// Hono — JSON ou form-urlencoded
const body = await c.req.parseBody()       // form-urlencoded
const body = await c.req.json()            // JSON

// Oak
const body = await ctx.request.body.formData()
const body = await ctx.request.body.json()

// std/http — via Request Web API
async function parseBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get("Content-Type") ?? ""
  if (ct.includes("application/json")) {
    return await req.json()
  }
  const params = new URLSearchParams(await req.text())
  return Object.fromEntries(params)
}
```

---

## Validation avec Zod

```ts
import { z } from "npm:zod"

const schema = z.object({
  email:   z.string().email("Email invalide"),
  message: z.string().min(10, "Message trop court"),
})

app.post("/contact", async (c) => {
  const raw    = await c.req.parseBody()
  const result = schema.safeParse(raw)

  if (!result.success) {
    // Convertir ZodError → ValidationErrors
    const errors = Object.fromEntries(
      result.error.errors.map((e) => [e.path[0], e.message])
    )
    return inertia.renderWithErrors(toWebRequest(c), "Contact", {}, errors)
  }

  await sendMessage(result.data)
  return inertia.redirect("/merci")
})
```
