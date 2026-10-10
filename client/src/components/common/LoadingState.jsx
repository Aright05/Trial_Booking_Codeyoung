import React from 'react';

/**
 * Reusable LoadingState spinner / skeleton
 */
export const LoadingState = ({ message = 'Loading available slots...', minHeight = 'min-h-[160px]' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${minHeight}`}>
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingState;
