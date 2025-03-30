import React from 'react';
import { FiLoader, FiRefreshCw } from 'react-icons/fi';

interface TestButtonProps {
  isTesting: boolean;
  onRestart: () => void;
}

const TestButton: React.FC<TestButtonProps> = ({ isTesting, onRestart }) => {
  return (
    <div className="my-4">
      <button
        onClick={onRestart}
        disabled={isTesting}
        className={`relative inline-flex items-center justify-center px-8 py-3 text-base sm:text-lg font-semibold text-white rounded-lg shadow-md transition-all duration-300 ease-in-out overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-blue-400 ${
          isTesting
            ? 'bg-gradient-to-r from-gray-600 to-gray-500 cursor-not-allowed opacity-70'
            : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-600 hover:scale-[1.03] active:scale-100'
        }`}
        aria-label={isTesting ? "Test in progress" : "Start speed test again"}
      >
        {/* Subtle hover effect */}
        {!isTesting && <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 rounded-lg"></span>}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isTesting ? (
            <><FiLoader className="animate-spin w-5 h-5"/> Testing...</>
          ) : (
            <><FiRefreshCw className="w-5 h-5"/> Test Again</>
          )}
        </span>
      </button>
    </div>
  );
};

export default TestButton;
