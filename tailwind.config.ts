import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#012A4A",
        secondary: "#013A63",
        tertiary: "#01497C",
        quaternary: "#014F86",
        accent1: "#2A6F97",
        accent2: "#2C7DA0",
        accent3: "#468FAF",
        accent4: "#61A5C2",
        accent5: "#89C2D9",
        accent6: "#A9D6E5"
      },
    },
  },
  plugins: [],
} satisfies Config;
