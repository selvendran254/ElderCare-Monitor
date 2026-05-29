/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Tamil', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        normal: '#10b981',
        warning: '#f59e0b',
        critical: '#ef4444',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        card: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05), 0 12px 24px rgba(0,0,0,0.05)',
        glow: '0 0 40px rgba(16,185,129,0.15)',
        'glow-red': '0 0 40px rgba(239,68,68,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'mesh': 'radial-gradient(at 40% 20%, rgba(16,185,129,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(6,182,212,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(99,102,241,0.08) 0px, transparent 50%)',
        'auth-pattern': 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #0d9488 100%)',
      },
    },
  },
  plugins: [],
};
