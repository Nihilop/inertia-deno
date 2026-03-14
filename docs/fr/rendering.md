# Rendu

`createInertia()` retourne quatre méthodes : `render`, `renderWithErrors`, `redirect`, `pageToDiv`.

---

## `render<T>()`

```ts
render<T extends Record<string, unknown> = Record<string, unknown>>(
  request:      Request,
  component:    string,
  props?:       PageProps<T>,
  responseInit?: ResponseInit,
): Promise<Response>
```

| Paramètre | Type | Description |
|---|---|---|
| `request` | `Request` | Requête Web API entrante |
| `component` | `string` | Nom du composant de page (ex: `"Home"`, `"Dashboard"`) |
| `props` | `PageProps<T>` | Props envoyées au composant (peut contenir des marqueurs `lazy`/`defer`/`merge`) |
| `responseInit` | `ResponseInit` | Optionnel — status HTTP, headers supplémentaires |

### Comportement selon la requête

| Condition | Réponse |
|---|---|
| Première visite (pas de `X-Inertia`) | HTML complet avec `<div id="app" data-page="…">` |
| Navigation SPA (`X-Inertia: true`) | JSON `{ component, props, url, version }` avec headers `X-Inertia: true` + `Vary: X-Inertia` |
| Version mismatch (`X-Inertia-Version` ≠ serveur) | 409 + header `X-Inertia-Location` |
| Partial reload (`X-Inertia-Partial-Data`) | JSON filtré sur les clés demandées + `always` props |

### Exemple basique

```ts
app.get("/about", async (c) =>
  inertia.render(toWebRequest(c), "About", {
    title:  "À propos",
    author: "Alice",
  }),
)
```

### Avec `responseInit`

```ts
// 404 en conservant le rendu Inertia
app.use("*", async (c) =>
  inertia.render(toWebRequest(c), "NotFound", {}, { status: 404 }),
)
```

### Avec le générique `<T>`

```ts
interface DashboardProps {
  router: string
  stats?: { totalUsers: number; revenue: number }  // deferred — absent initial
  chart?: { labels: string[]; data: number[] }     // lazy — chargement manuel
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

Retourne une réponse **422** avec les erreurs de validation injectées dans `props.errors`.

```ts
// Type ValidationErrors = Record<string, string>
const errors: ValidationErrors = {
  email: "Adresse email invalide",
  name:  "Le nom est requis",
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
  return inertia.redirect("/merci")
})
```

### Named error bags

Isolez les erreurs par formulaire avec un `errorBag` :

```ts
// errorBag = "login" → props.errors = { login: { email: "…" } }
return inertia.renderWithErrors(req, "Auth", {}, errors, "login")

// Ou via header X-Inertia-Error-Bag (envoyé par le client)
// → détecté automatiquement par renderWithErrors
```

Côté client Vue :

```ts
const form = useForm({ email: "", password: "" })
form.post("/login", { errorBag: "login" })
// Lire : usePage().props.errors.login?.email
```

---

## `redirect()`

```ts
redirect(url: string, headers?: Record<string, string>): Response
```

Retourne un `303 See Other`. Inertia suit automatiquement cette redirection en SPA.

```ts
// Après un POST réussi
app.post("/form", async (c) => {
  await saveData(await c.req.parseBody())
  return inertia.redirect("/merci")
})

// Avec un flash message
return inertia.redirect("/dashboard", {
  "Set-Cookie": flashCookie({ success: "Profil mis à jour !" }),
})
```

> **Important** — Utilisez toujours `redirect()` (303) après un POST réussi.
> Un 200 après POST empêche Inertia de naviguer correctement.

---

## `pageToDiv()`

```ts
pageToDiv(page: PageData): string
// → '<div id="app" data-page="{&quot;component&quot;:&quot;Home&quot;,…}"></div>'
```

Sérialise les données de page en JSON échappé dans un attribut HTML.
Utilisé dans `template()` mais peut aussi servir dans des tests ou des rendus manuels.

```ts
const html = `<body>${pageToDiv(page)}</body>`
```

**Échappement** — `&`, `<`, `>`, `"` sont encodés en entités HTML pour prévenir les injections XSS dans l'attribut `data-page`.
