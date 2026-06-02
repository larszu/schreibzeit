/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ruhige, papierhafte Farbwelt mit klaren Akzenten.
        paper: {
          50: '#faf8f3',
          100: '#f6f3ec',
          200: '#ece6d8',
          300: '#ddd3bf',
        },
        ink: {
          DEFAULT: '#2b2a26',
          soft: '#54514a',
          faint: '#8a8678',
        },
        brand: {
          50: '#eef6f3',
          100: '#d6ebe4',
          200: '#aed8cb',
          300: '#7fbfac',
          400: '#52a48d',
          500: '#2f6f5e',
          600: '#255a4c',
          700: '#1f483d',
          800: '#193a32',
          900: '#142f29',
        },
        accent: {
          400: '#e0a458',
          500: '#cf8a36',
          600: '#b3712a',
        },
        danger: {
          500: '#c0492f',
          600: '#a23a24',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(43,42,38,0.06), 0 4px 16px rgba(43,42,38,0.06)',
        card: '0 1px 3px rgba(43,42,38,0.08), 0 8px 24px rgba(43,42,38,0.05)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
};
