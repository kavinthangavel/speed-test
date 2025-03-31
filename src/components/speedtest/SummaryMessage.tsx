import React from 'react';
import { TestStage, SpeedUnit } from '../../utils/types';
import { getSummaryMessage } from '../../utils/summaryMessages';
import { FiCheckCircle, FiAlertTriangle, FiAward, FiZap } from 'react-icons/fi';

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
  // Don't show during testing or if there's an error
  if (isTesting || error || testStage !== 'done') return null;
  
  // Get the fun message
  const message = getSummaryMessage(downloadSpeed, uploadSpeed, displayUnit);
  
  // Calculate score (weighted average: 70% download, 30% upload)
  const weightedSpeed = downloadSpeed !== null && uploadSpeed !== null 
    ? (downloadSpeed * 0.7) + (uploadSpeed * 0.3)
    : null;
  
  // Define thresholds based on common internet speed expectations
  const getQualityAssessment = () => {
    if (!weightedSpeed) return null;

    if (displayUnit === 'MB/s') {
      if (weightedSpeed >= 12.5) return { text: 'Excellent', color: 'text-green-400', bg: 'bg-green-400/10', icon: <FiAward className="text-lg text-green-400" /> }; 
      if (weightedSpeed >= 6.25) return { text: 'Very Good', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: <FiCheckCircle className="text-lg text-emerald-400" /> }; 
      if (weightedSpeed >= 3.125) return { text: 'Good', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: <FiCheckCircle className="text-lg text-blue-400" /> }; 
      if (weightedSpeed >= 1.25) return { text: 'Adequate', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: <FiZap className="text-lg text-yellow-400" /> }; 
      if (weightedSpeed >= 0.5) return { text: 'Slow', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: <FiAlertTriangle className="text-lg text-amber-500" /> }; 
      return { text: 'Very Slow', color: 'text-red-500', bg: 'bg-red-500/10', icon: <FiAlertTriangle className="text-lg text-red-500" /> }; 
    } else {
      // Values in Mbps
      if (weightedSpeed >= 100) return { text: 'Excellent', color: 'text-green-400', bg: 'bg-green-400/10', icon: <FiAward className="text-lg text-green-400" /> };
      if (weightedSpeed >= 50) return { text: 'Very Good', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: <FiCheckCircle className="text-lg text-emerald-400" /> };
      if (weightedSpeed >= 25) return { text: 'Good', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: <FiCheckCircle className="text-lg text-blue-400" /> };
      if (weightedSpeed >= 10) return { text: 'Adequate', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: <FiZap className="text-lg text-yellow-400" /> };
      if (weightedSpeed >= 4) return { text: 'Slow', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: <FiAlertTriangle className="text-lg text-amber-500" /> };
      return { text: 'Very Slow', color: 'text-red-500', bg: 'bg-red-500/10', icon: <FiAlertTriangle className="text-lg text-red-500" /> };
    }
  };
  
  const quality = getQualityAssessment();

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg py-4 px-6 max-w-lg mx-auto text-center border border-slate-700/40 shadow-lg mt-4">
      {quality && (
        <>
          <div className="flex justify-center mb-3">
            <div className={`p-3 ${quality.bg} rounded-full`}>
              {quality.icon}
            </div>
          </div>
          <h3 className="text-sm font-semibold mb-2 text-blue-100">Connection Assessment</h3>
          <p className={`text-xl font-bold mb-3 ${quality.color}`}>{quality.text}</p>
        </>
      )}
      <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
    </div>
  );
};

export default SummaryMessage;
