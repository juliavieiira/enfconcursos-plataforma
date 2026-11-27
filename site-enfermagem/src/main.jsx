import React, { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          background: '#f8fafc',
          color: '#0f172a',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '2.5rem',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
            maxWidth: '520px',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
              Enf<span style={{ color: '#0d9488' }}>Concursos</span>
            </h2>
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              marginBottom: '1rem',
              border: '1px solid #fecaca',
              fontWeight: 600
            }}>
              {this.state.error ? (this.state.error.message || String(this.state.error)) : 'Detectamos uma instabilidade temporária ao recarregar a sessão.'}
            </div>

            {this.state.error?.stack && (
              <pre style={{
                textAlign: 'left',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.72rem',
                maxHeight: '160px',
                overflow: 'auto',
                marginBottom: '1.25rem',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.error.stack}
              </pre>
            )}

            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Clique abaixo para restaurar o acervo de 3.696 questões auditadas e sincronizar a plataforma:
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  try {
                    sessionStorage.clear();
                    localStorage.removeItem('enfconcursos_supabase_stats_v2');
                    localStorage.removeItem('enfconcursos_mock_session');
                  } catch (e) {}
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  backgroundColor: '#0d9488',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                Recarregar Plataforma
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Se esta janela foi aberta como popup de autenticação OAuth e retornou com token, fecha após sincronizar
if (window.opener && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
  setTimeout(() => {
    try {
      window.close();
    } catch {}
  }, 1200);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
