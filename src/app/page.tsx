'use client';

import { 
  ErrorDisplay, 
  NetworkInfoDisplay,
  ResultsDisplay,
  SummaryMessage  
} from '../components/speedtest';
import { useNetworkInfo } from '../hooks/useNetworkInfo';

const Page = () => {
  const { networkInfo, loading, error } = useNetworkInfo();
  const displayUnit = 'Mbps'; // Default unit

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center p-2 sm:p-3 bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-200 font-sans">
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

            {/* Error Display */}
            {error && <ErrorDisplay error={error} />}

            {/* Results Display with Speed Graph */}
            <ResultsDisplay
              downloadSpeed="65"
              uploadSpeed="40"
              displayUnit={displayUnit}
              ping={15}
            />

            {/* Summary Message */}
            <SummaryMessage displayUnit={displayUnit} />

            {/* Mobile Network Info */}
            <div className="sm:hidden w-full">
              <NetworkInfoDisplay networkInfo={networkInfo} loading={loading} isMobile={true} />
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
