import { defineConfig } from "vitepress"

const enSidebar = [
  {
    text: "Getting Started",
    items: [
      { text: "Introduction",  link: "/en/" },
      { text: "Installation",  link: "/en/installation" },
      { text: "Quick Start",   link: "/en/quick-start" },
    ],
  },
  {
    text: "Core",
    items: [
      { text: "Configuration",     link: "/en/configuration" },
      { text: "Rendering",         link: "/en/rendering" },
      { text: "Props",             link: "/en/props" },
      { text: "Forms & Validation",link: "/en/forms" },
      { text: "Flash Messages",    link: "/en/flash" },
    ],
  },
  {
    text: "Infrastructure",
    items: [
      { text: "Router",           link: "/en/router" },
      { text: "Vite Integration", link: "/en/vite" },
      { text: "Adapters",         link: "/en/adapters" },
    ],
  },
  {
    text: "Advanced",
    items: [
      { text: "Inertia v2", link: "/en/inertia-v2" },
      { text: "TypeScript", link: "/en/typescript" },
    ],
  },
  {
    text: "CLI",
    items: [
      { text: "CLI Reference", link: "/en/cli" },
    ],
  },
]

const frSidebar = [
  {
    text: "Démarrage",
    items: [
      { text: "Introduction",     link: "/fr/" },
      { text: "Installation",     link: "/fr/installation" },
      { text: "Démarrage rapide", link: "/fr/quick-start" },
    ],
  },
  {
    text: "Fondamentaux",
    items: [
      { text: "Configuration", link: "/fr/configuration" },
      { text: "Rendu",         link: "/fr/rendering" },
      { text: "Props",         link: "/fr/props" },
      { text: "Formulaires",   link: "/fr/forms" },
      { text: "Flash messages",link: "/fr/flash" },
    ],
  },
  {
    text: "Infrastructure",
    items: [
      { text: "Router",   link: "/fr/router" },
      { text: "Vite",     link: "/fr/vite" },
      { text: "Adapters", link: "/fr/adapters" },
    ],
  },
  {
    text: "Avancé",
    items: [
      { text: "Inertia v2", link: "/fr/inertia-v2" },
      { text: "TypeScript", link: "/fr/typescript" },
    ],
  },
  {
    text: "CLI",
    items: [
      { text: "Référence CLI", link: "/fr/cli" },
    ],
  },
]

export default defineConfig({
  title: "inertia-deno",
  description: "Inertia.js server-side adapter for Deno",

  locales: {
    en: {
      label: "English",
      lang: "en-US",
      link: "/en/",
      themeConfig: {
        nav: [
          { text: "Guide",  link: "/en/" },
          { text: "JSR",    link: "https://jsr.io/@streemkit/inertia-deno" },
          { text: "GitHub", link: "https://github.com/Nihilop/inertia-deno" },
        ],
        sidebar: enSidebar,
        editLink: {
          pattern: "https://github.com/Nihilop/inertia-deno/edit/main/docs/:path",
          text: "Edit this page on GitHub",
        },
        lastUpdated: { text: "Last updated" },
      },
    },

    fr: {
      label: "Français",
      lang: "fr-FR",
      link: "/fr/",
      themeConfig: {
        nav: [
          { text: "Guide",  link: "/fr/" },
          { text: "JSR",    link: "https://jsr.io/@streemkit/inertia-deno" },
          { text: "GitHub", link: "https://github.com/Nihilop/inertia-deno" },
        ],
        sidebar: frSidebar,
        editLink: {
          pattern: "https://github.com/Nihilop/inertia-deno/edit/main/docs/:path",
          text: "Modifier cette page sur GitHub",
        },
        lastUpdated: { text: "Dernière mise à jour" },
        docFooter: {
          prev: "Page précédente",
          next: "Page suivante",
        },
      },
    },
  },

  themeConfig: {
    logo: "/logo.svg",
    socialLinks: [
      { icon: "github", link: "https://github.com/Nihilop/inertia-deno" },
    ],
    search: {
      provider: "local",
    },
  },

  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
  ],
})
