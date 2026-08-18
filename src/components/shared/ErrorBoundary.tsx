import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Automatically reload the page if it's a chunk loading error
    // This happens when a new deployment invalidates old cached chunks
    if (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('dynamically imported module')
    ) {
      window.location.reload();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--dk)', padding: '20px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '32px', marginBottom: '20px' }}>Something went wrong</h2>
          <p style={{ marginBottom: '30px', color: 'var(--mu)', maxWidth: '400px' }}>
            We've encountered an unexpected error. This usually happens when the application has been updated.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '12px 24px', backgroundColor: 'var(--cr)', color: 'var(--bg)', border: 'none', borderRadius: '4px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '12px' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
