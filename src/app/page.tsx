'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FiDownload, FiUpload, FiZap, FiWifiOff, FiRefreshCw, FiSettings, FiLoader, FiBarChart2 } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Constants ---
const BITS_IN_MEGABIT = 1_000_000;
const BYTES_IN_MEGABYTE = 1024 * 1024;
const UPLOAD_SIZE_MB = 5; // Simulated upload size
const DOWNLOAD_FILE_URL = `/download-test.bin`; // Use a constant for the download URL
const PING_FILE_URL = `/favicon.ico`; // Small file for ping test
const MAX_HISTORY_POINTS_PER_STAGE = 60; // Slightly increase for smoother graph
const MIN_MEASUREMENT_DURATION_SEC = 0.1; // Minimum valid duration for speed calc
const PING_TIMEOUT_MS = 3500; // Timeout for each ping request
const DOWNLOAD_UPDATE_INTERVAL_MS = 150; // How often to update speed during download
const UPLOAD_UPDATE_INTERVAL_MS = 150; // How often to update speed during upload (simulation)
const NUM_PINGS = 4; // Number of ping requests

// --- Types ---
type SpeedUnit = 'Mbps' | 'MBps';
type TestStage = 'idle' | 'ping' | 'download' | 'upload' | 'done' | 'error';
type SpeedDataPoint = { time: number; speed: number | null }; // Relative time within stage
type CombinedDataPoint = { time: number; downloadSpeed: number | null; uploadSpeed: number | null }; // Absolute time for graph
type GraphInputData = CombinedDataPoint; // Explicit type for graph component input

// --- Helper Functions ---

// Unit Conversion
const convertSpeed = (speedMbps: number | null, targetUnit: SpeedUnit): number | null => {
  if (speedMbps === null || !isFinite(speedMbps) || speedMbps < 0) return null;
  if (targetUnit === 'MBps') {
    return speedMbps / 8;
  }
  return speedMbps;
};

// Summary Message Logic
const getSummaryMessage = (dlMbps: number | null, ulMbps: number | null): string => {
    if (dlMbps === null) return "Ready to see how fast this thing goes? Hit 'Test Again'!";
    if (dlMbps <= 0.1) return "Whoa, is the internet unplugged? Speed is near zero. Check your connection!"; // Use a small threshold

    if (dlMbps > 200) return `KA-CHOW! Lightning fast! That's basically winning the Piston Cup of internet speeds!`;
    if (dlMbps > 75) return `Niiice! Super speedy! Streaming, gaming, downloading... you're all set. Go go go!`;
    if (dlMbps > 25) return `Solid! Pretty decent speed, gets the job done for most things. Keep on truckin'!`;
    if (dlMbps > 5) return `Hmm, a bit on the slow side. Might take a coffee break while things load? ☕`;
    return `Oof! Are we stuck in molasses? Might be time to check if something's clogging the tubes!`;
};

// Status Text Logic
const getStatusText = (stage: TestStage, isTesting: boolean, error: string | null): string => {
    if (stage === 'error') return "Test Failed";
    if (stage === 'done' && !isTesting) return "Test Complete";
    if (stage === 'idle' && !isTesting) return "Ready";
    if (isTesting) {
        switch (stage) {
            case 'ping': return "Testing Ping...";
            case 'download': return "Testing Download...";
            case 'upload': return "Testing Upload...";
            default: return "Initializing...";
        }
    }
    return "Preparing...";
};

// --- Custom Tooltip for Graph ---
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        payload: GraphInputData;
        value: number | null;
        dataKey: string;
        name: string; // Added name for clarity
    }>;
    label?: number; // Represents the 'time' value
    unit: SpeedUnit;
}

const CustomTooltipContent = ({ active, payload, label, unit }: CustomTooltipProps) => {
    if (active && payload && payload.length && typeof label === 'number') {
        const point = payload[0]; // Assume data is structured correctly
        if (!point || point.value === null) return null;

        const speedValue = point.value;
        const stage = point.name; // Use the 'name' prop from <Line>

        return (
            <div className="bg-gray-700/80 backdrop-blur-sm text-white p-2 rounded shadow-lg text-xs border border-gray-600">
                <p className="font-semibold mb-1">{`Time: ${label.toFixed(1)}s`}</p>
                <p className={`text-${point.dataKey === 'downloadSpeed' ? 'blue' : 'green'}-300`}>
                    {`${stage}: ${speedValue.toFixed(1)} ${unit}`}
                </p>
            </div>
        );
    }
    return null;
};

