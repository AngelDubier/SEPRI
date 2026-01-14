import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    const removeLoader = () => {
      const loader = document.getElementById('app-initial-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 400);
      }
    };

    if (document.readyState === 'complete') {
      removeLoader();
    } else {
      window.addEventListener('load', removeLoader);
      // Fallback por seguridad
      setTimeout(removeLoader, 2000);
    }
  } catch (err) {
    console.error("Fallo crítico en el montaje de la aplicación:", err);
    rootElement.innerHTML = `<div style="padding:40px; text-align:center; font-family:sans-serif;">Error al cargar el sistema. Por favor recargue la página.</div>`;
  }
}