import { Component } from 'react';
import Button from '../ui/Button';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
    this.setState({ errorInfo: info });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Force a fresh reload if state recovery doesn't work
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isAdmin = window.location.pathname.startsWith('/admin');
      const errorMessage = this.state.error?.message || 'An unexpected error occurred.';

      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <AlertTriangle size={48} strokeWidth={1.2} style={{ color: 'var(--danger)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h2>
          
          {/* Clear error message display */}
          <div
            style={{
              background: 'var(--bg-secondary, rgba(0,0,0,0.05))',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              maxWidth: '500px',
              color: 'var(--danger)',
              fontSize: '0.875rem',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
            }}
          >
            {errorMessage}
          </div>

          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.875rem' }}>
            You can try reloading the page or returning to the previous screen.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button icon={RefreshCw} onClick={this.handleReset} variant="secondary">
              Try again
            </Button>
            {isAdmin ? (
              <Button icon={ArrowLeft} onClick={() => { window.location.href = '/admin'; }} variant="secondary">
                Admin Dashboard
              </Button>
            ) : (
              <Button icon={ArrowLeft} onClick={() => window.history.back()} variant="secondary">
                Go back
              </Button>
            )}
            <Button icon={Home} onClick={() => { window.location.href = '/'; }}>
              Go home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

