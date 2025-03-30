import { useCallback } from 'react';
import { 
  UPLOAD_SIZE_MB, 
  BYTES_IN_MEGABYTE, 
  BITS_IN_MEGABIT, 
  UPLOAD_UPDATE_INTERVAL_MS 
} from '../utils/constants';

export const useUploadTest = (
  setTestStage: (stage: import('../utils/types').TestStage) => void,
  setCurrentSpeedMbps: (speed: number | null) => void,
  setUploadHistory: React.Dispatch<React.SetStateAction<import('../utils/types').SpeedDataPoint[]>>,
  setUploadSpeedMbps: (speed: number | null) => void,
  setError: (error: string | null) => void,
  addSpeedDataPoint: (speed: number | null, stage: 'download' | 'upload', stageStartTime: number) => void
) => {
  return useCallback(async (signal: AbortSignal): Promise<number> => {
    console.log("Starting Upload Test (Simulated)...");
    setTestStage('upload');
    setUploadHistory([]);
    setCurrentSpeedMbps(0);

    const stageStartTime = performance.now();
    // --- Simulation Logic ---
    const uploadSizeBytes = UPLOAD_SIZE_MB * BYTES_IN_MEGABYTE;
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

    } catch (err: unknown) {
      const uploadDuration = (performance.now() - stageStartTime) / 1000;
      // Type guard for AbortError
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log("Upload test aborted.");
        setUploadHistory(prev => prev.length > 0 ? [...prev, { time: uploadDuration, speed: null }] : []);
        throw err; // Re-throw abort
      }
      console.error('Upload test simulation failed:', err);
      const errorMsg = err instanceof Error ? `Upload failed: ${err.message}` : 'Upload test simulation failed.';
      setError(errorMsg);
      setUploadSpeedMbps(null);
      setUploadHistory(prev => prev.length > 0 ? [...prev, { time: uploadDuration, speed: null }] : []);
      throw new Error(errorMsg);
    }
  }, [addSpeedDataPoint, setTestStage, setCurrentSpeedMbps, setUploadHistory, setUploadSpeedMbps, setError]);
};
