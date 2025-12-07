import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data. Please try again.',
  onRetry,
  fullPage = false,
}: ErrorStateProps) => {
  const content = (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
      <div className="w-16 h-16 bg-red-900 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-6 py-2.5 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">{content}</div>
      </div>
    );
  }

  return <div className="py-12">{content}</div>;
};
