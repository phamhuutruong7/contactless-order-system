import { defineConfig } from 'vitepress'

const enNav = [
  { text: 'Home', link: '/' },
  { text: 'PRD', link: '/docs/planning/' },
  { text: 'Architecture', link: '/docs/architecture/' },
  { text: 'User Stories', link: '/docs/stories/' },
]

const viNav = [
  { text: 'Trang chủ', link: '/vi/' },
  { text: 'PRD', link: '/vi/docs/planning/' },
  { text: 'Kiến trúc', link: '/vi/docs/architecture/' },
  { text: 'User Stories', link: '/vi/docs/stories/' },
]

const enSidebar = [
  {
    text: 'Planning',
    items: [{ text: 'Product Requirements (PRD)', link: '/docs/planning/' }],
  },
  {
    text: 'Architecture',
    items: [{ text: 'System Architecture', link: '/docs/architecture/' }],
  },
  {
    text: 'User Stories',
    items: [{ text: 'Epics & Stories', link: '/docs/stories/' }],
  },
]

const viSidebar = [
  {
    text: 'Kế hoạch',
    items: [{ text: 'Yêu cầu sản phẩm (PRD)', link: '/vi/docs/planning/' }],
  },
  {
    text: 'Kiến trúc',
    items: [{ text: 'Kiến trúc hệ thống', link: '/vi/docs/architecture/' }],
  },
  {
    text: 'User Stories',
    items: [{ text: 'Epics & Stories', link: '/vi/docs/stories/' }],
  },
]

export default defineConfig({
  title: 'Contactless Order System',
  description: 'A modern contactless ordering solution for restaurants — QR-code menus, real-time kitchen updates, and multi-tenant management.',
  base: '/contactless-order-system/',

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
      },
    },
    vi: {
      label: 'Tiếng Việt',
      lang: 'vi-VN',
      themeConfig: {
        nav: viNav,
        sidebar: viSidebar,
      },
    },
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/phamhuutruong7/contactless-order-system' },
    ],
    footer: {
      message: 'Contactless Order System · MIT License',
    },
  },
})
