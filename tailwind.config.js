/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef2ff",
          100: "#e0e7ff",
          600: "#1e3a8a",
          700: "#1e3070",
          800: "#172554",
          900: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
