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

export default function Home() {
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

  const { networkInfo, loading, error: networkError } = useNetworkInfo();

  // Auto-start on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const controller = new AbortController();
    startTestFlow(controller);

    // Cleanup function
    return () => {
      console.log("Component unmounting, aborting any active test...");
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col items-center p-3 sm:p-4 bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-200 font-sans overflow-hidden">
      {/* Settings Toggle */}
      <div className="w-full max-w-5xl flex flex-wrap justify-end items-center mb-1">
        <UnitToggle displayUnit={displayUnit} toggleUnit={toggleUnit} />
      </div>

      {/* Content Container */}
      <div className="flex flex-col items-center justify-center w-full flex-grow max-h-[calc(100vh-6rem)]">
        <div className="w-full max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500">
            Speed Test
          </h1>
          <p className="text-xs text-indigo-300/90 italic mb-2 px-4">
            Focus. Speed. I am... checking your internet! Ready? Ka-chow!
          </p>

          {/* Main Content Area */}
          <div className="w-full flex flex-col h-full space-y-3">
            {/* Connection Information - Enhanced size */}
            <div className="w-full animate-fadeIn">
              <NetworkInfoDisplay networkInfo={networkInfo} loading={loading} />
            </div>

            {/* Speed Test Components */}
            <div className="w-full space-y-3 animate-fadeIn flex-grow">
              {/* Integrated Graph & Results Area */}
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

              {/* Error Message Area */}
              {error && <ErrorDisplay error={error} />}

              {/* Centered Test Button */}
              <div className="flex justify-center">
                <TestButton isTesting={isTesting} onRestart={handleRestartTest} />
              </div>

              {/* Summary Message Area - Assessment only */}
              <div className="flex justify-center w-full">
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
      <footer className="w-full text-center text-gray-500 text-xs py-2">
        Powered by Kavin ;)
      </footer>
    </main>
  );
}