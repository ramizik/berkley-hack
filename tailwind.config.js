/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0f172a',
          lighter: '#1e293b',
          accent: '#334155'
        },
        purple: {
          DEFAULT: '#8b5cf6',
          accent: '#7c3aed',
          light: '#a78bfa',
          dark: '#5b21b6'
        },
        red: {
          DEFAULT: '#ef4444',
          accent: '#dc2626',
          light: '#f87171',
          dark: '#991b1b'
        },
        blue: {
          DEFAULT: '#3b82f6',
          accent: '#2563eb',
          light: '#60a5fa',
          dark: '#1d4ed8'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #7c3aed 0%, #dc2626 50%, #2563eb 100%)',
        'gradient-secondary': 'linear-gradient(45deg, #8b5cf6 0%, #ef4444 50%, #3b82f6 100%)',
      }
    },
  },
  plugins: [],
};