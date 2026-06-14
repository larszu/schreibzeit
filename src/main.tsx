import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Unbehandelte Promise-Rejections sichtbar machen (die ErrorBoundary fängt nur
// Fehler im Render). In der lokalen App genügt das Konsolen-Log für DevTools.
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unbehandelte Promise-Rejection:', e.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
