import React from 'react';
import { SpeedUnit, TestStage } from '../../utils/types';
import { getSummaryMessage } from '../../utils/summaryMessages';

interface SummaryMessageProps {
  testStage: TestStage;
  isTesting: boolean;
  error: string | null;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  displayUnit: SpeedUnit;
}

const SummaryMessage: React.FC<SummaryMessageProps> = ({
  testStage,
  isTesting,
  error,
  downloadSpeed,
  uploadSpeed,
  displayUnit
}) => {
  const summary = (testStage === 'done' && !isTesting && error === null)
    ? getSummaryMessage(downloadSpeed, uploadSpeed, displayUnit)
    : null;

  if (!summary) return null;
  
  return (
    <div className="min-h-[60px] w-full max-w-md flex justify-center items-start mt-4 px-2">
      <div className="p-4 bg-gray-800/50 rounded-lg shadow-md border border-gray-700/60 backdrop-blur-md w-full transition-opacity duration-700 ease-in-out">
        <p className="text-sm text-gray-300 text-center" role="status" aria-live="polite">{summary}</p>
      </div>
    </div>
  );
};

export default SummaryMessage;
