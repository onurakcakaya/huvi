/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        // Marka Renklerimiz
        primary: {
          50: '#fcf6f5',
          100: '#f7ebe9',
          200: '#eddcd8',
          300: '#dec2bc',
          400: '#c89d96',
          500: '#b07d75', // Esas Rose Gold (Bakır)
          600: '#99665f',
          700: '#7f514b',
          800: '#69433e',
          900: '#553935',
        },
        dark: {
          900: '#0f172a', // Simsiyah yerine koyu lacivert/gri
        }
      }
    },
  },
  plugins: [],
}