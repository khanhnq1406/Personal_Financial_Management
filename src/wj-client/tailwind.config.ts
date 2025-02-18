import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        bg: "#008148",
        fg: "#F7F8FC",
        hgreen: "var(--btn-green)",
        lred: "#C3151C",
        hover: "#c5c5c9",
        modal: "rgba(0, 0, 0, 0.5)",
      },
      dropShadow: {
        round: "0px 0px 3px rgb(0 0 0 / 0.4)",
      },
    },
  },
  plugins: [],
} satisfies Config;
