// ErrorBoundary.js – React Error Boundary to catch component errors
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });

    // In production, send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // window.errorTracker?.captureException(error, { errorInfo });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 className="fw-bold mb-3">Something went wrong</h1>
            <p className="text-muted mb-4">
              We're sorry, but something unexpected happened. The error has been logged and our team will look into it.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="alert alert-danger text-start mb-4">
                <strong>Error Details (Development Only):</strong>
                <pre className="mt-2 small" style={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-primary" onClick={this.handleGoHome}>
                <i className="bi bi-house-door me-2"></i>Go to Dashboard
              </button>
              <button className="btn btn-outline-secondary" onClick={this.handleReload}>
                <i className="bi bi-arrow-clockwise me-2"></i>Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
