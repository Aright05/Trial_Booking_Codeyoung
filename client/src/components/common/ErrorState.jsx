import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button.jsx';

/**
 * Reusable ErrorState component for displaying friendly and actionable error messages
 */
export const ErrorState = ({
  title = 'No Mentors Available',
  message = 'We could not find any available mentor slots for the selected date and timezone. Please select another date or check back shortly.',
  onRetry,
  retryText = 'Try Again',
  className = '',
}) => {
  return (
    <div className={`p-6 rounded-2xl border border-amber-200/80 bg-amber-50/50 flex flex-col sm:flex-row items-start gap-4 ${className}`}>
      <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-amber-900 mb-1">{title}</h4>
        <p className="text-xs text-amber-800 leading-relaxed">{message}</p>
        {onRetry && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              icon={RotateCcw}
              className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              {retryText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
