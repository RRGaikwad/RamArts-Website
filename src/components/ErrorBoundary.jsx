import { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 text-center">
          <p className="mb-2 text-caption uppercase tracking-widest text-ink-muted">Something went wrong</p>
          <h1 className="mb-4 font-display text-display-lg">Unexpected error</h1>
          <p className="mb-8 max-w-md text-ink-muted">
            Please refresh the page. If the problem continues, contact us and we will sort it out.
          </p>
          <div className="flex gap-3">
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Refresh
            </button>
            <Link to="/" className="btn-secondary">
              Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
