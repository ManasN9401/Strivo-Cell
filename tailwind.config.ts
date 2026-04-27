import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cinema: {
          bg:            '#0e0e0e',
          surface:       '#1a1a1a',
          accent:        '#0915e6',
          'accent-hover':'#0712c4',
          border:        'rgba(255,255,255,0.06)',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
      },
      maxWidth: {
        content: '1440px',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up':  'fade-up 0.35s ease-out forwards',
        'scale-in': 'scale-in 0.2s ease-out forwards',
        'fade-in':  'fade-in 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
