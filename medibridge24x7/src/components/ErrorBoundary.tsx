import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <div className="w-20 h-20 bg-red-900 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-3">
                Oops! Something went wrong
              </h1>

              <p className="text-slate-400 mb-6">
                We're sorry, but something unexpected happened. This error has been logged and
                we'll look into it.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6 text-left">
                  <div className="text-xs font-mono text-red-400 mb-2">
                    Error: {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <details className="text-xs font-mono text-slate-500 mt-2">
                      <summary className="cursor-pointer hover:text-slate-400 mb-2">
                        Component Stack
                      </summary>
                      <pre className="overflow-auto max-h-64 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center px-6 py-3 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Go to Home
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700">
                <p className="text-sm text-slate-500">
                  If this problem persists, please contact support with the error details above.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
