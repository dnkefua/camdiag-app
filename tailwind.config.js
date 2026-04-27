/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-green': '#10B981',
        'medical-blue': '#0EA5E9',
        'cameroon-green': '#007A5E',
        'brand': {
          primary: '#007AFF',
          success: '#34C759',
          warning: '#FF9500',
          danger: '#FF3B30',
          waspito: '#FFD700',
        }
      }
    },
  },
  plugins: [],
}