/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d8e2fd',
          300: '#bacafb',
          400: '#a3bdfd',
          500: '#8ba7ff',
          600: '#9fb2fd',
          700: '#7a8ce6',
          800: '#6271c4',
          900: '#525da3',
          950: '#303763',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-border-light': 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
        'glass-border-dark': 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'neon-brand': '0 0 20px 0 rgba(194, 129, 49, 0.5)',
      },
      animation: {
        'blob': 'blob 7s infinite',
        'text-shimmer': 'text-shimmer 2.5s ease-out infinite alternate',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'text-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}
