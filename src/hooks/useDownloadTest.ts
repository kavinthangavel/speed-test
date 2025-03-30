import { useCallback } from 'react';
import { 
  DOWNLOAD_FILE_URL, 
  BITS_IN_MEGABIT, 
  DOWNLOAD_UPDATE_INTERVAL_MS, 
  MIN_MEASUREMENT_DURATION_SEC 
} from '../utils/constants';

export const useDownloadTest = (
  setTestStage: (stage: import('../utils/types').TestStage) => void,
  setCurrentSpeedMbps: (speed: number | null) => void,
  setDownloadHistory: React.Dispatch<React.SetStateAction<import('../utils/types').SpeedDataPoint[]>>,
  setDownloadSpeedMbps: (speed: number | null) => void,
  setError: (error: string | null) => void,
  addSpeedDataPoint: (speed: number | null, stage: 'download' | 'upload', stageStartTime: number) => void,
  downloadDurationRef: React.MutableRefObject<number>
) => {
  return useCallback(async (signal: AbortSignal): Promise<number> => {
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
        if (receivedLength === 0) throw new Error("No data received during download test.");
      }

      // Calculate final average speed
      const finalSpeedMbps = (receivedLength * 8 / durationSec) / BITS_IN_MEGABIT;
      // Add final data point with average speed
      addSpeedDataPoint(finalSpeedMbps, 'download', stageStartTime);
      setDownloadSpeedMbps(finalSpeedMbps);
      console.log(`Download Test Complete: ${finalSpeedMbps.toFixed(2)} Mbps`);
      return finalSpeedMbps;

    } catch (err: unknown) {
      downloadDurationRef.current = (performance.now() - stageStartTime) / 1000; // Store duration even on error
      // Type guard for AbortError
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log("Download test aborted.");
        // Add a null point to signal the end if history exists
        setDownloadHistory(prev => prev.length > 0 ? [...prev, { time: downloadDurationRef.current, speed: null }] : []);
        throw err; // Re-throw abort error
      }
      console.error('Download test failed:', err);
      // Provide more specific error message if possible
      const errorMsg = err instanceof Error ? `Download failed: ${err.message}` : 'Download test failed due to an unknown error.';
      setError(errorMsg);
      setDownloadSpeedMbps(null);
      // Add a null point to show graph interruption
      setDownloadHistory(prev => prev.length > 0 ? [...prev, { time: downloadDurationRef.current, speed: null }] : []);
      throw new Error(errorMsg);
    }
  }, [addSpeedDataPoint, setTestStage, setCurrentSpeedMbps, setDownloadHistory, setDownloadSpeedMbps, setError, downloadDurationRef]);
};
