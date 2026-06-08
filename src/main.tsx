import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SchuelerApp } from './schueler/SchuelerApp';
import { ErrorBoundary } from './components/ErrorBoundary';
import { istUebenHash } from './core/uebenLink';
import './index.css';

// Ein einziger Build, zwei Einstiege: Mit einem geteilten Übungslink
// (#ueben=…) startet der kindgerechte Schüler-Client, sonst die Lehrer-App.
const istSchueler = istUebenHash(window.location.hash);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>{istSchueler ? <SchuelerApp /> : <App />}</ErrorBoundary>
  </React.StrictMode>,
);
