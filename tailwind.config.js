/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Cameroon flag palette - rich, saturated
        cameroon: {
          green: '#007A5E',       // flag green (primary)
          'green-deep': '#00563F',
          'green-light': '#1FA47A',
          red: '#CE1126',          // flag red (accent)
          'red-deep': '#9A0D1D',
          'red-light': '#E94B5C',
          yellow: '#FCD116',       // flag yellow (highlight)
          'yellow-deep': '#D4A800',
          'yellow-light': '#FFE066',
          earth: '#6B3410',        // savanna/laterite
          ivory: '#FFF7E6',        // warm bg
          night: '#0A1F1A',        // deep green-black
        },
        // Legacy aliases retained for backward compatibility
        'medical-green': '#10B981',
        'medical-blue': '#0EA5E9',
        'cameroon-green': '#007A5E',
        brand: {
          primary: '#007A5E',
          success: '#1FA47A',
          warning: '#FCD116',
          danger: '#CE1126',
          waspito: '#FCD116',
        },
      },
      backgroundImage: {
        'cameroon-gradient': 'linear-gradient(135deg, #007A5E 0%, #CE1126 50%, #FCD116 100%)',
        'cameroon-gradient-soft': 'linear-gradient(135deg, rgba(0,122,94,0.92) 0%, rgba(206,17,38,0.85) 55%, rgba(252,209,22,0.92) 100%)',
        'cameroon-flag': 'linear-gradient(90deg, #007A5E 33.33%, #CE1126 33.33% 66.66%, #FCD116 66.66%)',
        'jungle': 'radial-gradient(ellipse at top, #1FA47A 0%, #007A5E 45%, #00563F 100%)',
        'savanna': 'linear-gradient(180deg, #FFE066 0%, #FCD116 45%, #D4A800 100%)',
        'sunset': 'linear-gradient(135deg, #CE1126 0%, #FCD116 100%)',
        'aurora': 'conic-gradient(from 180deg at 50% 50%, #007A5E 0deg, #1FA47A 90deg, #FCD116 180deg, #CE1126 270deg, #007A5E 360deg)',
      },
      boxShadow: {
        'cameroon': '0 20px 60px -12px rgba(0,122,94,0.45)',
        'cameroon-glow': '0 0 60px rgba(31,164,122,0.55)',
        'sunset-glow': '0 0 60px rgba(252,209,22,0.45)',
        'red-glow': '0 0 60px rgba(206,17,38,0.45)',
        'premium': '0 30px 80px -20px rgba(0,86,63,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
        'inner-gold': 'inset 0 1px 0 rgba(255,224,102,0.4)',
      },
      animation: {
        'shimmer': 'shimmer 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        'spin-slow': 'spin 18s linear infinite',
        'logo-spin': 'logo-spin 14s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'star-twinkle': 'star-twinkle 2.5s ease-in-out infinite',
        'aurora': 'aurora 12s ease infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'logo-spin': {
          '0%, 100%': { transform: 'rotateY(0deg) rotateX(8deg)' },
          '50%': { transform: 'rotateY(360deg) rotateX(8deg)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'star-twinkle': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
