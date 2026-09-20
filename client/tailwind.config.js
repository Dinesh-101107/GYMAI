/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gym: {
          darkest: '#0A0A0C',
          dark: '#111114',
          card: '#18181C',
          plate: '#222228',
          border: '#2A2A32',
          muted: '#8E8E9F',
          text: '#F1F1F4',
          subtext: '#B0B0C0',
          // Accents
          red: '#E63946',          // Iron-plate red
          redHover: '#D62839',
          green: '#2E8B57',        // Kettlebell green
          greenBright: '#38B000',
          amber: '#E09F3E',        // Chalk gold / expiring
          blue: '#1D3557',         // 35lb Olympic plate blue
          yellow: '#F4A261',       // 25lb Olympic plate yellow
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', '"Oswald"', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'plate': '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'plate-hover': '0 8px 30px -4px rgba(230, 57, 70, 0.15), 0 0 0 1px rgba(230, 57, 70, 0.3)',
        'glow-red': '0 0 25px -3px rgba(230, 57, 70, 0.4)',
        'glow-green': '0 0 25px -3px rgba(46, 139, 87, 0.4)',
      },
      animation: {
        'barbell-load': 'barbell 1.5s ease-in-out infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        barbell: {
          '0%, 100%': { transform: 'translateX(-20%) scaleX(0.7)' },
          '50%': { transform: 'translateX(20%) scaleX(1)' },
        },
      },
    },
  },
  plugins: [],
}
