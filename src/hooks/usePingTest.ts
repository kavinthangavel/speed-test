import { useCallback } from 'react';
import { PING_FILE_URL, NUM_PINGS, PING_TIMEOUT_MS } from '../utils/constants';

export const usePingTest = (
  setTestStage: (stage: import('../utils/types').TestStage) => void,
  setCurrentSpeedMbps: (speed: number | null) => void,
  setPing: (ping: number | null) => void,
  setError: (error: string | null) => void
) => {
  return useCallback(async (signal: AbortSignal): Promise<number> => {
    console.log("Starting Ping Test...");
    setTestStage('ping');
    setCurrentSpeedMbps(null); // No speed during ping
    const pingTimes: number[] = [];

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

    } catch (err: unknown) {
      // Type guard for DOMException
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log("Ping test aborted.");
        throw err; // Re-throw abort error
      }
      console.error('Ping test failed:', err);
      // Type guard for TimeoutError within DOMException
      const errorMsg = (err instanceof DOMException && err.name === 'TimeoutError')
        ? 'Ping test timed out. Check connection or firewall.'
        : (err instanceof Error ? err.message : 'Ping test failed. Could not reach test server.');
      setError(errorMsg);
      setPing(null);
      throw new Error(errorMsg);
    }
  }, [setTestStage, setCurrentSpeedMbps, setPing, setError]);
};
