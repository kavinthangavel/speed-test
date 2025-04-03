import React from 'react';

type ErrorDisplayProps = {
  error: Error | string | null;
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-300">Error occurred during speed test</h3>
          <div className="mt-2 text-sm text-red-200">
            <p>{errorMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
