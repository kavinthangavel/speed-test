import React from 'react';
import { FiRotateCw } from 'react-icons/fi';

interface TestButtonProps {
  isTesting: boolean;
  onRestart: () => void;
}

const TestButton: React.FC<TestButtonProps> = ({ isTesting, onRestart }) => {
  return (
    <button
      onClick={onRestart}
      disabled={isTesting}
      className="mt-4 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center mx-auto shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
    >
      <FiRotateCw className={`mr-2 ${isTesting ? 'animate-spin' : ''}`} />
      {isTesting ? 'Running Test...' : 'Restart Test'}
    </button>
  );
};

export default TestButton;
