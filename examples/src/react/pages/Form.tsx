import { useForm } from "@inertiajs/react"
import AppLayout from "../layouts/AppLayout"

interface Props {
  router: string
  errors?: Record<string, string>
}

export default function Form({ router: _router }: Props) {
  const form = useForm({ name: "", email: "", message: "" })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    form.post("/form", { errorBag: "contact" })
  }

  return (
    <AppLayout>
      <div style={s.header}>
        <h1 style={s.h1}>📬 Formulaire</h1>
        <p style={s.subtitle}>
          Démo <code style={s.code}>useForm</code> d'Inertia — POST géré côté serveur Deno,
          validation, flash message et redirection SPA.
        </p>
      </div>

      <div style={s.card} onSubmit={submit}>
        {/* Nom */}
        <div style={s.field}>
          <label style={s.label}>Nom <span style={s.req}>*</span></label>
          <input
            style={{ ...s.input, ...(form.errors.name ? s.inputError : {}) }}
            type="text"
            value={form.data.name}
            onChange={(e) => form.setData("name", e.target.value)}
            placeholder="Jean Dupont"
          />
          {form.errors.name && <span style={s.errorMsg}>{form.errors.name}</span>}
        </div>

        {/* Email */}
        <div style={s.field}>
          <label style={s.label}>Email <span style={s.req}>*</span></label>
          <input
            style={{ ...s.input, ...(form.errors.email ? s.inputError : {}) }}
            type="email"
            value={form.data.email}
            onChange={(e) => form.setData("email", e.target.value)}
            placeholder="jean@example.com"
          />
          {form.errors.email && <span style={s.errorMsg}>{form.errors.email}</span>}
        </div>

        {/* Message */}
        <div style={s.field}>
          <label style={s.label}>Message <span style={s.req}>*</span></label>
          <textarea
            style={{ ...s.input, ...s.textarea, ...(form.errors.message ? s.inputError : {}) }}
            rows={4}
            value={form.data.message}
            onChange={(e) => form.setData("message", e.target.value)}
            placeholder="Votre message…"
          />
          {form.errors.message && <span style={s.errorMsg}>{form.errors.message}</span>}
        </div>

        <div style={s.footer}>
          <span style={s.hint}>
            {form.processing   ? "⏳ Envoi en cours…"
            : form.wasSuccessful ? "✅ Envoyé !"
            : "Les champs * sont obligatoires"}
          </span>
          <button
            style={{ ...s.btnSubmit, ...(form.processing ? s.btnDisabled : {}) }}
            onClick={submit}
            disabled={form.processing}
          >
            Envoyer →
          </button>
        </div>
      </div>

      <div style={s.card}>
        <h2 style={s.infoTitle}>Comment ça marche ?</h2>
        <ol style={s.ol}>
          <li style={s.li}><code style={s.code}>form.post("/form", {"{ errorBag: 'contact' }"})</code> envoie un POST avec <code style={s.code}>X-Inertia-Error-Bag: contact</code></li>
          <li style={s.li}>Le serveur lit l'header et namespace les erreurs : <code style={s.code}>{"{ errors: { contact: { champ: 'msg' } } }"}</code></li>
          <li style={s.li}>Inertia extrait automatiquement <code style={s.code}>errors.contact</code> dans <code style={s.code}>form.errors</code></li>
          <li style={s.li}>En cas de succès → <code style={s.code}>303</code> vers <code style={s.code}>/form</code> + cookie flash. Inertia suit la redirection.</li>
          <li style={s.li}>Le flash est lu depuis le cookie et injecté dans les shared props.</li>
        </ol>
      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  header:    { marginBottom: "2rem" },
  h1:        { fontSize: "2rem", marginBottom: ".5rem" },
  subtitle:  { color: "#71717a" },
  code:      { background: "#f0f0f2", padding: ".1rem .35rem", borderRadius: 4, fontSize: ".85em",
               fontFamily: "ui-monospace, monospace" },
  card:      { background: "#fff", border: "1px solid #e4e4e7", borderRadius: 8,
               padding: "1.75rem", boxShadow: "0 1px 3px rgba(0,0,0,.08)", marginBottom: "1.25rem" },
  field:     { display: "flex", flexDirection: "column", gap: ".35rem", marginBottom: "1.25rem" },
  label:     { fontSize: ".875rem", fontWeight: 600, color: "#374151" },
  req:       { color: "#ef4444" },
  input:     { padding: ".6rem .85rem", border: "1px solid #e4e4e7", borderRadius: 8,
               fontSize: ".95rem", fontFamily: "inherit", background: "#f8f8f9",
               color: "#111", outline: "none", width: "100%" },
  inputError:{ borderColor: "#ef4444" },
  textarea:  { resize: "vertical" as const },
  errorMsg:  { fontSize: ".8rem", color: "#ef4444", fontWeight: 500 },
  footer:    { display: "flex", alignItems: "center", justifyContent: "space-between",
               marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid #e4e4e7" },
  hint:      { fontSize: ".85rem", color: "#71717a" },
  btnSubmit: { padding: ".65rem 1.5rem", background: "#6366f1", color: "#fff",
               border: "none", borderRadius: 8, fontSize: ".95rem", fontWeight: 600,
               cursor: "pointer" },
  btnDisabled: { opacity: .6, cursor: "not-allowed" },
  infoTitle: { fontSize: "1rem", marginBottom: ".75rem", color: "#374151" },
  ol:        { paddingLeft: "1.25rem" },
  li:        { color: "#71717a", lineHeight: 1.8, fontSize: ".9rem", marginBottom: ".25rem" },
}
