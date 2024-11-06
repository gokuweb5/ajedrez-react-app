/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Asegúrate de incluir todos los archivos donde usarás Tailwind
  ],
  theme: {
    extend: {
      // Colores personalizados para el juego de ajedrez
      colors: {
        'chess-white': '#f0d9b5',
        'chess-black': '#b58863',
        'primary': {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#60a5fa',
        },
        'secondary': {
          DEFAULT: '#1e40af',
          dark: '#1e3a8a',
          light: '#3b82f6',
        },
      },
      // Tamaños personalizados para el tablero
      spacing: {
        'chess-square': '4rem', // 64px
        'chess-board': '32rem', // 512px
      },
      // Sombras personalizadas
      boxShadow: {
        'piece': '0 2px 5px rgba(0, 0, 0, 0.2)',
        'board': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      // Fuentes personalizadas
      fontFamily: {
        'chess': ['Roboto', 'sans-serif'],
      },
      // Animaciones personalizadas
      animation: {
        'piece-hover': 'piece-hover 0.3s ease-in-out',
        'move': 'move 0.5s ease-in-out',
      },
      keyframes: {
        'piece-hover': {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'move': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      // Breakpoints personalizados
    },
  },
  plugins: [],
}
