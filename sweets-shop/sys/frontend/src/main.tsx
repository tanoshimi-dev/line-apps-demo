import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initializeLiff } from './services/liff';
import './index.css';

const liffId = import.meta.env.VITE_LIFF_ID;

// Skip LIFF initialization for admin routes
if (!window.location.pathname.startsWith('/admin')) {
  if (liffId) {
    initializeLiff(liffId)
      .then(() => {
        console.log('LIFF initialized');
      })
      .catch((err) => {
        console.error('LIFF init error:', err);
      });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
