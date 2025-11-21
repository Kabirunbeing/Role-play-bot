/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pure black & white base
        'pure-black': '#000000',
        'pure-white': '#ffffff',
        'off-black': '#0a0a0a',
        'off-white': '#f5f5f5',
        'dark-gray': '#1a1a1a',
        'light-gray': '#e0e0e0',
        'mid-gray': '#404040',
        
        // Vibrant accent colors
        'neon-green': '#00ff41',
        'neon-cyan': '#00f0ff',
        'neon-yellow': '#ffff00',
        'neon-pink': '#ff006e',
        'neon-purple': '#b026ff',
        'electric-blue': '#0066ff',
        
        // Softer accent alternatives
        'lime': '#84cc16',
        'teal': '#14b8a6',
        'amber': '#fbbf24',
        'rose': '#fb7185',
      },
      fontFamily: {
        'display': ['"Sora"', 'system-ui', 'sans-serif'],
        'body': ['"Poppins"', 'system-ui', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 255, 65, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.5)',
        'neon-yellow': '0 0 20px rgba(255, 255, 0, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 0, 110, 0.5)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite reverse',
      }
    },
  },
  plugins: [],
}