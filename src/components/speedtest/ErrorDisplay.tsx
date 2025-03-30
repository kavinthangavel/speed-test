import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-900/30 border border-red-800/50 text-red-200 p-2 rounded-lg text-xs flex items-start">
      <FiAlertTriangle className="text-red-400 mr-1.5 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold mb-0.5">Error</p>
        <p className="opacity-90">{error}</p>
      </div>
    </div>
  );
};

export default ErrorDisplay;
