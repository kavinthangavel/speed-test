import React from 'react';
import { FiWifiOff } from 'react-icons/fi';

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="w-full max-w-md mx-auto min-h-[40px] flex items-center justify-center mb-6 px-2">
      <div role="alert" className="p-3 bg-red-900/50 border border-red-700/60 rounded-lg text-red-200 flex items-center justify-center gap-3 w-full backdrop-blur-sm transition-opacity duration-300 text-sm shadow-md">
        <FiWifiOff size={18} className="flex-shrink-0 text-red-400" />
        <span className="text-center">{error}</span>
      </div>
    </div>
  );
};

export default ErrorDisplay;
