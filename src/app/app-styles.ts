// WarmBlue Design System - Updated Color Palette
export const COLORS = {
  // Backgrounds
  bg: {
    primary: "#131315", // Main background
    secondary: "#1c1b1d", // Surface-container-low
    tertiary: "#201f22", // Surface-container
    quaternary: "#2a2a2c", // Surface-container-high
    variant: "#353437", // Surface-variant
    lowest: "#0e0e10", // Surface-container-lowest
  },

  // Text
  text: {
    primary: "#e5e1e4", // on-surface
    secondary: "#c7c4d7", // on-surface-variant
    tertiary: "#908fa0", // outline/muted
  },

  // Borders
  border: {
    primary: "#464554", // outline-variant
    secondary: "#27272a", // micro-border
  },

  // Accent Colors
  accent: {
    blue: "#2563eb", // primary/blue
    emerald: "#4edea3", // secondary
    emeraldContainer: "#00a572", // secondary-container
  },

  // Light Variants
  light: {
    indigo: "#c0c1ff", // primary light
    emerald: "#6ffbbe", // secondary fixed
  },
};

// Tailwind class mappings
export const STYLE_CLASSES = {
  // Cards
  card: `rounded-md border`,
  cardBg: (isDark = true) =>
    isDark ? `bg-[#201f22] border-[#464554]` : `bg-[#18181b] border-[#27272a]`,

  // Buttons
  buttonPrimary: `bg-[#2563eb] text-white hover:bg-[#1d4ed8]`,
  buttonSecondary: `border border-[#464554] text-[#e5e1e4] hover:bg-[#2a2a2c]`,
  buttonGhost: `text-[#c7c4d7] hover:text-[#e5e1e4]`,

  // Text
  textPrimary: `text-[#e5e1e4]`,
  textSecondary: `text-[#c7c4d7]`,
  textTertiary: `text-[#908fa0]`,

  // Backgrounds
  bgPrimary: `bg-[#131315]`,
  bgCard: `bg-[#201f22]`,
  bgSurface: `bg-[#1c1b1d]`,

  // Borders
  borderPrimary: `border-[#464554]`,
  borderSecondary: `border-[#27272a]`,
};
