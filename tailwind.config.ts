import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Primary teal palette
        primary: {
          DEFAULT: "#1D9E75",
          dark: "#085041",
          mid: "#0F6E56",
          light: "#E1F5EE",
          border: "#9FE1CB",
          50: "#E1F5EE",
          100: "#C3EBE0",
          200: "#9FE1CB",
          300: "#5DCAA5",
          400: "#1D9E75",
          500: "#1D9E75",
          600: "#0F6E56",
          700: "#085041",
          800: "#053A2F",
          900: "#032A22",
        },
        // Blue accent
        blue: {
          DEFAULT: "#185FA5",
          light: "#E6F1FB",
          50: "#E6F1FB",
          100: "#C5DEFA",
          200: "#8FBDF5",
          500: "#185FA5",
          600: "#134D88",
          700: "#0E3B6B",
        },
        // Purple accent (AI features)
        purple: {
          DEFAULT: "#534AB7",
          light: "#EEEDFE",
          50: "#EEEDFE",
          100: "#D8D5FD",
          200: "#B5B0FB",
          500: "#534AB7",
          600: "#433C95",
          700: "#332E73",
        },
        // Amber (warnings)
        amber: {
          DEFAULT: "#BA7517",
          light: "#FAEEDA",
          50: "#FAEEDA",
          100: "#F5DDB5",
          500: "#BA7517",
          600: "#633806",
          text: "#633806",
        },
        // Red (errors, overdue)
        red: {
          DEFAULT: "#A32D2D",
          light: "#FCEBEB",
          50: "#FCEBEB",
          100: "#F7C1C1",
          500: "#A32D2D",
          600: "#8A2424",
        },
        // Green (available/success)
        green: {
          DEFAULT: "#3B6D11",
          light: "#EAF3DE",
          50: "#EAF3DE",
          500: "#3B6D11",
        },
        // Gray
        gray: {
          DEFAULT: "#73726c",
          text: "#3d3d3a",
          muted: "#73726c",
          50: "#F8F7F4",
          100: "#F0EFEC",
          200: "#E5E4E0",
          300: "#D4D3CF",
          400: "#A3A29E",
          500: "#73726c",
          600: "#52514C",
          700: "#3d3d3a",
          800: "#2A2A28",
          900: "#1A1A18",
        },
        background: "#F8F7F4",
        foreground: "#3d3d3a",
      },
      maxWidth: {
        site: "1200px",
      },
      fontSize: {
        "caption": ["12px", { lineHeight: "1.5" }],
        "small": ["13px", { lineHeight: "1.5" }],
        "body": ["16px", { lineHeight: "1.7" }],
        "h3": ["20px", { lineHeight: "1.4", fontWeight: "500" }],
        "h2": ["28px", { lineHeight: "1.3", fontWeight: "500" }],
        "h1": ["36px", { lineHeight: "1.2", fontWeight: "500" }],
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
