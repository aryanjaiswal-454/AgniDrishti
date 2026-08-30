/**
 * AgniDrishti Design System Tokens
 * SIH26162 — AI-Powered Thermal Intelligence
 */

export const colors = {
  background: {
    void: "#07090C",
    base: "#0B0F14",
  },
  surfaces: {
    surface: "#10151C",
    surface2: "#151B23",
    surface3: "#1B222C",
  },
  borders: {
    subtle: "#202832",
    normal: "#2A3440",
    active: "#394552",
  },
  brand: {
    orange: "#FF7A18",
    amber: "#FFB547",
  },
  intelligence: {
    cyan: "#31C7D4",
  },
  status: {
    critical: "#FF4D5A",
    warning: "#FFB547",
    success: "#39D98A",
    info: "#5CA9FF",
  },
  text: {
    primary: "#F0F4F8",
    secondary: "#9BA3AF",
    muted: "#636D7E",
  },
} as const;

export const radii = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
} as const;

export const typography = {
  fontDisplay: "Space Grotesk, sans-serif",
  fontSans: "Inter, sans-serif",
  fontMono: "JetBrains Mono, monospace",
} as const;

