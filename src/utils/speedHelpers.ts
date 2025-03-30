import { SpeedUnit } from './types';

// Unit Conversion
export const convertSpeed = (speedMbps: number | null, targetUnit: SpeedUnit): number | null => {
  if (speedMbps === null || !isFinite(speedMbps) || speedMbps < 0) return null;
  if (targetUnit === 'MBps') {
    return speedMbps / 8;
  }
  return speedMbps;
};

// Status Text Logic
export const getStatusText = (stage: import('./types').TestStage, isTesting: boolean): string => {
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
