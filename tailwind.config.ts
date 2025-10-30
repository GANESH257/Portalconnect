import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        alata: ['Alata', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Healthcare design color schemes
        'scheme-1': {
          bg: "hsl(var(--scheme-1-bg))",
          text: "hsl(var(--scheme-1-text))",
          fg: "hsl(var(--scheme-1-fg))",
        },
        'scheme-2': {
          bg: "hsl(var(--scheme-2-bg))",
          text: "hsl(var(--scheme-2-text))",
          border: "hsl(var(--scheme-2-border))",
        },
        'scheme-3': {
          bg: "hsl(var(--scheme-3-bg))",
          text: "hsl(var(--scheme-3-text))",
          border: "hsl(var(--scheme-3-border))",
        },
        'scheme-4': {
          bg: "hsl(var(--scheme-4-bg))",
          text: "hsl(var(--scheme-4-text))",
        },
        'scheme-5': {
          bg: "hsl(var(--scheme-5-bg))",
          text: "hsl(var(--scheme-5-text))",
          fg: "hsl(var(--scheme-5-fg))",
          border: "hsl(var(--scheme-5-border))",
        },
        // NEW THEME: Blue-Yellow Character-Based Design
        'theme': {
          'blue-primary': "hsl(var(--theme-blue-primary))",
          'blue-secondary': "hsl(var(--theme-blue-secondary))",
          'yellow-primary': "hsl(var(--theme-yellow-primary))",
          'yellow-secondary': "hsl(var(--theme-yellow-secondary))",
          'white': "hsl(var(--theme-white))",
          'light-blue': "hsl(var(--theme-light-blue))",
          'pink': "hsl(var(--theme-pink))",
          'purple': "hsl(var(--theme-purple))",
          'orange': "hsl(var(--theme-orange))",
          'dark-blue': "hsl(var(--theme-dark-blue))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
