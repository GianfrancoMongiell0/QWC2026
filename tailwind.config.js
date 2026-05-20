/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        wc: {
          dark:             '#0A0A0F',
          darker:           '#06060A',
          surface:          '#12121A',
          border:           '#1E1E2E',
          green:            '#00FF87',
          'green-dim':      '#00CC6A',
          blue:             '#00D4FF',
          'blue-dim':       '#00A8CC',
          purple:           '#8B5CF6',
          red:              '#FF3366',
          gold:             '#FFD700',
          'text-primary':   '#F0F0FF',
          'text-secondary': '#8888AA',
          'text-muted':     '#555570',
        }
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-green':  '0 0 20px rgba(0,255,135,0.4)',
        'neon-blue':   '0 0 20px rgba(0,212,255,0.4)',
        'neon-red':    '0 0 20px rgba(255,51,102,0.4)',
        'card-hover':  '0 8px 40px rgba(0,212,255,0.15)',
      },
      borderRadius: { 'xl2': '1rem' },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'slide-up':   'slideUp 0.3s ease-out',
        'fade-in':    'fadeIn 0.2s ease-out',
      },
      keyframes: {
        'pulse-neon': { '0%,100%': { opacity:'1' }, '50%': { opacity:'0.5' } },
        slideUp:  { from: { opacity:'0', transform:'translateY(12px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn:   { from: { opacity:'0' }, to: { opacity:'1' } },
      },
    },
  },
  plugins: [],
}
