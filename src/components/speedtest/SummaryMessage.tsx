import React from 'react';

interface SummaryMessageProps {
  displayUnit: string;
}

export const SummaryMessage: React.FC<SummaryMessageProps> = () => {
  // Dummy value evaluation (in a real app, this would be based on actual speeds)
  const speedQuality = "Excellent";
  
  const getQualityMessage = () => {
    const qualities = {
      Excellent: {
        message: "Your internet connection is lightning fast! Perfect for all online activities.",
        color: "text-green-400"
      },
      Good: {
        message: "Good speeds! Great for streaming and gaming.",
        color: "text-blue-400"
      },
      Fair: {
        message: "Decent connection. Suitable for most online activities.",
        color: "text-yellow-400"
      },
      Poor: {
        message: "Connection might be slow for some activities.",
        color: "text-orange-400"
      },
    };

    return qualities[speedQuality as keyof typeof qualities];
  };

  const quality = getQualityMessage();

  return (
    <div className="w-full text-center space-y-2">
      <h3 className={`text-lg sm:text-xl font-semibold ${quality.color}`}>
        {speedQuality} Connection
      </h3>
      <p className="text-sm sm:text-base text-gray-300">
        {quality.message}
      </p>
    </div>
  );
};

export default SummaryMessage;