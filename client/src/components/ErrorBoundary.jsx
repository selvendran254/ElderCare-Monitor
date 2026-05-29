import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-bg min-h-screen flex items-center justify-center p-6">
          <div className="glass-card p-10 max-w-md text-center">
            <div className="text-5xl mb-4">😔</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 text-sm mb-6">{this.state.error?.message}</p>
            <button
              onClick={() => { window.location.href = '/login'; }}
              className="btn-primary px-6 py-3"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
