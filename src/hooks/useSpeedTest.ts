import { useState, useCallback, useRef, useMemo } from 'react';
import { SpeedUnit, TestStage, SpeedDataPoint, GraphInputData } from '../utils/types';
import { usePingTest } from './usePingTest';
import { useDownloadTest } from './useDownloadTest';
import { useUploadTest } from './useUploadTest';
import { convertSpeed, getStatusText } from '../utils/speedHelpers';
import { MAX_HISTORY_POINTS_PER_STAGE } from '../utils/constants';

export const useSpeedTest = () => {
  // --- State Variables ---
  const [ping, setPing] = useState<number | null>(null);
  const [downloadSpeedMbps, setDownloadSpeedMbps] = useState<number | null>(null);
  const [uploadSpeedMbps, setUploadSpeedMbps] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testStage, setTestStage] = useState<TestStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [displayUnit, setDisplayUnit] = useState<SpeedUnit>('MB/s');
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
    const validSpeed = (speed !== null && isFinite(speed) && speed >= 0) ? speed : null;

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
      return prev;
    });

    setCurrentSpeedMbps(validSpeed);
  }, []);

  // --- Individual Test Stage Functions ---
  const runPingTest = usePingTest(setTestStage, setCurrentSpeedMbps, setPing, setError);
  const runDownloadTest = useDownloadTest(
    setTestStage, 
    setCurrentSpeedMbps,
    setDownloadHistory,
    setDownloadSpeedMbps,
    setError,
    addSpeedDataPoint,
    downloadDurationRef
  );
  const runUploadTest = useUploadTest(
    setTestStage,
    setCurrentSpeedMbps,
    setUploadHistory,
    setUploadSpeedMbps,
    setError,
    addSpeedDataPoint
  );

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

    } catch (err: unknown) {
      // Type guard for AbortError
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Test aborted by user.');
        setTestStage('idle'); // Go back to idle on abort
        console.log("Test sequence aborted.");
      } else {
        // Error should have been set by stage functions, but set stage here
        setTestStage('error');
        console.error("Test sequence failed in startTestFlow:", err);
      }
    } finally {
      // Always run cleanup
      setIsTesting(false);
      setCurrentSpeedMbps(null);
      abortControllerRef.current = null; // Clear the ref
      console.log("Test sequence finished or aborted. Cleanup complete.");
    }
  }, [isTesting, runPingTest, runDownloadTest, runUploadTest]);

  // --- Restart Test ---
  const handleRestartTest = useCallback(() => {
    if (isTesting && abortControllerRef.current) {
      console.log("Aborting current test to restart...");
      abortControllerRef.current.abort();
      // Let the abort handling clean up state before starting new test
      setTimeout(() => {
        const newController = new AbortController();
        startTestFlow(newController);
      }, 100);
    } else if (!isTesting) {
      // If not currently testing, start immediately
      const newController = new AbortController();
      startTestFlow(newController);
    }
  }, [isTesting, startTestFlow]);

  // --- Toggle Units ---
  const toggleUnit = useCallback(() => {
    // Corrected 'MBps' to 'MB/s' to match SpeedUnit type
    setDisplayUnit(prev => (prev === 'Mbps' ? 'MB/s' : 'Mbps')); 
  }, []);

  // --- Derived State ---
  const displayDownloadSpeed = useMemo(() => 
    convertSpeed(downloadSpeedMbps, displayUnit), 
    [downloadSpeedMbps, displayUnit]
  );
  
  const displayUploadSpeed = useMemo(() => 
    convertSpeed(uploadSpeedMbps, displayUnit), 
    [uploadSpeedMbps, displayUnit]
  );
  
  const displayCurrentSpeed = useMemo(() => 
    convertSpeed(currentSpeedMbps, displayUnit), 
    [currentSpeedMbps, displayUnit]
  );
  
  const statusText = useMemo(() => 
    getStatusText(testStage, isTesting), 
    [testStage, isTesting]
  );

  // --- Prepare Graph Data ---
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
      // Ensure downloadDurationRef.current is non-negative
      const validDownloadDuration = Math.max(0, downloadDurationRef.current || 0);
      const actualMaxDownloadTime = convertedDownloadHistory.reduce((max, p) => Math.max(max, p.time), 0)
                                  || validDownloadDuration;

      const combinedMap = new Map<number, GraphInputData>();

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
          // If a point exists at this exact time
          existing.uploadSpeed = p.speed;
        } else {
          combinedMap.set(adjustedTime, {
            time: adjustedTime,
            downloadSpeed: null,
            uploadSpeed: p.speed
          });
        }
      });

      // Ensure download points aren't lost if upload starts at the exact same adjusted time
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
      return finalData;

    } catch (e) {
      console.error("Error preparing graph data:", e);
      return []; // Return empty array on error
    }
  }, [downloadHistory, uploadHistory, displayUnit]);

  return {
    // State
    ping,
    downloadSpeedMbps,
    uploadSpeedMbps,
    isTesting,
    testStage,
    error,
    displayUnit,
    currentSpeedMbps,
    
    // Derived values
    displayDownloadSpeed,
    displayUploadSpeed,
    displayCurrentSpeed,
    statusText,
    graphData,
    
    // Actions
    handleRestartTest,
    toggleUnit,
    startTestFlow
  };
};
