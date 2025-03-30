import React from 'react';
import { FiSettings } from 'react-icons/fi';
import { SpeedUnit } from '../../utils/types';

interface UnitToggleProps {
  displayUnit: SpeedUnit;
  toggleUnit: () => void;
}

const UnitToggle: React.FC<UnitToggleProps> = ({ displayUnit, toggleUnit }) => {
  return (
    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
      <button
        onClick={toggleUnit}
        title={`Switch to ${displayUnit === 'Mbps' ? 'MBps' : 'Mbps'}`}
        aria-label="Toggle speed unit"
        className="bg-gray-700/60 hover:bg-gray-600/80 text-gray-300 hover:text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-opacity-75 shadow-md"
      >
        <FiSettings className="w-5 h-5" />
        <span className="text-xs font-medium tabular-nums w-10 text-center">{displayUnit}</span>
      </button>
    </div>
  );
};

export default UnitToggle;
