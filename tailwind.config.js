/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffe',
          300: '#7cc4fd',
          400: '#36a7f9',
          500: '#0c8eea',
          600: '#0070c8',
          700: '#0159a2',
          800: '#064d86',
          900: '#0a3f6f',
          950: '#07284a',
        },
        slate: {
          850: '#1a2436',
          950: '#0d1525',
        }
      },
    },
  },
  plugins: [],
}
