/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#1E2A5A', 50: '#EEF0F7', 100: '#D9DDEC', 200: '#B3BAD7', 300: '#7F8AB8', 400: '#55619A', 500: '#34417A', 600: '#1E2A5A', 700: '#18224A', 800: '#121A39', 900: '#0C1228' },
        marigold: { DEFAULT: '#F2A93B', 50: '#FEF6E8', 100: '#FCEACC', 200: '#F9D598', 300: '#F6C064', 400: '#F2A93B', 500: '#DD8F1C', 600: '#B27014', 700: '#86530F' },
        wall: { DEFAULT: '#F2F4EE', 2: '#E6EAE0', 3: '#D5DBCD' },
        neem: { DEFAULT: '#2E6A4E', 50: '#E8F2EC', 100: '#CBE2D5', 500: '#2E6A4E', 600: '#245540' },
        sindoor: { DEFAULT: '#C23A2E', 50: '#FBEAE8', 100: '#F5CBC6', 500: '#C23A2E' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
};
