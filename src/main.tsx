import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TranslationProvider } from './hooks/useTranslation';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch((err) => {
        console.error('[CamDiag] Service worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <TranslationProvider>
            <App />
          </TranslationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
