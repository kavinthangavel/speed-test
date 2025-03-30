import React from 'react';
import { SpeedUnit } from '../../utils/types';
import { FiRefreshCw } from 'react-icons/fi';

interface UnitToggleProps {
  displayUnit: SpeedUnit;
  toggleUnit: () => void;
}

const UnitToggle: React.FC<UnitToggleProps> = ({ displayUnit, toggleUnit }) => {
  return (
    <button
      onClick={toggleUnit}
      className="flex items-center px-2 py-1 bg-slate-800/60 rounded-md text-xs text-gray-300 hover:bg-slate-700/60 transition-colors border border-slate-700/40"
    >
      <FiRefreshCw className="mr-1 text-blue-400 text-xs" />
      <span className="font-medium">{displayUnit}</span>
    </button>
  );
};

export default UnitToggle;
