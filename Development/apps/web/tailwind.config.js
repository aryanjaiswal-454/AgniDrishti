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
        void: "#07090C",
        base: "#0B0F14",

        // Surfaces
        surface: {
          DEFAULT: "#10151C",
          2: "#151B23",
          3: "#1B222C",
        },

        // Borders
        border: {
          subtle: "#202832",
          normal: "#2A3440",
          active: "#394552",
        },

        // Brand Palette (Thermal / Fire Emphasis)
        brand: {
          orange: "#FF7A18",
          amber: "#FFB547",
          glow: "rgba(255, 122, 24, 0.15)",
        },

        // Intelligence / AI Accents
        intelligence: {
          cyan: "#31C7D4",
          glow: "rgba(49, 199, 212, 0.15)",
        },

        // Semantic Statuses
        status: {
          critical: "#FF4D5A",
          warning: "#FFB547",
          success: "#39D98A",
          info: "#5CA9FF",
        },

        // Text Colors
        text: {
          primary: "#F0F4F8",
          secondary: "#9BA3AF",
          muted: "#636D7E",
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
