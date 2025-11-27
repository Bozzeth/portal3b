/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // 👈 this enables dark mode support
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
     backgroundImage: {
        hero: "url('/hero-bg.png')",
      },
    },
  },
  plugins: [],
};