// --- Main Component ---
export default function Home() {
    // --- State Variables ---
    const [ping, setPing] = useState<number | null>(null);
    const [downloadSpeedMbps, setDownloadSpeedMbps] = useState<number | null>(null);
    const [uploadSpeedMbps, setUploadSpeedMbps] = useState<number | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testStage, setTestStage] = useState<TestStage>('idle');
    const [error, setError] = useState<string | null>(null);
    const [displayUnit, setDisplayUnit] = useState<SpeedUnit>('Mbps');
    const [downloadHistory, setDownloadHistory] = useState<SpeedDataPoint[]>([]);
    const [uploadHistory, setUploadHistory] = useState<SpeedDataPoint[]>([]);
    const [currentSpeedMbps, setCurrentSpeedMbps] = useState<number | null>(null);

    // Ref for abort controller to avoid stale closures in callbacks
    const abortControllerRef = useRef<AbortController | null>(null);
    // Ref to store the duration of the download test for upload time offsetting
    const downloadDurationRef = useRef<number>(0);

    // --- Data Point Recorder ---
    const addSpeedDataPoint = useCallback((speed: number | null, stage: 'download' | 'upload', stageStartTime: number) => {
        const now = performance.now();
        const time = (now - stageStartTime) / 1000;
        const validSpeed = (speed !== null && isFinite(speed) && speed >= 0) ? speed : null; // Ensure finite and non-negative

        // Use functional updates for state based on previous state
        const setter = stage === 'download' ? setDownloadHistory : setUploadHistory;
        setter(prev => {
            const lastTime = prev.length > 0 ? prev[prev.length - 1].time : -1;
            // Add point only if time has advanced
            if (time > lastTime) {
                const dataPoint = { time: parseFloat(time.toFixed(1)), speed: validSpeed };
                const newData = [...prev, dataPoint];
                // Trim history if it exceeds the max length
                return newData.length > MAX_HISTORY_POINTS_PER_STAGE
                    ? newData.slice(newData.length - MAX_HISTORY_POINTS_PER_STAGE)
                    : newData;
            }
            return prev; // Return previous state if no update needed
        });

        setCurrentSpeedMbps(validSpeed);
    }, []); // No dependencies needed as setters are stable

    // --- Test Stage Functions ---

    const runPingTest = useCallback(async (signal: AbortSignal): Promise<number> => {
        console.log("Starting Ping Test...");
        setTestStage('ping');
        setCurrentSpeedMbps(null); // No speed during ping
        const pingTimes: number[] = [];
        let stageStartTime = performance.now();

        try {
            for (let i = 0; i < NUM_PINGS; i++) {
                if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                const pingStartTime = performance.now();
                // Use a unique query param to bypass browser cache
                await fetch(`${PING_FILE_URL}?t=${Date.now()}-${i}`, {
                    cache: 'no-store',
                    mode: 'no-cors', // no-cors still measures round trip time
                    signal: AbortSignal.timeout(PING_TIMEOUT_MS) // Use built-in timeout
                });
                const pingEndTime = performance.now();
                pingTimes.push(pingEndTime - pingStartTime);
                // Short delay between pings
                if (i < NUM_PINGS - 1) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }

            if (pingTimes.length === 0) throw new Error("No ping responses received.");

            const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;
            const finalPing = Math.max(1, Math.round(avgPing)); // Ensure ping is at least 1ms
            console.log(`Ping Test Complete: ${finalPing} ms`);
            setPing(finalPing);
            return finalPing;

        } catch (err: any) {
             if (err instanceof DOMException && err.name === 'AbortError') {
                 console.log("Ping test aborted.");
                 throw err; // Re-throw abort error
             }
             console.error('Ping test failed:', err);
             const errorMsg = (err instanceof DOMException && err.name === 'TimeoutError')
                 ? 'Ping test timed out. Check connection or firewall.'
                 : 'Ping test failed. Could not reach test server.';
             setError(errorMsg);
             setPing(null);
             throw new Error(errorMsg); // Throw a generic error to signal failure
        }
    }, []); // Dependencies: setTestStage, setCurrentSpeedMbps, setPing, setError

    const runDownloadTest = useCallback(async (signal: AbortSignal): Promise<number> => {
        console.log("Starting Download Test...");
        setTestStage('download');
        setDownloadHistory([]); // Clear previous history
        setCurrentSpeedMbps(0); // Start showing 0 speed

        const stageStartTime = performance.now();
        let receivedLength = 0;
        let lastUpdateTime = stageStartTime;
        let lastUpdateBytes = 0;

        try {
            // Unique query param to prevent caching
            const res = await fetch(`${DOWNLOAD_FILE_URL}?t=${Date.now()}`, { cache: 'no-store', signal });
            if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
            if (!res.body) throw new Error('Response body is missing');

            const reader = res.body.getReader();

            while (true) {
                // Check for abort before and after read
                if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                const { done, value } = await reader.read();
                if (signal.aborted) { // Check again after await
                    reader.cancel('Aborted'); // Attempt to cancel the stream reader
                    throw new DOMException('Aborted', 'AbortError');
                }
                if (done) break;

                receivedLength += value.length;
                const now = performance.now();
                const timeDiffMs = now - lastUpdateTime;

                // Update speed periodically
                if (timeDiffMs >= DOWNLOAD_UPDATE_INTERVAL_MS) {
                    const bytesSinceLast = receivedLength - lastUpdateBytes;
                    const speedMbps = (bytesSinceLast * 8 / (timeDiffMs / 1000)) / BITS_IN_MEGABIT;
                    addSpeedDataPoint(speedMbps, 'download', stageStartTime);
                    lastUpdateTime = now;
                    lastUpdateBytes = receivedLength;
                }
            }

            const downloadEndTime = performance.now();
            const durationSec = (downloadEndTime - stageStartTime) / 1000;
            downloadDurationRef.current = durationSec; // Store duration for upload offset

            if (durationSec < MIN_MEASUREMENT_DURATION_SEC) {
                console.warn("Download measurement duration too short, result might be inaccurate.");
                // Still calculate speed, but maybe flag it later?
                 if (receivedLength === 0) throw new Error("No data received during download test.");
            }

            // Calculate final average speed
            const finalSpeedMbps = (receivedLength * 8 / durationSec) / BITS_IN_MEGABIT;
            // Add final data point with average speed
            addSpeedDataPoint(finalSpeedMbps, 'download', stageStartTime);
            setDownloadSpeedMbps(finalSpeedMbps);
            console.log(`Download Test Complete: ${finalSpeedMbps.toFixed(2)} Mbps`);
            return finalSpeedMbps;

        } catch (err: any) {
            downloadDurationRef.current = (performance.now() - stageStartTime) / 1000; // Store duration even on error
            if (err instanceof DOMException && err.name === 'AbortError') {
                console.log("Download test aborted.");
                // Add a null point to signal the end if history exists
                setDownloadHistory(prev => prev.length > 0 ? [...prev, { time: downloadDurationRef.current, speed: null }] : []);
                throw err; // Re-throw abort error
            }
            console.error('Download test failed:', err);
            const errorMsg = err instanceof Error ? `Download failed: ${err.message}` : 'Download test failed.';
            setError(errorMsg);
            setDownloadSpeedMbps(null);
            // Add a null point to show graph interruption
            setDownloadHistory(prev => prev.length > 0 ? [...prev, { time: downloadDurationRef.current, speed: null }] : []);
            throw new Error(errorMsg); // Throw a generic error
        }
    }, [addSpeedDataPoint]); // Dependencies: set* state functions, addSpeedDataPoint, setError

    const runUploadTest = useCallback(async (signal: AbortSignal): Promise<number> => {
        console.log("Starting Upload Test (Simulated)...");
        setTestStage('upload');
        setUploadHistory([]);
        setCurrentSpeedMbps(0);

        const stageStartTime = performance.now();
        // --- Simulation Logic ---
        // This part remains simulated as implementing a real browser-based upload test
        // accurately requires a dedicated server endpoint that measures received data rate.
        const uploadSizeBytes = UPLOAD_SIZE_MB * BYTES_IN_MEGABYTE;
        // Simulate a slightly variable duration
        const simulationDurationSec = 2.5 + Math.random() * 2; // Simulate 2.5-4.5 seconds
        const numUpdates = Math.max(1, Math.floor((simulationDurationSec * 1000) / UPLOAD_UPDATE_INTERVAL_MS));
        const expectedAvgSpeedMbps = (uploadSizeBytes * 8 / simulationDurationSec) / BITS_IN_MEGABIT;

        try {
            for (let i = 1; i <= numUpdates; i++) {
                if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                // Wait for the interval
                await new Promise(resolve => setTimeout(resolve, UPLOAD_UPDATE_INTERVAL_MS));
                if (signal.aborted) throw new DOMException('Aborted', 'AbortError'); // Check again after await

                // Simulate speed fluctuation around the average
                const speedFluctuation = 0.85 + Math.random() * 0.3; // Fluctuate between 85% and 115%
                const currentSimulatedSpeed = expectedAvgSpeedMbps * speedFluctuation;
                addSpeedDataPoint(currentSimulatedSpeed, 'upload', stageStartTime);
            }

            // Add final average point
             addSpeedDataPoint(expectedAvgSpeedMbps, 'upload', stageStartTime);
             setUploadSpeedMbps(expectedAvgSpeedMbps);
             console.log(`Simulated Upload Test Complete: ${expectedAvgSpeedMbps.toFixed(2)} Mbps`);
             return expectedAvgSpeedMbps;

        } catch (err: any) {
             const uploadDuration = (performance.now() - stageStartTime) / 1000;
             if (err instanceof DOMException && err.name === 'AbortError') {
                 console.log("Upload test aborted.");
                 setUploadHistory(prev => prev.length > 0 ? [...prev, { time: uploadDuration, speed: null }] : []);
                 throw err; // Re-throw abort
             }
             console.error('Upload test simulation failed:', err);
             setError('Upload test failed (simulation).');
             setUploadSpeedMbps(null);
             setUploadHistory(prev => prev.length > 0 ? [...prev, { time: uploadDuration, speed: null }] : []);
             throw new Error('Upload test failed (simulation).');
        }
    }, [addSpeedDataPoint]); // Dependencies: set* state functions, addSpeedDataPoint, setError


    // --- Main Test Orchestration ---
    const startTestFlow = useCallback(async (controller: AbortController) => {
        if (isTesting) {
             console.warn("Test already in progress.");
             return;
        }
        console.log("Initiating Speed Test Sequence...");
        setIsTesting(true);
        setError(null);
        setPing(null);
        setDownloadSpeedMbps(null);
        setUploadSpeedMbps(null);
        setCurrentSpeedMbps(null);
        setDownloadHistory([]);
        setUploadHistory([]);
        setTestStage('idle'); // Start from idle, stages will update
        downloadDurationRef.current = 0; // Reset download duration

        abortControllerRef.current = controller; // Store the controller
        const signal = controller.signal;

        try {
            // Stage 1: Ping
            await runPingTest(signal);
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

            // Stage 2: Download
            await runDownloadTest(signal);
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

            // Stage 3: Upload
            await runUploadTest(signal);
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

            // If all succeed
            setTestStage('done');
            console.log("Speed Test Sequence Completed Successfully.");

        } catch (err: any) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                setError('Test aborted by user.');
                setTestStage('idle'); // Go back to idle on abort
                console.log("Test sequence aborted.");
            } else {
                // Error already set by stage functions
                setTestStage('error'); // Set final stage to error
                console.error("Test sequence failed.", err);
            }
        } finally {
            // Always run cleanup
            setIsTesting(false);
            setCurrentSpeedMbps(null);
            abortControllerRef.current = null; // Clear the ref
            console.log("Test sequence finished or aborted. Cleanup complete.");
        }
    }, [isTesting, runPingTest, runDownloadTest, runUploadTest]); // Add stage functions as dependencies


    // --- Auto-start on Mount ---
    useEffect(() => {
        const controller = new AbortController();
        startTestFlow(controller);

        // Cleanup function
        return () => {
            console.log("Component unmounting, aborting any active test...");
            controller.abort();
            if (abortControllerRef.current === controller) {
                 abortControllerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // --- Restart Test ---
    const handleRestartTest = useCallback(() => {
        if (isTesting && abortControllerRef.current) {
            console.log("Aborting current test to restart...");
            abortControllerRef.current.abort();
            // Let the abort handling clean up state before starting new test
             // Add a small delay to allow abort logic to finish if needed,
             // though the `finally` block in startTestFlow should handle it.
             setTimeout(() => {
                 const newController = new AbortController();
                 startTestFlow(newController);
             }, 100); // Small delay might help ensure state resets cleanly
        } else if (!isTesting) {
             // If not currently testing, start immediately
             const newController = new AbortController();
             startTestFlow(newController);
        }
    }, [isTesting, startTestFlow]);

    // --- Toggle Units ---
    const toggleUnit = useCallback(() => {
        setDisplayUnit(prev => (prev === 'Mbps' ? 'MBps' : 'Mbps'));
    }, []);

    // --- Memoized Derived State ---
    const displayDownloadSpeed = useMemo(() => convertSpeed(downloadSpeedMbps, displayUnit), [downloadSpeedMbps, displayUnit]);
    const displayUploadSpeed = useMemo(() => convertSpeed(uploadSpeedMbps, displayUnit), [uploadSpeedMbps, displayUnit]);
    const displayCurrentSpeed = useMemo(() => convertSpeed(currentSpeedMbps, displayUnit), [currentSpeedMbps, displayUnit]);
    const statusText = useMemo(() => getStatusText(testStage, isTesting, error), [testStage, isTesting, error]);
    const summary = useMemo(() => (testStage === 'done' && !isTesting && error === null)
        ? getSummaryMessage(downloadSpeedMbps, uploadSpeedMbps) // Use base Mbps for logic
        : null, [testStage, isTesting, error, downloadSpeedMbps, uploadSpeedMbps]);


    // --- Prepare Combined Graph Data ---
    const graphData: GraphInputData[] = useMemo(() => {
        try {
            // Convert speeds *before* merging, applying the display unit
            const convertHistory = (history: SpeedDataPoint[]): SpeedDataPoint[] =>
                history
                    .filter(p => p.speed !== null && isFinite(p.speed)) // Ensure valid speed
                    .map(p => ({ ...p, speed: convertSpeed(p.speed, displayUnit) }))
                    .filter((p): p is { time: number; speed: number } => p.speed !== null); // Type guard

            const convertedDownloadHistory = convertHistory(downloadHistory);
            const convertedUploadHistory = convertHistory(uploadHistory);

            // Find the actual end time of the download stage from its history
            // Use the stored duration if history is empty or lacks finite time
            const actualMaxDownloadTime = convertedDownloadHistory.reduce((max, p) => Math.max(max, p.time), 0)
                                        || downloadDurationRef.current || 0;

            const combinedMap = new Map<number, CombinedDataPoint>();

            // Add download points
            convertedDownloadHistory.forEach(p => {
                combinedMap.set(p.time, {
                    time: p.time,
                    downloadSpeed: p.speed,
                    uploadSpeed: null
                });
            });

            // Add upload points, offsetting time
            convertedUploadHistory.forEach(p => {
                 // Offset upload time by the *actual* end time of the download stage
                const adjustedTime = parseFloat((p.time + actualMaxDownloadTime).toFixed(1));
                const existing = combinedMap.get(adjustedTime);
                if (existing) {
                    // If a point exists at this exact time (e.g., last dl point, first ul point)
                    existing.uploadSpeed = p.speed;
                } else {
                    combinedMap.set(adjustedTime, {
                        time: adjustedTime,
                        downloadSpeed: null, // Assume no download at this exact offset time unless overwritten
                        uploadSpeed: p.speed
                    });
                }
            });


             // Ensure download points aren't lost if upload starts at the exact same adjusted time
             // (This check might be redundant if map logic is correct, but safe to keep)
             convertedDownloadHistory.forEach(p => {
                 const existing = combinedMap.get(p.time);
                 if (existing && existing.downloadSpeed === null && p.speed !== null) {
                     existing.downloadSpeed = p.speed;
                 }
             });

            // Convert map to array and sort by time
            const combinedArray = Array.from(combinedMap.values());
            combinedArray.sort((a, b) => a.time - b.time);

            // Final filter shouldn't be necessary if map logic is correct, but keep as safety
            const finalData = combinedArray.filter(p => p.downloadSpeed !== null || p.uploadSpeed !== null);

            // console.log('Processed graphData:', finalData.length); // Log count for debugging if needed
            return finalData;

        } catch (e) {
            console.error("Error preparing graph data:", e);
            return []; // Return empty array on error
        }
    }, [downloadHistory, uploadHistory, displayUnit]); // Depend on history arrays and unit

    // --- JSX Structure ---
    return (
        <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-200 font-sans">

            {/* Settings Toggle */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
                <button
                    onClick={toggleUnit}
                    title={`Switch to ${displayUnit === 'Mbps' ? 'MBps' : 'Mbps'}`}
                    aria-label="Toggle speed unit"
                    className="bg-gray-700/60 hover:bg-gray-600/80 text-gray-300 hover:text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-opacity-75 shadow-md"
                >
                    <FiSettings className="w-5 h-5" />
                    <span className="text-xs font-medium tabular-nums w-10 text-center">{displayUnit}</span>
                </button>
            </div>

            {/* Content Container */}
            <div className="flex flex-col items-center justify-center flex-grow w-full mt-12 sm:mt-8"> {/* Adjusted top margin */}
                <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center"> {/* Increased max-width slightly */}

                    {/* Heading */}
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500">
                        Internet Speed Test
                    </h1>
                    <p className="text-sm text-indigo-300/90 italic mb-8 px-4">
                        Checking your internet... Ready? Ka-chow!
                    </p>

                     {/* Graph and Status Area */}
                    <div className="relative w-full h-64 sm:h-80 mb-8 bg-gradient-to-b from-gray-800/50 to-gray-900/70 border border-gray-700/60 rounded-xl p-4 pt-10 backdrop-blur-lg shadow-xl overflow-hidden">
                        {/* Status/Speed Display Overlay */}
                        <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{statusText}</p>
                             {/* Current Speed Display */}
                             {isTesting && (testStage === 'download' || testStage === 'upload') && displayCurrentSpeed !== null && (
                                <div className={`text-lg font-semibold tabular-nums text-white transition-opacity duration-150 ${currentSpeedMbps === null ? 'opacity-0' : 'opacity-100'}`}>
                                    {displayCurrentSpeed.toFixed(1)}
                                    <span className="text-xs ml-1 text-gray-400 align-baseline">{displayUnit}</span>
                                </div>
                             )}
                              {/* Final Average Speed Hint (Optional) */}
                              {!isTesting && testStage === 'done' && displayDownloadSpeed !== null && (
                                  <div className="hidden sm:block text-sm font-medium tabular-nums text-gray-400">
                                      DL Avg: {displayDownloadSpeed.toFixed(1)} {displayUnit}
                                  </div>
                              )}
                        </div>

                        {/* Recharts Graph */}
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={graphData}
                                margin={{ top: 5, right: 10, left: 0, bottom: 5 }} // Adjusted margins
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" strokeOpacity={0.25} />
                                <XAxis
                                    dataKey="time" type="number" stroke="#9CA3AF" fontSize={10}
                                    tickFormatter={(tick) => `${tick.toFixed(0)}s`} // Use 0 decimal places for seconds axis
                                    domain={['dataMin', 'dataMax']} axisLine={false} tickLine={false}
                                    // interval="preserveStartEnd" // Keep first/last ticks
                                    allowDuplicatedCategory={false} // Important for combined data
                                />
                                <YAxis
                                    stroke="#9CA3AF" fontSize={10} axisLine={false} tickLine={false}
                                    domain={[0, 'auto']} // Start Y axis at 0
                                    tickFormatter={(tick) => tick.toFixed(0)}
                                    width={35} // Give Y axis labels more space
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    content={<CustomTooltipContent unit={displayUnit} />}
                                    cursor={{ stroke: '#A5B4FC', strokeWidth: 1, strokeDasharray: '3 3' }} // Lighter cursor
                                    animationDuration={100} // Faster tooltip animation
                                />
                                {/* Legend only shows when test is done and has data */}
                                {!isTesting && graphData.length > 1 && (testStage === 'done' || testStage === 'error') && (
                                    <Legend
                                        verticalAlign="top" height={24} iconSize={10}
                                        wrapperStyle={{ top: '-10px', right: '5px', fontSize: '10px', opacity: 0.8 }}
                                        payload={[ // Custom payload for better color matching
                                             { value: 'Download', type: 'line', id: 'downloadSpeed', color: '#60A5FA' }, // Tailwind blue-400 approx
                                             { value: 'Upload', type: 'line', id: 'uploadSpeed', color: '#34D399' } // Tailwind green-400 approx
                                         ]}
                                    />
                                )}

                                {/* Download Line */}
                                <Line
                                    name="Download" type="monotone" dataKey="downloadSpeed"
                                    stroke="#60A5FA" strokeWidth={2.5} // Slightly thicker line
                                    dot={false} activeDot={{ r: 5, fill: '#60A5FA', stroke: '#1F2937', strokeWidth: 1 }} // Active dot style
                                    connectNulls={false} isAnimationActive={false} // Keep animations off for live data
                                />
                                {/* Upload Line */}
                                <Line
                                    name="Upload" type="monotone" dataKey="uploadSpeed"
                                    stroke="#34D399" strokeWidth={2.5} // Slightly thicker line
                                    dot={false} activeDot={{ r: 5, fill: '#34D399', stroke: '#1F2937', strokeWidth: 1 }}
                                    connectNulls={false} isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>

                        {/* Overlay Icons/Messages */}
                        {!isTesting && graphData.length === 0 && (testStage === 'idle' || testStage === 'done') && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none text-center">
                                <FiBarChart2 size={40} className="text-gray-600 opacity-60 mb-2" />
                                <p className="text-xs text-gray-500">Graph will appear here</p>
                            </div>
                        )}
                        {isTesting && testStage === 'ping' && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none bg-gray-900/30">
                                <FiLoader size={36} className="text-blue-400 animate-spin" />
                            </div>
                        )}
                        {testStage === 'error' && !isTesting && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none text-center">
                                <FiWifiOff size={40} className="text-red-500/80 mb-2" />
                                <p className="text-xs text-red-400/90">Test failed</p>
                            </div>
                        )}
                    </div>


                    {/* Error Message Area */}
                     <div className="w-full max-w-md mx-auto min-h-[40px] flex items-center justify-center mb-6 px-2">
                         {error && (
                             <div role="alert" className="p-3 bg-red-900/50 border border-red-700/60 rounded-lg text-red-200 flex items-center justify-center gap-3 w-full backdrop-blur-sm transition-opacity duration-300 text-sm shadow-md">
                                 <FiWifiOff size={18} className="flex-shrink-0 text-red-400" />
                                 <span className="text-center">{error}</span>
                             </div>
                         )}
                     </div>


                    {/* Results Display (Conditional Rendering) */}
                     {(testStage === 'done' || (testStage === 'error' && (ping !== null || downloadSpeedMbps !== null || uploadSpeedMbps !== null))) && !isTesting && (
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
                                    {displayDownloadSpeed !== null ? (
                                        <>
                                        {displayDownloadSpeed.toFixed(1)}
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
                                     {displayUploadSpeed !== null ? (
                                         <>
                                         {displayUploadSpeed.toFixed(1)}
                                         <span className="text-sm ml-1.5 text-gray-400 align-baseline">{displayUnit}</span>
                                         </>
                                     ) : <span className="text-gray-500">-</span>}
                                </div>
                            </div>
                         </div>
                     )}

                    {/* Test Button */}
                    <div className="my-4">
                        <button
                            onClick={handleRestartTest}
                            disabled={isTesting}
                            className={`relative inline-flex items-center justify-center px-8 py-3 text-base sm:text-lg font-semibold text-white rounded-lg shadow-md transition-all duration-300 ease-in-out overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-blue-400 ${
                                isTesting
                                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 cursor-not-allowed opacity-70'
                                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-600 hover:scale-[1.03] active:scale-100'
                            }`}
                            aria-label={isTesting ? "Test in progress" : "Start speed test again"}
                        >
                            {/* Subtle hover effect */}
                            {!isTesting && <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 rounded-lg"></span>}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isTesting ? (
                                    <><FiLoader className="animate-spin w-5 h-5"/> Testing...</>
                                ) : (
                                    <><FiRefreshCw className="w-5 h-5"/> Test Again</>
                                )}
                            </span>
                        </button>
                    </div>

                     {/* Summary Message Area */}
                     <div className="min-h-[60px] w-full max-w-md flex justify-center items-start mt-4 px-2">
                         {summary && (
                             <div className="p-4 bg-gray-800/50 rounded-lg shadow-md border border-gray-700/60 backdrop-blur-md w-full transition-opacity duration-700 ease-in-out">
                                 <p className="text-sm text-gray-300 text-center" role="status" aria-live="polite">{summary}</p>
                             </div>
                         )}
                     </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="w-full text-center text-gray-500 text-xs mt-auto pt-6 pb-4 px-4">
                Powered by Next.js, Tailwind CSS & Recharts.
            </footer>
        </main>
    );
}