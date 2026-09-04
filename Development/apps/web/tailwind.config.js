/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        // Backgrounds
        void: "rgb(var(--color-void) / <alpha-value>)",
        base: "rgb(var(--color-base) / <alpha-value>)",

        // Surfaces
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          1: "rgb(var(--color-surface-1) / <alpha-value>)",
          2: "rgb(var(--color-surface-2) / <alpha-value>)",
          3: "rgb(var(--color-surface-3) / <alpha-value>)",
        },

        // Borders
        border: {
          subtle: "rgb(var(--color-border-subtle) / <alpha-value>)",
          normal: "rgb(var(--color-border-normal) / <alpha-value>)",
          active: "rgb(var(--color-border-active) / <alpha-value>)",
        },

        // Brand Palette (Thermal / Fire Emphasis)
        brand: {
          orange: "rgb(var(--color-brand-orange) / <alpha-value>)",
          amber: "rgb(var(--color-brand-amber) / <alpha-value>)",
          glow: "rgb(var(--color-brand-orange) / 0.15)",
        },

        // Intelligence / AI Accents
        intelligence: {
          cyan: "rgb(var(--color-intelligence-cyan) / <alpha-value>)",
          glow: "rgb(var(--color-intelligence-cyan) / 0.15)",
        },

        // Semantic Statuses
        status: {
          critical: "rgb(var(--color-status-critical) / <alpha-value>)",
          warning: "rgb(var(--color-status-warning) / <alpha-value>)",
          success: "rgb(var(--color-status-success) / <alpha-value>)",
          info: "rgb(var(--color-status-info) / <alpha-value>)",
        },

        // Text Colors
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "brand-glow": "0 0 20px -3px rgba(255, 122, 24, 0.25)",
        "cyan-glow": "0 0 20px -3px rgba(49, 199, 212, 0.25)",
      },
      keyframes: {
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        radar: "radar 8s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
