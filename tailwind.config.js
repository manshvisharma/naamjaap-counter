/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        divine: {
          dark: '#0f0c0c',
          card: '#1c1917',
          gold: '#fbbf24',
          goldDim: '#b45309',
          text: '#fef3c7',
        }
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}