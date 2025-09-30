import React from "react";
import ReactDOM from "react-dom/client";
import { getI18n } from "react-i18next";
import App from "./App";
import "./index.css";
import "./i18n";

// Verificar localStorage para tema
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Usar tema claro como padrão, apenas usar dark se explicitamente salvo como 'dark'
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
  // Se o tema não foi salvo ainda, definir como light por padrão
  if (!savedTheme) {
    localStorage.setItem('theme', 'light');
  }
}

// Verificar idioma
const savedLanguage = localStorage.getItem('language');
if (savedLanguage) {
  console.log("Usando idioma salvo do localStorage:", savedLanguage);
  getI18n().changeLanguage(savedLanguage);
}

// Only use StrictMode in development to avoid double rendering in production
const rootElement = document.getElementById("root")!;
const app = <App />;

ReactDOM.createRoot(rootElement).render(
  process.env.NODE_ENV === 'development' ? (
    <React.StrictMode>{app}</React.StrictMode>
  ) : (
    app
  )
);

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered: ', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New content is available and will be used when all tabs for this page are closed.');
                // Could show update notification here
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('❌ SW registration failed: ', error);
      });
  });
}