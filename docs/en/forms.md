# Forms & validation

## POST → redirect cycle

The Inertia protocol enforces the **PRG (Post/Redirect/Get)** pattern for forms:

```
Client  ──[ POST /form ]───────────────────► Deno
        ◄──[ 422 + errors ]────────────────  (validation errors)
       or
        ◄──[ 303 See Other → /thank-you ]──  (success)
```

---

## Basic validation

```ts
app.post("/contact", async (c) => {
  const body = await c.req.parseBody() as Record<string, string>

  // Manual validation (or with a lib like zod)
  const errors: Record<string, string> = {}
  if (!body.email?.includes("@")) errors.email = "Invalid email"
  if (!body.message)               errors.message = "Message required"

  if (Object.keys(errors).length > 0) {
    // 422 — the Inertia client preserves form props
    return inertia.renderWithErrors(
      toWebRequest(c),
      "Contact",
      { router: "Hono" },  // normal page props
      errors,
    )
  }

  await sendEmail(body)
  return inertia.redirect("/thank-you")
})
```

Vue client:

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

    <button type="submit" :disabled="form.processing">Send</button>
  </form>
</template>
```

---

## Named error bags

When a page has **multiple forms**, isolate errors
with an `errorBag` to prevent them from mixing.

```ts
// Server — errorBag "login"
app.post("/login", async (c) => {
  const errors = validateLogin(await c.req.parseBody())
  if (errors) {
    return inertia.renderWithErrors(req, "Auth", {}, errors, "login")
  }
  return inertia.redirect("/dashboard")
})

// Server — errorBag "register"
app.post("/register", async (c) => {
  const errors = validateRegister(await c.req.parseBody())
  if (errors) {
    return inertia.renderWithErrors(req, "Auth", {}, errors, "register")
  }
  return inertia.redirect("/dashboard")
})
```

**Error structure with bag:**

```json
// Without bag: props.errors = { email: "Invalid email" }
// With bag "login": props.errors = { login: { email: "Invalid email" } }
```

Vue client:

```ts
// Login form
const loginForm = useForm({ email: "", password: "" })
loginForm.post("/login", { errorBag: "login" })

// Access namespaced errors
loginForm.errors.email   // ← managed automatically by useForm()

// Or manually via usePage()
const { props } = usePage()
props.errors?.login?.email
```

React client:

```tsx
// useForm handles the errorBag automatically
const form = useForm({ email: "", password: "" })
form.post("/login", { errorBag: "login" })

// form.errors.email ← extracted automatically from the "login" bag
```

### Via `X-Inertia-Error-Bag` header

The client sends `X-Inertia-Error-Bag: login` in headers.
`renderWithErrors` detects it automatically if `errorBag` is not passed explicitly:

```ts
// No need to pass errorBag — read from headers
return inertia.renderWithErrors(req, "Auth", {}, errors)
// → namespaced errors if X-Inertia-Error-Bag: login is present
```

---

## Flash message on success

```ts
import { flashCookie } from "deno-inertia"

app.post("/profile", async (c) => {
  await updateProfile(await c.req.parseBody())
  return inertia.redirect("/profile", {
    "Set-Cookie": flashCookie({ success: "Profile updated!" }),
  })
})
```

→ See [Flash messages](./flash.md) for the full cycle.

---

## Parsing the body

Hono and Oak have their own methods. Useful helpers:

```ts
// Hono — JSON or form-urlencoded
const body = await c.req.parseBody()       // form-urlencoded
const body = await c.req.json()            // JSON

// Oak
const body = await ctx.request.body.formData()
const body = await ctx.request.body.json()

// std/http — via Web API Request
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

## Validation with Zod

```ts
import { z } from "npm:zod"

const schema = z.object({
  email:   z.string().email("Invalid email"),
  message: z.string().min(10, "Message too short"),
})

app.post("/contact", async (c) => {
  const raw    = await c.req.parseBody()
  const result = schema.safeParse(raw)

  if (!result.success) {
    // Convert ZodError → ValidationErrors
    const errors = Object.fromEntries(
      result.error.errors.map((e) => [e.path[0], e.message])
    )
    return inertia.renderWithErrors(toWebRequest(c), "Contact", {}, errors)
  }

  await sendMessage(result.data)
  return inertia.redirect("/thank-you")
})
```
