import ldBrand from './src/brand/tokens/tailwind.preset.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [ldBrand],
  theme: {
    extend: {},
  },
  plugins: [],
}
