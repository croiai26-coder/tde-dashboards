import type { Config } from "tailwindcss";

// The TDE HQ dashboard is rendered with exact inline styles (see components/*)
// to preserve the high-fidelity design hand-off pixel-for-pixel. Tailwind is
// configured here so the design tokens are available for any future extension.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "#f6f4ef",
        ink: {
          primary: "#2a2621",
          body: "#3a352e",
          secondary: "#5f5b54",
          muted: "#8f8a82",
          faint: "#a29d94",
          faintest: "#b8b2a8",
        },
        accent: "#5b8def",
        pastel: {
          blue: "#9fb8e6",
          sage: "#9fd6c0",
          peach: "#e8b6a0",
          lilac: "#c6aee0",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-instrument)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px #0000000a",
      },
    },
  },
  plugins: [],
};

export default config;
