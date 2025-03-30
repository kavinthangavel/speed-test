import React from 'react';
import { FiDownload, FiUpload, FiZap } from 'react-icons/fi';
import { SpeedUnit, TestStage } from '../../utils/types';

interface ResultsDisplayProps {
  testStage: TestStage;
  isTesting: boolean;
  ping: number | null;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  displayUnit: SpeedUnit;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  testStage,
  isTesting,
  ping,
  downloadSpeed,
  uploadSpeed,
  displayUnit
}) => {
  if (!((testStage === 'done' || (testStage === 'error' && (ping !== null || downloadSpeed !== null || uploadSpeed !== null))) && !isTesting)) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-3 gap-px text-center w-full max-w-2xl mx-auto bg-gray-800/40 rounded-xl shadow-lg border border-gray-700/50 backdrop-blur-lg overflow-hidden mb-8 transition-opacity duration-500 ease-in-out ${testStage === 'done' || testStage === 'error' ? 'opacity-100' : 'opacity-0'}`}
      aria-live="polite"
    >
      {/* Latency */}
      <div className="flex flex-col items-center justify-center p-4 bg-black/25 min-h-[90px]">
        <div className="flex items-center text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-medium mb-1">
          <FiZap className="w-4 h-4 mr-2 text-yellow-400" /> Latency
        </div>
        <div className="text-2xl font-semibold tabular-nums text-gray-100 min-h-[2.25rem] flex items-center justify-center">
          {ping !== null ? `${ping} ms` : <span className="text-gray-500">-</span>}
        </div>
      </div>
      
      {/* Download */}
      <div className="flex flex-col items-center justify-center p-4 bg-black/25 min-h-[90px]">
        <div className="flex items-center text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-medium mb-1">
          <FiDownload className="w-4 h-4 mr-2 text-blue-400" /> Download
        </div>
        <div className="text-2xl font-semibold tabular-nums text-gray-100 min-h-[2.25rem] flex items-center justify-center">
          {downloadSpeed !== null ? (
            <>
              {downloadSpeed.toFixed(1)}
              <span className="text-sm ml-1.5 text-gray-400 align-baseline">{displayUnit}</span>
            </>
          ) : <span className="text-gray-500">-</span>}
        </div>
      </div>
      
      {/* Upload */}
      <div className="flex flex-col items-center justify-center p-4 bg-black/25 min-h-[90px]">
        <div className="flex items-center text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-medium mb-1">
          <FiUpload className="w-4 h-4 mr-2 text-green-400" /> Upload
        </div>
        <div className="text-2xl font-semibold tabular-nums text-gray-100 min-h-[2.25rem] flex items-center justify-center">
          {uploadSpeed !== null ? (
            <>
              {uploadSpeed.toFixed(1)}
              <span className="text-sm ml-1.5 text-gray-400 align-baseline">{displayUnit}</span>
            </>
          ) : <span className="text-gray-500">-</span>}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
