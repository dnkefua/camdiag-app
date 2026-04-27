import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TranslationProvider } from './hooks/useTranslation';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
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