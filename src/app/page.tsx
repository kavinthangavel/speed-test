'use client';

import { useState, useEffect } from 'react';
import { FiDownload, FiUpload, FiZap, FiWifiOff, FiRefreshCw, FiSettings, FiLoader, FiBarChart2 } from 'react-icons/fi';

// --- Constants ---
const BITS_IN_MEGABIT = 1_000_000;
const BYTES_IN_MEGABYTE = 1024 * 1024;

type SpeedUnit = 'Mbps' | 'MBps';

// --- Summary Messages ---
const getSummaryMessage = (dl: number | null, ul: number | null, unit: SpeedUnit): string => {
  // Reverted to McQueen-themed messages
  if (dl === null) { return "Ready to see how fast this thing goes? Hit 'Test Again'!"; }
  if (dl === 0) { return "Whoa, is the internet unplugged? Like, zero speed. Check your cables!"; }
  const dlMbps = dl * (unit === 'MBps' ? 8 : 1);
  const displayDl = dl.toFixed(1);
  if (dlMbps > 200) { return `KA-CHOW! ${displayDl} ${unit} download! That's lightning fast! You're basically winning the Piston Cup of internet speeds!`; }
  else if (dlMbps > 75) { return `Niiice! ${displayDl} ${unit} download. That's super speedy! Streaming, gaming, downloading... you're all set. Go go go!`; }
  else if (dlMbps > 25) { return `Solid! ${displayDl} ${unit} down. Pretty decent speed, gets the job done for most things. Keep on truckin'!`; }
  else if (dlMbps > 5) { return `Hmm, ${displayDl} ${unit} download. A bit on the slow side. Might take a coffee break while things load? ☕`; }
  else { return `Oof! ${displayDl} ${unit} down. Are we stuck in molasses? Might be time to check if something's clogging the tubes!`; }
};

// --- Helper for Unit Conversion & Display ---
const convertSpeed = (speedMbps: number | null, targetUnit: SpeedUnit): number | null => {
  if (speedMbps === null) return null;
  if (targetUnit === 'MBps') { return speedMbps / 8; }
  return speedMbps;
};

