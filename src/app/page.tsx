'use client';

import { useEffect } from 'react';
import { 
  ErrorDisplay, 
  SummaryMessage,
  TestButton,
  UnitToggle,
  SpeedGraph
} from '../components/speedtest';
import NetworkInfoDisplay from '../components/speedtest/NetworkInfoDisplay';
import { useSpeedTest } from '../hooks/useSpeedTest';
import { useNetworkInfo } from '../hooks/useNetworkInfo';

const Page = () => {
  const {
    ping,
    isTesting,
    testStage,
    error,
    displayUnit,
    displayDownloadSpeed,
    displayUploadSpeed,
    displayCurrentSpeed,
    statusText,
    graphData,
    handleRestartTest,
    toggleUnit,
    startTestFlow
  } = useSpeedTest();

  const { networkInfo, loading } = useNetworkInfo();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const controller = new AbortController();
    startTestFlow(controller);
    return () => {
      console.log("Component unmounting, aborting any active test...");
      controller.abort();
    };
  }, [startTestFlow]);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center p-2 sm:p-3 bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-200 font-sans">
      {/* Settings Toggle */}
      <div className="w-full max-w-5xl flex flex-wrap justify-end items-center mb-2 sm:mb-1">
        <UnitToggle displayUnit={displayUnit} toggleUnit={toggleUnit} />
      </div>

      {/* Content Container */}
      <div className="flex flex-col items-center w-full flex-grow">
        <div className="w-full max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Heading */}
          <h1 className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500">
            Speed Test
          </h1>
          <p className="text-[10px] sm:text-xs text-indigo-300/90 italic mb-1.5 px-4">
            Focus. Speed. Internet checking in progress!
          </p>

          {/* Main Content Area */}
          <div className="w-full flex flex-col space-y-2 sm:space-y-3">
            {/* Desktop Network Info */}
            <div className="hidden sm:block w-full">
              <NetworkInfoDisplay networkInfo={networkInfo} loading={loading} />
            </div>

            {/* Speed Graph and Controls */}
            <div className="w-full space-y-2 sm:space-y-3">
              <SpeedGraph
                graphData={graphData}
                displayUnit={displayUnit}
                testStage={testStage}
                isTesting={isTesting}
                currentSpeedMbps={displayCurrentSpeed}
                statusText={statusText}
                error={error}
                compact={false}
                ping={ping}
                downloadSpeed={displayDownloadSpeed}
                uploadSpeed={displayUploadSpeed}
              />

              {/* Error Display */}
              {error && <ErrorDisplay error={error} />}

              {/* Desktop Test Button */}
              <div className="hidden sm:flex justify-center">
                <TestButton isTesting={isTesting} onRestart={handleRestartTest} />
              </div>

              {/* Mobile Layout */}
              <div className="flex sm:hidden flex-col space-y-2">
                {/* Mobile Test Button */}
                <div className="flex justify-center">
                  <TestButton isTesting={isTesting} onRestart={handleRestartTest} />
                </div>

                {/* Mobile Network Info */}
                <div className="w-full">
                  <NetworkInfoDisplay networkInfo={networkInfo} loading={loading} isMobile={true} />
                </div>
              </div>

              {/* Summary Message */}
              <div className="flex justify-center w-full mt-2">
                <SummaryMessage
                  testStage={testStage}
                  isTesting={isTesting}
                  error={error}
                  downloadSpeed={displayDownloadSpeed}
                  uploadSpeed={displayUploadSpeed}
                  displayUnit={displayUnit}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-gray-500 text-[10px] sm:text-xs py-1 sm:py-2">
        Powered by Kavin
      </footer>
    </div>
  );
};

export default Page;
