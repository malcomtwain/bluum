/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        dark: {
          DEFAULT: '#0e0f15',
          secondary: '#18181a',
        },
      },
      backgroundColor: {
        dark: {
          DEFAULT: '#0e0f15',
          secondary: '#18181a',
        },
      },
      textColor: {
        dark: {
          DEFAULT: '#ffffff',
        },
      },
    },
  },
  plugins: [],
} 