// WarmPath Design System - Light + Blue (matches landing page)
export const COLORS = {
  // Backgrounds
  bg: {
    primary: "#ffffff",
    secondary: "#f8f9fb",
    tertiary: "#f1f5f9",
    quaternary: "#e2e8f0",
    variant: "#e2e8f0",
    lowest: "#f8fafc",
  },

  // Text
  text: {
    primary: "#0f172a",
    secondary: "#475569",
    tertiary: "#64748b",
  },

  // Borders
  border: {
    primary: "#e2e8f0",
    secondary: "#f1f5f9",
  },

  // Accent Colors
  accent: {
    blue: "#2563eb",
    emerald: "#10b981",
    emeraldContainer: "#d1fae5",
  },

  // Light Variants
  light: {
    blue: "#eff6ff",
    emerald: "#d1fae5",
  },
};

// Tailwind class mappings
export const STYLE_CLASSES = {
  // Cards
  card: `rounded-md border`,
  cardBg: (_isDark = false) => `bg-white border-[#e2e8f0]`,

  // Buttons
  buttonPrimary: `bg-[#2563eb] text-white hover:bg-[#1d4ed8]`,
  buttonSecondary: `border border-[#e2e8f0] text-[#0f172a] hover:bg-[#f1f5f9]`,
  buttonGhost: `text-[#64748b] hover:text-[#0f172a]`,

  // Text
  textPrimary: `text-[#0f172a]`,
  textSecondary: `text-[#475569]`,
  textTertiary: `text-[#64748b]`,

  // Backgrounds
  bgPrimary: `bg-white`,
  bgCard: `bg-white`,
  bgSurface: `bg-[#f8f9fb]`,

  // Borders
  borderPrimary: `border-[#e2e8f0]`,
  borderSecondary: `border-[#f1f5f9]`,
};
