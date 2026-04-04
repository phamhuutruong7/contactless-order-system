import { defineConfig } from 'vitepress'

const enNav = [
  { text: 'Home', link: '/' },
  { text: 'PRD', link: '/docs/planning/' },
  { text: 'Architecture', link: '/docs/architecture/' },
  { text: 'User Stories', link: '/docs/stories/' },
  { text: 'CloudPRNT Guide', link: '/docs/printing/' },
  { text: 'Pricing', link: '/docs/pricing/' },
  { text: 'Project Context', link: '/docs/project-context/' },
  { text: 'UX Design', link: '/docs/ux/guest-menu/' },
  { text: 'Diagrams', link: '/docs/diagrams/system-overview/' },
  { text: 'Edge Cases', link: '/docs/edge-cases/' },
]

const viNav = [
  { text: 'Trang chủ', link: '/vi/' },
  { text: 'PRD', link: '/vi/docs/planning/' },
  { text: 'Kiến trúc', link: '/vi/docs/architecture/' },
  { text: 'User Stories', link: '/vi/docs/stories/' },
  { text: 'Hướng dẫn CloudPRNT', link: '/vi/docs/printing/' },
  { text: 'Bảng giá', link: '/vi/docs/pricing/' },
  { text: 'Bối cảnh dự án', link: '/vi/docs/project-context/' },
  { text: 'Thiết kế UX', link: '/vi/docs/ux/guest-menu/' },
  { text: 'Sơ đồ', link: '/vi/docs/diagrams/system-overview/' },
  { text: 'Trường hợp ngoại lệ', link: '/vi/docs/edge-cases/' },
]

const enSidebar = [
  {
    text: 'Planning',
    items: [
      { text: 'Product Requirements (PRD)', link: '/docs/planning/' },
      { text: 'Project Timeline', link: '/docs/planning/timeline/' },
    ],
  },
  {
    text: 'Architecture',
    items: [{ text: 'System Architecture', link: '/docs/architecture/' }],
  },
  {
    text: 'User Stories',
    items: [
      { text: 'Epics & Stories', link: '/docs/stories/' },
      { text: 'Daily Report Spec', link: '/docs/stories/daily-report-spec/' },
      { text: 'Staff Sessions & Trinkgeld Spec', link: '/docs/stories/staff-sessions-spec/' },
      { text: 'Table Sessions Spec', link: '/docs/stories/table-sessions-spec/' },
    ],
  },
  {
    text: 'Printing',
    items: [{ text: 'CloudPRNT Integration Guide', link: '/docs/printing/' }],
  },
  {
    text: 'Pricing',
    items: [{ text: 'Fee Estimation', link: '/docs/pricing/' }],
  },
  {
    text: 'Project Context',
    items: [{ text: 'Project Context', link: '/docs/project-context/' }],
  },
  {
    text: 'UX Design',
    items: [
      {
        text: 'Guest',
        items: [
          { text: 'Menu Browse', link: '/docs/ux/guest-menu/' },
          { text: 'Item Detail', link: '/docs/ux/guest-item-detail/' },
          { text: 'Cart & Checkout', link: '/docs/ux/guest-cart/' },
          { text: 'Order Status', link: '/docs/ux/guest-order-status/' },
          { text: 'Order History', link: '/docs/ux/guest-order-history/' },
        ],
      },
      {
        text: 'Staff',
        items: [
          { text: 'PIN Login', link: '/docs/ux/staff-login/' },
          { text: 'Floor View', link: '/docs/ux/staff-floor/' },
          { text: 'Order Detail', link: '/docs/ux/staff-order-detail/' },
        ],
      },
      {
        text: 'Owner',
        items: [
          { text: 'Dashboard', link: '/docs/ux/owner-dashboard/' },
          { text: 'Menu Management', link: '/docs/ux/owner-menu/' },
          { text: 'Table & QR Management', link: '/docs/ux/owner-tables/' },
          { text: 'Staff Management', link: '/docs/ux/owner-staff/' },
          { text: 'Printer Setup', link: '/docs/ux/owner-printer-setup/' },
        ],
      },
      {
        text: 'Admin',
        items: [
          { text: 'Tenants', link: '/docs/ux/admin-tenants/' },
          { text: 'Pending Approvals', link: '/docs/ux/admin-pending/' },
        ],
      },
    ],
  },
  {
    text: 'Architecture Diagrams',
    items: [
      { text: 'System Overview', link: '/docs/diagrams/system-overview/' },
      { text: 'Data Model', link: '/docs/diagrams/data-model/' },
      { text: 'Order Flow', link: '/docs/diagrams/order-flow/' },
      { text: 'Auth Flow', link: '/docs/diagrams/auth-flow/' },
      { text: 'CloudPRNT Flow', link: '/docs/diagrams/cloudprnt-flow/' },
      { text: 'SignalR Events', link: '/docs/diagrams/signalr-events/' },
    ],
  },
  {
    text: 'Edge Cases',
    items: [{ text: 'Edge Cases', link: '/docs/edge-cases/' }],
  },
]

