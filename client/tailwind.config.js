/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        coral: {
          50: '#fff1f0',
          100: '#ffe4e1',
          200: '#ffccc7',
          300: '#ffa39e',
          400: '#ff7875',
          500: '#ff4d4f',
          600: '#f5222d',
          700: '#cf1322',
        },
        tangerine: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        mint: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 10px 30px -5px rgba(99, 102, 241, 0.07), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 20px 35px -5px rgba(99, 102, 241, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.06)',
        'glow-brand': '0 0 25px -5px rgba(99, 102, 241, 0.3)',
        'glow-orange': '0 0 25px -5px rgba(249, 115, 22, 0.35)',
      }
    },
  },
  plugins: [],
}
