# Rendering

`createInertia()` returns four methods: `render`, `renderWithErrors`, `redirect`, `pageToDiv`.

---

## `render<T>()`

```ts
render<T extends Record<string, unknown> = Record<string, unknown>>(
  request:       Request,
  component:     string,
  props?:        PageProps<T>,
  responseInit?: ResponseInit,
): Promise<Response>
```

| Parameter | Type | Description |
|---|---|---|
| `request` | `Request` | Incoming Web API request |
| `component` | `string` | Page component name (e.g. `"Home"`, `"Dashboard"`) |
| `props` | `PageProps<T>` | Props sent to the component (may contain `lazy`/`defer`/`merge` markers) |
| `responseInit` | `ResponseInit` | Optional — HTTP status, extra headers |

### Behavior by request type

| Condition | Response |
|---|---|
| First visit (no `X-Inertia`) | Full HTML with `<div id="app" data-page="…">` |
| SPA navigation (`X-Inertia: true`) | JSON `{ component, props, url, version }` with headers `X-Inertia: true` + `Vary: X-Inertia` |
| Version mismatch (`X-Inertia-Version` ≠ server) | 409 + `X-Inertia-Location` header |
| Partial reload (`X-Inertia-Partial-Data`) | Filtered JSON on requested keys + `always` props |

### Basic example

```ts
app.get("/about", async (c) =>
  inertia.render(toWebRequest(c), "About", {
    title:  "About us",
    author: "Alice",
  }),
)
```

### With `responseInit`

```ts
// 404 while keeping Inertia rendering
app.use("*", async (c) =>
  inertia.render(toWebRequest(c), "NotFound", {}, { status: 404 }),
)
```

### With the `<T>` generic

```ts
interface DashboardProps {
  router: string
  stats?: { totalUsers: number; revenue: number }  // deferred — absent initially
  chart?: { labels: string[]; data: number[] }     // lazy — manual loading
}

app.get("/dashboard", async (c) =>
  inertia.render<DashboardProps>(toWebRequest(c), "Dashboard", {
    router: "Hono",
    stats:  defer(getStats),          // ✅ DeferredProp<{ totalUsers; revenue }>
    chart:  lazy(getChart),           // ✅ LazyProp<{ labels; data }>
  }),
)
```

---

## `renderWithErrors<T>()`

```ts
renderWithErrors<T extends Record<string, unknown> = Record<string, unknown>>(
  request:   Request,
  component: string,
  props:     PageProps<T>,
  errors:    ValidationErrors,
  errorBag?: string,
): Promise<Response>
```

Returns a **422** response with validation errors injected into `props.errors`.

```ts
// type ValidationErrors = Record<string, string>
const errors: ValidationErrors = {
  email: "Invalid email address",
  name:  "Name is required",
}

app.post("/form", async (c) => {
  const body   = await c.req.parseBody()
  const errors = validate(body)

  if (errors) {
    return inertia.renderWithErrors(
      toWebRequest(c),
      "Form",
      { router: "Hono" },
      errors,
    )
  }
  return inertia.redirect("/thank-you")
})
```

### Named error bags

Isolate errors per form with an `errorBag`:

```ts
// errorBag = "login" → props.errors = { login: { email: "…" } }
return inertia.renderWithErrors(req, "Auth", {}, errors, "login")

// Or via X-Inertia-Error-Bag header (sent by the client)
// → detected automatically by renderWithErrors
```

Client-side Vue:

```ts
const form = useForm({ email: "", password: "" })
form.post("/login", { errorBag: "login" })
// Access: usePage().props.errors.login?.email
```

---

## `redirect()`

```ts
redirect(url: string, headers?: Record<string, string>): Response
```

Returns a `303 See Other`. Inertia automatically follows this redirect in SPA mode.

```ts
// After a successful POST
app.post("/form", async (c) => {
  await saveData(await c.req.parseBody())
  return inertia.redirect("/thank-you")
})

// With a flash message
return inertia.redirect("/dashboard", {
  "Set-Cookie": flashCookie({ success: "Profile updated!" }),
})
```

> **Important** — Always use `redirect()` (303) after a successful POST.
> A 200 after POST prevents Inertia from navigating correctly.

---

## `pageToDiv()`

```ts
pageToDiv(page: PageData): string
// → '<div id="app" data-page="{&quot;component&quot;:&quot;Home&quot;,…}"></div>'
```

Serializes page data as escaped JSON in an HTML attribute.
Used in `template()` but can also serve in tests or manual rendering.

```ts
const html = `<body>${pageToDiv(page)}</body>`
```

**Escaping** — `&`, `<`, `>`, `"` are HTML-encoded to prevent XSS injections in the `data-page` attribute.
