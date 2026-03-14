# Flash messages

Flash messages allow displaying a one-time message (success, error, info)
after a POST redirect. They are stored in an HTTP-only `__flash` cookie
with `Max-Age=10` seconds.

```ts
import { readFlash, flashCookie, clearFlashCookie } from "deno-inertia"
```

---

## `FlashMessage` interface

```ts
interface FlashMessage {
  success?: string
  error?:   string
  info?:    string
}
```

---

## Full cycle

```
POST /form ──────────────────────────────────────────► Deno
                                                        ↓ flashCookie({ success: "…" })
◄── 303 redirect + Set-Cookie: __flash=…; Max-Age=10 ──

GET /dashboard (X-Inertia: true) ───────────────────► Deno
                                                        ↓ readFlash(req) in always()
◄── JSON { props: { flash: { success: "…" } } } ──────
    Set-Cookie: __flash=; Max-Age=0 (auto-clear)
```

---

## `flashCookie(message)`

Generates the value of a `Set-Cookie` header to define the flash.

```ts
import { flashCookie } from "deno-inertia"

app.post("/form", async (c) => {
  await processForm(await c.req.parseBody())

  return inertia.redirect("/dashboard", {
    "Set-Cookie": flashCookie({ success: "Form submitted!" }),
  })
})
```

The cookie is created with:
- `HttpOnly` — inaccessible from JavaScript
- `SameSite=Lax` — CSRF protection
- `Path=/` — available on all routes
- `Max-Age=10` — expires after 10 seconds

---

## `readFlash(request)`

Reads and parses the `__flash` cookie from the incoming request.

```ts
import { readFlash } from "deno-inertia"

const flash = readFlash(request)
// → { success: "Form submitted!" } or null
```

Typical usage in `InertiaConfig.always` to expose the flash to all pages:

```ts
const inertia = createInertia({
  always: async (req) => ({
    flash: readFlash(req),    // null if no flash
  }),
})
```

---

## `clearFlashCookie()`

Generates the value of a `Set-Cookie` header to expire the flash cookie.

```ts
import { clearFlashCookie } from "deno-inertia"

// Manually in a middleware
const headers = new Headers()
headers.set("Set-Cookie", clearFlashCookie())
```

---

## Auto-clear with `clearFlash`

The `clearFlash: true` option in `InertiaConfig` automatically clears the cookie
in **every** `render()` response, without extra code.

```ts
const inertia = createInertia({
  clearFlash: true,
  always: async (req) => ({
    flash: readFlash(req),
  }),
  // ...
})
```

> The cookie is **not** cleared on 409 responses (version mismatch),
> so the flash survives a hard reload.

---

## Vue client

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

## React client

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
