import { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', required, ...props }, ref) => {

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          required={required}
          className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300
            ${error
              ? 'bg-white border-error text-gray-900 placeholder-gray-400 focus:outline-none focus:border-error focus:ring-4 focus:ring-red-50'
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 hover:border-gray-300'}
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
            ${className}`}
          {...props}
        />
        {error && (
          <div className="flex items-start mt-1.5 text-red-600">
            <AlertCircle className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
