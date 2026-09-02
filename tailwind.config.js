/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // ---------------------------------------------------------------------
      // World theming: every color below reads from a CSS custom property
      // (defined in src/index.css :root, then overridden per-World by
      // WorldThemeProvider) instead of a fixed hex value. The
      // `rgb(var(--x) / <alpha-value>)` pattern is what lets Tailwind's
      // opacity modifiers (bg-void/60, border-gold/20, ...) keep working —
      // <alpha-value> is substituted by Tailwind itself at build time.
      // Class names (bg-void, text-gold-bright, font-display, ...) never
      // change between Worlds; only what they point to does. This is the
      // whole trick that avoids re-touching every component per World.
      // ---------------------------------------------------------------------
      colors: {
        void: {
          DEFAULT: "rgb(var(--color-void) / <alpha-value>)",
          panel: "rgb(var(--color-void-panel) / <alpha-value>)",
          panel2: "rgb(var(--color-void-panel2) / <alpha-value>)",
          border: "rgb(var(--color-void-border) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--color-gold) / <alpha-value>)",
          bright: "rgb(var(--color-gold-bright) / <alpha-value>)",
          dim: "rgb(var(--color-gold-dim) / <alpha-value>)",
        },
        ember: {
          DEFAULT: "rgb(var(--color-ember) / <alpha-value>)",
          bright: "rgb(var(--color-ember-bright) / <alpha-value>)",
        },
        arcane: {
          DEFAULT: "rgb(var(--color-arcane) / <alpha-value>)",
          dim: "rgb(var(--color-arcane-dim) / <alpha-value>)",
        },
        emerald: {
          DEFAULT: "rgb(var(--color-emerald) / <alpha-value>)",
          bright: "rgb(var(--color-emerald-bright) / <alpha-value>)",
        },
        parchment: "rgb(var(--color-parchment) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        rune: ["var(--font-rune)", "monospace"],
      },
      backgroundImage: {
        "radial-fade": "radial-gradient(circle at 50% 0%, var(--bg-radial-glow, rgba(139,123,240,0.18)), transparent 60%)",
      },
      boxShadow: {
        seal: "0 0 0 1px rgb(var(--color-gold) / 0.35), 0 0 24px rgb(var(--color-gold) / 0.12)",
        glow: "0 0 30px rgb(var(--color-arcane) / 0.35)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.85)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "bounce-soft": {
          "0%,100%": { transform: "translateY(0)", animationTimingFunction: "cubic-bezier(0.5,0,1,1)" },
          "50%": { transform: "translateY(-14%)", animationTimingFunction: "cubic-bezier(0,0,0.5,1)" },
        },
        tada: {
          "0%": { transform: "scale(1) rotate(0)" },
          "10%,20%": { transform: "scale(0.9) rotate(-4deg)" },
          "30%,50%,70%,90%": { transform: "scale(1.08) rotate(4deg)" },
          "40%,60%,80%": { transform: "scale(1.08) rotate(-4deg)" },
          "100%": { transform: "scale(1) rotate(0)" },
        },
        "sparkle-pop": {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: 0 },
          "50%": { transform: "scale(1.3) rotate(180deg)", opacity: 1 },
          "100%": { transform: "scale(1) rotate(360deg)", opacity: 0.9 },
        },
        "glow-pulse": {
          "0%,100%": { boxShadow: "0 0 10px rgba(232,178,77,0.25)" },
          "50%": { boxShadow: "0 0 24px rgba(232,178,77,0.55)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "spin-slow": "spin-slow 12s linear infinite",
        "pop-in": "pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        wiggle: "wiggle 0.5s ease-in-out infinite",
        "bounce-soft": "bounce-soft 1.4s infinite",
        tada: "tada 0.9s ease-in-out",
        "sparkle-pop": "sparkle-pop 0.7s ease-out forwards",
        "glow-pulse": "glow-pulse 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
