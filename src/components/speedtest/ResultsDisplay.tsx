import React from 'react';
import { FiClock, FiDownload, FiUpload } from 'react-icons/fi';
import { TestStage, SpeedUnit } from '../../utils/types';

interface ResultsDisplayProps {
  testStage: TestStage;
  isTesting: boolean;
  ping: number | null;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  displayUnit: SpeedUnit;
  compact?: boolean;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  testStage,
  isTesting,
  ping,
  downloadSpeed,
  uploadSpeed,
  displayUnit,
  compact = false
}) => {
  // Only show results after ping test has completed
  const showResults = !isTesting || ['download', 'upload', 'done', 'error'].includes(testStage);
  
  // Constants for styling based on compact mode
  const containerClass = compact ? 'py-1 px-1' : 'py-3 px-2';
  const itemClass = compact ? 'px-2 py-1.5' : 'px-4 py-3';
  const iconSize = compact ? 'text-base' : 'text-xl';
  const titleSize = compact ? 'text-xs mt-0.5' : 'text-sm mt-1';
  const valueSize = compact ? 'text-lg' : 'text-2xl';
  const unitSize = compact ? 'text-xs' : 'text-sm';
  
  if (!showResults) return null;
  
  return (
    <div className={`flex justify-center ${containerClass}`}>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-2xl">
        {/* Ping */}
        <div className={`bg-slate-800/60 rounded-lg flex flex-col items-center justify-center text-center ${itemClass}`}>
          <FiClock className={`text-yellow-400 ${iconSize}`} />
          <span className={`text-gray-400 ${titleSize}`}>Ping</span>
          <div className="flex items-baseline mt-1">
            <span className={`font-bold text-white ${valueSize}`}>
              {ping !== null ? ping : '—'}
            </span>
            <span className={`text-gray-400 ml-1 ${unitSize}`}>ms</span>
          </div>
        </div>
        
        {/* Download */}
        <div className={`bg-slate-800/60 rounded-lg flex flex-col items-center justify-center text-center ${itemClass}`}>
          <FiDownload className={`text-green-400 ${iconSize}`} />
          <span className={`text-gray-400 ${titleSize}`}>Download</span>
          <div className="flex items-baseline mt-1">
            <span className={`font-bold text-white ${valueSize}`}>
              {downloadSpeed !== null ? downloadSpeed.toFixed(2) : '—'}
            </span>
            <span className={`text-gray-400 ml-1 ${unitSize}`}>{displayUnit}</span>
          </div>
        </div>
        
        {/* Upload */}
        <div className={`bg-slate-800/60 rounded-lg flex flex-col items-center justify-center text-center ${itemClass}`}>
          <FiUpload className={`text-purple-400 ${iconSize}`} />
          <span className={`text-gray-400 ${titleSize}`}>Upload</span>
          <div className="flex items-baseline mt-1">
            <span className={`font-bold text-white ${valueSize}`}>
              {uploadSpeed !== null ? uploadSpeed.toFixed(2) : '—'}
            </span>
            <span className={`text-gray-400 ml-1 ${unitSize}`}>{displayUnit}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
