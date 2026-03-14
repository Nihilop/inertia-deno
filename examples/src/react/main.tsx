import { createInertiaApp } from "@inertiajs/react"
import { createRoot } from "react-dom/client"
import "../base.css"

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("./pages/**/*.tsx", { eager: true })
    const page = pages[`./pages/${name}.tsx`]
    if (!page) throw new Error(`[deno-inertia] Page React introuvable : "${name}"`)
    return page as object
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
