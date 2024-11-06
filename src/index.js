import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Importar estilos globales
import './index.css'; // Para Tailwind y estilos globales

// Manejo de errores en desarrollo
if (process.env.NODE_ENV === 'development') {
  const errorHandler = (error) => {
    console.error('Error de renderizado:', error);
  };

  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', errorHandler);
}

// Obtener el elemento raíz
const rootElement = document.getElementById('root');

// Verificar si el elemento existe
if (!rootElement) {
  throw new Error('No se encontró el elemento root en el DOM');
}

// Crear la raíz de React
const root = createRoot(rootElement);

// Renderizar la aplicación
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Eliminar el splash screen si existe
const splashScreen = document.getElementById('splash-screen');
if (splashScreen) {
  splashScreen.style.opacity = '0';
  setTimeout(() => {
    splashScreen.remove();
  }, 500);
}
