import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { notifyError } from '@/lib/errorReporting'
import './index.css'
import App from './App.tsx'

// Errores de JS no atrapados (bugs del front que escapan a try/catch)
window.addEventListener('error', (e) => {
  if (e.error instanceof Error) notifyError(e.error, 'Error inesperado');
});
// Promesas rechazadas sin manejar (ej. un await sin try/catch)
window.addEventListener('unhandledrejection', (e) => {
  notifyError(e.reason, 'Operación sin manejar');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <Toaster position="bottom-right" richColors closeButton />
    </BrowserRouter>
  </StrictMode>,
)