export default function Home() {
  // --- State Variables ---
  const [ping, setPing] = useState<number | null>(null);
  const [downloadSpeedMbps, setDownloadSpeedMbps] = useState<number | null>(null);
  const [uploadSpeedMbps, setUploadSpeedMbps] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testStage, setTestStage] = useState<'idle' | 'ping' | 'download' | 'upload' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [displayUnit, setDisplayUnit] = useState<SpeedUnit>('Mbps');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // --- Core Test Logic (remains the same) ---
  const handleStartTest = async (controller?: AbortController) => {
    if (isTesting) return;
    setIsTesting(true); setError(null); setPing(null); setDownloadSpeedMbps(null); setUploadSpeedMbps(null);
    setTestStage('ping'); console.log('Starting speed test...');
    const signal = controller?.signal;

    // Ping Test
    try {
      setTestStage('ping'); const pingTimes: number[] = []; const numPings = 5;
      for (let i = 0; i < numPings; i++) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        const startTime = performance.now();
        // Use a more reliable target for ping if favicon isn't ideal, but keep for simplicity
        await fetch(`/favicon.ico?t=${Date.now()}-${i}`, { cache: 'no-store', mode: 'no-cors', signal: AbortSignal.timeout(4000) });
        const endTime = performance.now(); pingTimes.push(endTime - startTime);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between pings
      }
      const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length; setPing(Math.max(1, Math.round(avgPing))); console.log(`Ping: ${Math.round(avgPing)} ms`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err; // Re-throw abort error
      console.error('Ping test failed:', err);
      if (err instanceof Error && err.name === 'TimeoutError') setError('Ping test timed out. Check connection.');
      else setError('Ping test failed. Could not reach test server.');
      // Don't stop the whole test for ping failure, allow download/upload attempt
      setPing(null); // Ensure ping is null if failed
    }
    if (signal?.aborted) { setIsTesting(false); setTestStage('idle'); setError('Test aborted by user.'); return; }

    // Download Test
    try {
      setTestStage('download');
      const startTime = performance.now();
      // Ensure the download file exists and is large enough for accurate measurement
      const res = await fetch(`/download-test.bin?t=${Date.now()}`, { cache: 'no-store', signal });
      if (!res.ok) throw new Error(`Server error during download: ${res.statusText} (${res.status})`);
      const blob = await res.blob();
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // Duration in seconds
      if (duration <= 0.1) throw new Error('Download measurement too fast for accuracy.'); // Prevent division by zero or inaccurate results
      const speedMbps = (blob.size * 8 / duration) / BITS_IN_MEGABIT;
      setDownloadSpeedMbps(speedMbps);
      console.log(`Download Speed: ${speedMbps.toFixed(2)} Mbps`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err; // Re-throw abort error
      console.error('Download test failed:', err);
      setError(err instanceof Error ? `Download failed: ${err.message}` : 'Download test encountered an unknown error.');
      setDownloadSpeedMbps(null); // Clear speed on failure
      // Stop the test here if download fails, as upload depends on connection
      setIsTesting(false);
      setTestStage('done'); // Mark as done even with error
      return;
    }
    if (signal?.aborted) { setIsTesting(false); setTestStage('idle'); setError('Test aborted by user.'); return; }

    // Upload Test (Simulated)
    try {
      setTestStage('upload');
      const uploadSize = 5 * BYTES_IN_MEGABYTE; // 5 MB
      const data = new Uint8Array(uploadSize).fill(65); // Fill with 'A' characters
      const blob = new Blob([data]);
      const startTime = performance.now();
      // Simulate network delay - replace with actual upload if backend exists
      await new Promise<boolean>((resolve, reject) => {
        // Simulate a delay between 1 and 3 seconds
        const tid = setTimeout(() => resolve(true), 1000 + Math.random() * 2000);
        // Handle abortion during the simulated delay
        signal?.addEventListener('abort', () => {
          clearTimeout(tid);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // Duration in seconds
      if (duration <= 0.1) throw new Error('Upload simulation too fast for accuracy.');
      const speedMbps = (blob.size * 8 / duration) / BITS_IN_MEGABIT;
      setUploadSpeedMbps(speedMbps);
      console.log(`Simulated Upload Speed: ${speedMbps.toFixed(2)} Mbps`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err; // Re-throw abort error
      console.error('Upload test simulation failed:', err);
      // Don't set a global error for upload sim failure, just clear the value
      setUploadSpeedMbps(null);
    }

    // Final State
    setIsTesting(false);
    setTestStage('done');
    if (signal?.aborted && !error) setError('Test aborted by user.'); // Set error only if not already set
    console.log('Speed test finished or aborted.');
  };


   // --- Auto-start & Cleanup ---
   useEffect(() => {
     const controller = new AbortController(); setAbortController(controller);
     handleStartTest(controller).catch((err: Error) => {
        if (err.name !== 'AbortError') {
            console.error("Unhandled error during initial test run:", err);
            setError("An unexpected error occurred during the test.");
        }
        // Ensure state is reset correctly even if initial test fails/aborts
        setIsTesting(false);
        setTestStage(err.name === 'AbortError' ? 'idle' : 'done');
      });
     // Cleanup function to abort ongoing test if component unmounts
     return () => {
        console.log("Component unmounting, aborting any active test...");
        controller.abort();
     };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

    // --- Restart Test ---
   const restartTest = () => {
       if (isTesting) {
           console.log("Aborting current test to restart...");
           abortController?.abort(); // Abort the current test
       }
       // Reset state immediately for a cleaner restart appearance
       setError(null); setPing(null); setDownloadSpeedMbps(null); setUploadSpeedMbps(null); setTestStage('idle');
       console.log("Starting new speed test...");
       const newController = new AbortController();
       setAbortController(newController);
       // Start the test logic again
       handleStartTest(newController).catch((err: Error) => {
            if (err.name !== 'AbortError') {
                console.error("Unhandled error during test restart:", err);
                setError("An unexpected error occurred while restarting the test.");
            }
            // Ensure state is reset correctly after restart error/abort
            setIsTesting(false);
            setTestStage(err.name === 'AbortError' ? 'idle' : 'done');
        });
   };

  // --- Toggle Units ---
  const toggleUnit = () => { setDisplayUnit(prev => prev === 'Mbps' ? 'MBps' : 'Mbps'); };

  // --- Status Text ---
  const getStatusText = (): string => {
    if (error && testStage === 'done') return "Test Failed"; // Show failed if error occurred
    if (testStage === 'idle' && !isTesting) return "Ready";
    if (testStage === 'done' && !isTesting) return "Complete";
    if (isTesting) {
      switch (testStage) {
        case 'ping': return "Testing Ping...";
        case 'download': return "Testing Download...";
        case 'upload': return "Testing Upload...";
        default: return "Initializing..."; // Should not happen often
      }
    }
    return "Preparing..."; // Initial state before useEffect runs
  };

  // --- Calculate displayed speeds & summary ---
  const displayDownloadSpeed = convertSpeed(downloadSpeedMbps, displayUnit);
  const displayUploadSpeed = convertSpeed(uploadSpeedMbps, displayUnit);
  // Generate summary only when the test is done and not actively testing
  const summary = (testStage === 'done' && !isTesting && error === null)
    ? getSummaryMessage(displayDownloadSpeed, displayUploadSpeed, displayUnit)
    : null; // No summary if testing, idle, or error

  // --- JSX Structure with Modern Styling ---
  return (
    // Use a cleaner, darker gradient and ensure full height/width
    <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-200">

       {/* Settings Toggle - Subtle styling */}
       <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
            <button
                onClick={toggleUnit}
                title={`Switch to ${displayUnit === 'Mbps' ? 'MBps' : 'Mbps'}`}
                aria-label="Toggle speed unit"
                className="bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 hover:text-white p-2 rounded-full transition-colors duration-200 backdrop-blur-sm flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-opacity-75"
            >
                <FiSettings className="w-5 h-5" />
                <span className="ml-2 text-xs font-medium tabular-nums">{displayUnit}</span>
            </button>
        </div>

      {/* Flex container to push footer down */}
      <div className="flex flex-col items-center justify-center flex-grow w-full">
        {/* Main Content Area */}
        <div className="w-full max-w-lg mx-auto text-center flex flex-col items-center mt-10"> {/* Added mt-10 for spacing */}

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Internet Speed Test
          </h1>

          {/* Subtitle (Optional) */}
          <p className="text-sm text-indigo-300 italic mb-8"> {/* Reverted to McQueen description */}
             Focus. Speed. I am... checking your internet! Ready? Ka-chow!
          </p>

          {/* Gauge Area - Placeholder with status */}
           <div className="relative w-full max-w-xs sm:max-w-sm h-24 sm:h-28 mb-8 flex flex-col items-center justify-center bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 backdrop-blur-md shadow-lg">
            {/* Placeholder Icon/Animation could go here */}
            {!isTesting && testStage === 'idle' && <FiBarChart2 size={36} className="text-gray-600 mb-2 opacity-50" />}
            {isTesting && <FiLoader size={36} className="text-blue-400 animate-spin mb-2" />}
            {(testStage === 'done' || error) && !isTesting && <FiZap size={36} className={`mb-2 ${error ? 'text-red-500' : 'text-green-500'}`} />}

            <p className="text-lg font-medium text-gray-300 mt-1" role="status" aria-live="polite">
              {getStatusText()}
            </p>
            {/* Progress Indicator (Optional) */}
            {isTesting && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600/30 overflow-hidden rounded-b-lg">
                <div className={`h-full bg-blue-500 transition-transform duration-500 ease-linear ${testStage === 'ping' ? 'w-1/3' : testStage === 'download' ? 'w-2/3' : 'w-full'}`}></div>
              </div>
            )}
         </div>

          {/* Error Message Area */}
          <div className="w-full max-w-md mx-auto min-h-[40px] flex items-center justify-center mb-6 px-2">
              {error && (
                <div role="alert" className="p-3 bg-red-800/40 border border-red-600/50 rounded-lg text-red-100 flex items-center justify-center gap-3 w-full backdrop-blur-sm transition-opacity duration-300 text-sm shadow-md">
                  <FiWifiOff size={18} className="flex-shrink-0" />
                  <span className="text-center">{error}</span>
                </div>
              )}
          </div>


           {/* Results Display - Only show when not idle and not actively testing the first stage */}
           {(testStage !== 'idle' || (ping !== null || downloadSpeedMbps !== null || uploadSpeedMbps !== null)) && (
              <div
                  // Grid layout for results, subtle background and borders
                  className={`grid grid-cols-1 sm:grid-cols-3 gap-px text-center w-full max-w-2xl mx-auto bg-gray-800/20 rounded-xl shadow-lg border border-gray-700/40 backdrop-blur-lg overflow-hidden mb-8 transition-opacity duration-500 ease-in-out ${isTesting || testStage === 'done' || error ? 'opacity-100' : 'opacity-0'}`}
              >
                {/* Latency */}
                <div className="flex flex-col items-center justify-center p-4 bg-black/20 min-h-[90px]">
                    <div className="flex items-center text-sm text-gray-400 uppercase tracking-wider font-medium mb-1">
                      <FiZap className={`w-4 h-4 mr-2 transition-colors ${testStage === 'ping' && isTesting ? 'text-yellow-400 animate-pulse' : 'text-yellow-500'}`} />
                      Latency
                    </div>
                    {/* Added min-h-[2.25rem] and flex items-center justify-center */}
                    <div className="text-2xl font-semibold tabular-nums text-gray-100 min-h-[2.25rem] flex items-center justify-center">
                      {isTesting && ping === null && testStage === 'ping' ? <FiLoader className="animate-spin text-gray-400 h-6 w-6"/> : ping !== null ? `${ping} ms` : '-'}
                    </div>
                </div>
                {/* Download */}
                <div className="flex flex-col items-center justify-center p-4 bg-black/20 min-h-[90px]">
                     <div className="flex items-center text-sm text-gray-400 uppercase tracking-wider font-medium mb-1">
                      <FiDownload className={`w-4 h-4 mr-2 transition-colors ${testStage === 'download' && isTesting ? 'text-blue-400 animate-pulse' : 'text-blue-400'}`} />
                      Download
                    </div>
                    {/* Added min-h-[2.25rem] and flex items-center justify-center */}
                    <div className="text-2xl font-semibold tabular-nums text-gray-100 min-h-[2.25rem] flex items-center justify-center">
                      {isTesting && downloadSpeedMbps === null && testStage === 'download' ? <FiLoader className="animate-spin text-gray-400 h-6 w-6"/> : displayDownloadSpeed !== null ? `${displayDownloadSpeed.toFixed(1)}` : '-'}
                      <span className="text-sm ml-1.5 text-gray-400 align-baseline">{displayDownloadSpeed !== null ? displayUnit : ''}</span>
                    </div>
                </div>
                {/* Upload */}
                <div className="flex flex-col items-center justify-center p-4 bg-black/20 min-h-[90px]">
                     <div className="flex items-center text-sm text-gray-400 uppercase tracking-wider font-medium mb-1">
                      <FiUpload className={`w-4 h-4 mr-2 transition-colors ${testStage === 'upload' && isTesting ? 'text-green-400 animate-pulse' : 'text-green-400'}`} />
                      Upload
                    </div>
                    {/* Added min-h-[2.25rem] and flex items-center justify-center */}
                    <div className="text-2xl font-semibold tabular-nums text-gray-100 min-h-[2.25rem] flex items-center justify-center">
                      {isTesting && uploadSpeedMbps === null && testStage === 'upload' ? <FiLoader className="animate-spin text-gray-400 h-6 w-6"/> : displayUploadSpeed !== null ? `${displayUploadSpeed.toFixed(1)}` : '-'}
                      <span className="text-sm ml-1.5 text-gray-400 align-baseline">{displayUploadSpeed !== null ? displayUnit : ''}</span>
                    </div>
                </div>
              </div>
           )}

          {/* Test Button - Modernized look */}
          <div className="my-4">
              <button
                onClick={restartTest}
                // Disable button only while actively testing, allow clicking if done/error
                disabled={isTesting}
                className={`relative inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white rounded-lg shadow-md transition-all duration-300 ease-in-out overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-blue-400 ${
                    isTesting
                      ? 'bg-gradient-to-r from-gray-600 to-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105 active:scale-100'
                }`}
              >
                {/* Background shine effect on hover (optional) */}
                {!isTesting && <span className="absolute top-0 left-0 w-full h-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isTesting ? (
                      <><FiLoader className="animate-spin"/> Testing...</>
                  ) : (
                      <><FiRefreshCw/> {(testStage === 'done' || error) ? 'Test Again' : 'Start Test'}</>
                  )}
                </span>
              </button>
          </div>

          {/* Summary Message Area */}
          <div className="min-h-[60px] w-full max-w-md flex justify-center items-start mt-4">
            {summary && ( // Only show summary if it exists (test done, no error)
              <div className="p-4 bg-gray-800/40 rounded-lg shadow-md border border-gray-700/50 backdrop-blur-md w-full transition-opacity duration-500">
                <p className="text-sm text-gray-300 text-center" role="status" aria-live="polite">{summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-gray-500 text-xs mt-auto pt-6 pb-4 px-4"> {/* mt-auto pushes footer down */}
        Powered by Next.js & Tailwind CSS.
      </footer>
    </main>
  );
}