const viSidebar = [
  {
    text: 'Kế hoạch',
    items: [
      { text: 'Yêu cầu sản phẩm (PRD)', link: '/vi/docs/planning/' },
      { text: 'Tiến độ dự án', link: '/vi/docs/planning/timeline/' },
    ],
  },
  {
    text: 'Kiến trúc',
    items: [{ text: 'Kiến trúc hệ thống', link: '/vi/docs/architecture/' }],
  },
  {
    text: 'User Stories',
    items: [
      { text: 'Epics & Stories', link: '/vi/docs/stories/' },
      { text: 'Đặc tả báo cáo ngày', link: '/vi/docs/stories/daily-report-spec/' },
      { text: 'Đặc tả ca làm việc & Trinkgeld', link: '/vi/docs/stories/staff-sessions-spec/' },
      { text: 'Đặc tả phiên bàn', link: '/vi/docs/stories/table-sessions-spec/' },
    ],
  },
  {
    text: 'In ấn',
    items: [{ text: 'Hướng dẫn CloudPRNT', link: '/vi/docs/printing/' }],
  },
  {
    text: 'Bảng giá',
    items: [{ text: 'Ước tính chi phí', link: '/vi/docs/pricing/' }],
  },
  {
    text: 'Bối cảnh dự án',
    items: [{ text: 'Bối cảnh dự án', link: '/vi/docs/project-context/' }],
  },
  {
    text: 'Thiết kế UX',
    items: [
      {
        text: 'Khách',
        items: [
          { text: 'Duyệt thực đơn', link: '/vi/docs/ux/guest-menu/' },
          { text: 'Chi tiết món', link: '/vi/docs/ux/guest-item-detail/' },
          { text: 'Giỏ hàng & Đặt hàng', link: '/vi/docs/ux/guest-cart/' },
          { text: 'Theo dõi đơn hàng', link: '/vi/docs/ux/guest-order-status/' },
          { text: 'Lịch sử đặt hàng', link: '/vi/docs/ux/guest-order-history/' },
        ],
      },
      {
        text: 'Nhân Viên',
        items: [
          { text: 'Đăng nhập PIN', link: '/vi/docs/ux/staff-login/' },
          { text: 'Màn hình sàn', link: '/vi/docs/ux/staff-floor/' },
          { text: 'Chi tiết đơn hàng', link: '/vi/docs/ux/staff-order-detail/' },
        ],
      },
      {
        text: 'Chủ Nhà Hàng',
        items: [
          { text: 'Tổng quan', link: '/vi/docs/ux/owner-dashboard/' },
          { text: 'Quản lý thực đơn', link: '/vi/docs/ux/owner-menu/' },
          { text: 'Quản lý bàn & QR', link: '/vi/docs/ux/owner-tables/' },
          { text: 'Quản lý nhân viên', link: '/vi/docs/ux/owner-staff/' },
          { text: 'Cài đặt máy in', link: '/vi/docs/ux/owner-printer-setup/' },
        ],
      },
      {
        text: 'Admin',
        items: [
          { text: 'Khách thuê', link: '/vi/docs/ux/admin-tenants/' },
          { text: 'Đơn đăng ký chờ duyệt', link: '/vi/docs/ux/admin-pending/' },
        ],
      },
    ],
  },
  {
    text: 'Sơ đồ kiến trúc',
    items: [
      { text: 'Tổng quan hệ thống', link: '/vi/docs/diagrams/system-overview/' },
      { text: 'Mô hình dữ liệu', link: '/vi/docs/diagrams/data-model/' },
      { text: 'Luồng đặt hàng', link: '/vi/docs/diagrams/order-flow/' },
      { text: 'Luồng xác thực', link: '/vi/docs/diagrams/auth-flow/' },
      { text: 'Luồng CloudPRNT', link: '/vi/docs/diagrams/cloudprnt-flow/' },
      { text: 'Sự kiện SignalR', link: '/vi/docs/diagrams/signalr-events/' },
    ],
  },
  {
    text: 'Trường hợp ngoại lệ',
    items: [{ text: 'Trường hợp ngoại lệ', link: '/vi/docs/edge-cases/' }],
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
