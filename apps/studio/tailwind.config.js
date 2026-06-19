/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lexend', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        harbor: {
          surface: '#1a1a18',
          'surface-alt': '#2d2d2a',
          border: '#3a3a38',
          'border-light': '#2d2d2a',
          'border-input': '#404040',
          'text-heading': '#f3f4f6',
          'text-body': '#d1d5db',
          'text-secondary': '#9ca3af',
          'text-muted': '#6b7280',
          'text-primary': '#e5e7eb',
          'icon-muted': '#6b7280',
          'card-bg': '#2d2d2a',
          'control-bg': '#2d2d2a',
          'control-hover': '#404040',
          'control-active': '#3a3a38',
          danger: '#f87171',
          'nav-active': '#2d1f5e',
        },
        walrus: {
          50: '#f3e8ff',
          100: '#e4d5ff',
          200: '#c8abff',
          300: '#a87eff',
          400: '#8b5cf6',
          500: '#7828c8',
          600: '#5b21b6',
          700: '#4c1d95',
          800: '#3b0f7a',
          900: '#2d1f5e',
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
        'particle-flow': 'particle-flow 1.5s linear infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.5, transform: 'scale(0.8)' },
        },
        'particle-flow': {
          '0%': { offsetDistance: '0%' },
          '100%': { offsetDistance: '100%' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
