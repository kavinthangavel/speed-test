'use client';

import { useEffect } from 'react';
import { 
  ResultsDisplay, 
  SpeedGraph, 
  ErrorDisplay, 
  SummaryMessage,
  TestButton,
  UnitToggle
} from '../components/speedtest';
import { useSpeedTest } from '../hooks/useSpeedTest';

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

  // Auto-start on mount
  useEffect(() => {
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
    <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-200 font-sans">
      {/* Settings Toggle */}
      <UnitToggle displayUnit={displayUnit} toggleUnit={toggleUnit} />

      {/* Content Container */}
      <div className="flex flex-col items-center justify-center flex-grow w-full mt-12 sm:mt-8">
        <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center">
          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500">
            Speed Test
          </h1>
          <p className="text-sm text-indigo-300/90 italic mb-8 px-4">
            Focus. Speed. I am... checking your internet! Ready? Ka-chow!
          </p>

          {/* Graph and Status Area */}
          <SpeedGraph
            graphData={graphData}
            displayUnit={displayUnit}
            testStage={testStage}
            isTesting={isTesting}
            currentSpeedMbps={displayCurrentSpeed}
            statusText={statusText}
            error={error}
          />

          {/* Error Message Area */}
          <ErrorDisplay error={error} />

          {/* Results Display */}
          <ResultsDisplay
            testStage={testStage}
            isTesting={isTesting}
            ping={ping}
            downloadSpeed={displayDownloadSpeed}
            uploadSpeed={displayUploadSpeed}
            displayUnit={displayUnit}
          />

          {/* Test Button */}
          <TestButton isTesting={isTesting} onRestart={handleRestartTest} />

          {/* Summary Message Area */}
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

      {/* Footer */}
      <footer className="w-full text-center text-gray-500 text-xs mt-auto pt-6 pb-4 px-4">
        Powered by Kavin ;)
      </footer>
    </main>
  );
}