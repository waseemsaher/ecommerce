import { Component } from 'react';
import Button from '../ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
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
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
            An unexpected error occurred. You can try refreshing the page or going back.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button icon={RefreshCw} onClick={this.handleReset} variant="secondary">
              Try again
            </Button>
            <Button onClick={() => { window.location.href = '/'; }}>
              Go home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
