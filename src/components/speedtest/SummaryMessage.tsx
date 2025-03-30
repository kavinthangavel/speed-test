import React from 'react';
import { TestStage, SpeedUnit } from '../../utils/types';
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
  
  // Requires both download and upload speeds to be present
  if (downloadSpeed === null || uploadSpeed === null) return null;
  
  // Calculate score (weighted average: 70% download, 30% upload)
  const weightedSpeed = (downloadSpeed * 0.7) + (uploadSpeed * 0.3);
  
  // Define thresholds based on common internet speed expectations
  const getQualityAssessment = () => {
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
  
  // Calculate recommendations based on the quality
  const getRecommendations = () => {
    switch (quality.text) {
      case 'Excellent':
        return "Your connection can handle multiple 4K streams, video calls, and large downloads simultaneously without issues.";
      case 'Very Good':
        return "You can enjoy 4K streaming, fast downloads, and smooth online gaming with this connection.";
      case 'Good':
        return "Suitable for HD streaming, video calls, and most online activities with good performance.";
      case 'Adequate':
        return "Works for basic web browsing and standard video streaming, but may struggle with 4K content or large file transfers.";
      case 'Slow':
        return "You may experience buffering during video playback and delays with larger downloads.";
      case 'Very Slow':
        return "Your connection is only suitable for basic web browsing and may struggle with most streaming services.";
      default:
        return "";
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg py-4 px-6 max-w-lg mx-auto text-center border border-slate-700/40 shadow-lg mt-4">
      <div className="flex justify-center mb-3">
        <div className={`p-3 ${quality.bg} rounded-full`}>
          {quality.icon}
        </div>
      </div>
      <h3 className="text-sm font-semibold mb-2 text-blue-100">Connection Assessment</h3>
      <p className={`text-xl font-bold mb-2 ${quality.color}`}>{quality.text}</p>
      <p className="text-sm text-gray-300 leading-relaxed">{getRecommendations()}</p>
    </div>
  );
};

export default SummaryMessage;
