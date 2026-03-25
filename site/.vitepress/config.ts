import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Contactless Order System',
  description: 'Documentation for the Contactless Order System — a QR-code-based ordering platform for restaurants.',
  base: '/contactless-order-system/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Planning', link: '/docs/planning/' },
      { text: 'Architecture', link: '/docs/architecture/' },
      { text: 'Stories', link: '/docs/stories/' },
    ],
    sidebar: [
      {
        text: 'Planning',
        items: [{ text: 'Overview', link: '/docs/planning/' }],
      },
      {
        text: 'Architecture',
        items: [{ text: 'Overview', link: '/docs/architecture/' }],
      },
      {
        text: 'User Stories',
        items: [{ text: 'Overview', link: '/docs/stories/' }],
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/phamhuutruong7/contactless-order-system',
      },
    ],
    footer: {
      message: 'Contactless Order System',
    },
  },
})
