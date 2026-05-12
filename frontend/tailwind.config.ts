import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        panel: "#121933",
        border: "#232b4d",
        soft: "#97a0c3",
        danger: "#ff6363",
        warning: "#ffb84d",
        success: "#73e0a9",
      },
    },
  },
  plugins: [],
};

export default config;
