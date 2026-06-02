import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    console.error('Unbehandelte Ausnahme:', info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 600, margin: '4rem auto' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Etwas ist schiefgelaufen</h1>
          <p style={{ marginBottom: '1rem', color: '#555' }}>
            Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu.
            Ihre Daten sind sicher in der lokalen Datenbank gespeichert.
          </p>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: 8, overflow: 'auto', fontSize: '0.85rem' }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', cursor: 'pointer' }}
          >
            Seite neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
