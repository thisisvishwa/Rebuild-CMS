import type { Config } from "tailwindcss";

/**
 * Brand palette for "Rebuild" — a calm, warm, editorial self-development aesthetic.
 * The emotional progression runs:
 *   Pain (muted, muted earth) → Clarity → Hope → Strength → New Beginning (warm, bright).
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF7",
          100: "#F9F4EB",
          150: "#F5EEE2",
          200: "#EFE6D6",
          300: "#E5D8C2",
        },
        sand: {
          100: "#EAE0D0",
          200: "#DCCDB4",
          300: "#C9B494",
          400: "#B49C78",
          500: "#9A8260",
        },
        sage: {
          50: "#F1F3EC",
          100: "#E6EAE0",
          200: "#CFD8C8",
          300: "#AeBfA6",
          400: "#8CA384",
          500: "#6E8567",
        },
        clay: {
          100: "#F2E4DD",
          200: "#E3C9BC",
          300: "#D2AE98",
          400: "#BC8F76",
        },
        charcoal: {
          50: "#F5F4F1",
          100: "#E4E2DC",
          200: "#C9C6BD",
          300: "#A7A39A",
          400: "#8A867D",
          500: "#6B675F",
          600: "#514D46",
          700: "#3A3833",
          800: "#2C2A26",
          900: "#211F1B",
          950: "#14130F",
        },
        gold: {
          100: "#F6EEDC",
          200: "#EDDFBE",
          300: "#DFC795",
          400: "#CBAB64",
          500: "#B9963F",
          600: "#A2832F",
          700: "#7E6526",
        },
        sunrise: {
          // Warm dawn gradient used in the "new beginning" finale.
          50: "#FDF4E9",
          100: "#FBE8CF",
          200: "#F6D3A8",
          300: "#EBB87E",
        },
        // Admin dashboard palette — a crisp, professional neutral scale derived
        // from the brand (use via `admin-*`). Works with dark sidebar + light content.
        "admin-bg": "#F6F6F4",
        "admin-panel": "#FFFFFF",
        "admin-border": "#E7E5E1",
        "admin-sidebar": "#1C1B18",
        "admin-sidebar-hover": "#2A2925",
        "admin-link": "#B8B4AB",
        "admin-ink": "#242320",
        "admin-muted": "#7A766D",
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "ui-serif", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        "8xl": "88rem",
      },
      boxShadow: {
        soft: "0 20px 50px -25px rgba(33, 31, 27, 0.22)",
        card: "0 30px 70px -40px rgba(33, 31, 27, 0.18)",
        lift: "0 18px 40px -18px rgba(33, 31, 27, 0.28)",
        gold: "0 18px 36px -16px rgba(163, 130, 47, 0.5)",
      },
      borderRadius: {
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(22px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.6s ease both",
        "scale-in": "scale-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
