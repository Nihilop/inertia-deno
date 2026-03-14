/**
 * Handler de formulaire partagé entre les 3 serveurs.
 * Reçoit un Request POST, valide, retourne une Response Inertia.
 */
import { redirect, flashCookie } from "deno-inertia"
import type { ValidationErrors } from "deno-inertia"

export interface FormBody {
  name?: string
  email?: string
  message?: string
}

/** Parse le body d'un POST (JSON Inertia ou form-urlencoded) */
export async function parseFormBody(request: Request): Promise<FormBody> {
  const ct = request.headers.get("Content-Type") ?? ""
  if (ct.includes("application/json")) {
    return await request.json() as FormBody
  }
  if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await request.text()
    const params = new URLSearchParams(text)
    return {
      name:    params.get("name")    ?? undefined,
      email:   params.get("email")   ?? undefined,
      message: params.get("message") ?? undefined,
    }
  }
  return {}
}

/** Validation simple — retourne null si tout est OK, sinon les erreurs */
export function validateForm(body: FormBody): ValidationErrors | null {
  const errors: ValidationErrors = {}

  if (!body.name?.trim())
    errors.name = "Le nom est obligatoire."
  else if (body.name.trim().length < 2)
    errors.name = "Le nom doit faire au moins 2 caractères."

  if (!body.email?.trim())
    errors.email = "L'email est obligatoire."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    errors.email = "L'adresse email n'est pas valide."

  if (!body.message?.trim())
    errors.message = "Le message est obligatoire."
  else if (body.message.trim().length < 10)
    errors.message = "Le message doit faire au moins 10 caractères."

  return Object.keys(errors).length > 0 ? errors : null
}

/**
 * Réponse de succès : redirection 303 + cookie flash.
 * Inertia suit automatiquement la redirection en SPA.
 */
export function successResponse(): Response {
  return redirect("/form", {
    "Set-Cookie": flashCookie({ success: "Formulaire envoyé avec succès ! 🎉" }),
  })
}
