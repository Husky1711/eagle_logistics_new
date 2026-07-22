/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f2fa',
          100: '#d0e7f5',
          200: '#add7ef',
          300: '#7abce3',
          400: '#428BCA',
          500: '#1572B7',
          600: '#0f5f96',
          700: '#0a4d7a',
          800: '#0c3f63',
          900: '#0a3352',
        },
        /* Live site (eaglelogistics.in) typography colors */
        heading: {
          DEFAULT: '#1572B7',
          bright: '#0C89CA',
          link: '#428BCA',
          footer: '#4db8e8',
        },
        ink: {
          DEFAULT: '#333333',
          soft: '#555555',
        },
        gold: {
          400: '#5BA3D0',
          500: '#1572B7',
          600: '#0f5f96',
        },
        dark: {
          DEFAULT: '#171717',
          deep: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        container: '1280px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(0, 0, 0, 0.08)',
        medium: '0 4px 20px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
