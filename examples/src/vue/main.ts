import { createApp, h } from "vue"
import { createInertiaApp } from "@inertiajs/vue3"
import "../../src/base.css"

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("./pages/**/*.vue", { eager: true })
    const page = pages[`./pages/${name}.vue`]
    if (!page) throw new Error(`[deno-inertia] Page Vue introuvable : "${name}"`)
    return page as object
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
})
