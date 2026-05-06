/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yvv: {
          charcoal: '#1F2937', 
          charcoalDark: '#111827', 
          cyan: '#00F0FF', 
          cyanGlow: '#80FBFF' 
        }
      }
    },
  },
  plugins: [],
}