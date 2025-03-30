import { SpeedUnit, TestStage } from './types';

/**
 * Convert speed between Mbps and MB/s
 * 1 MB/s = 8 Mbps
 */
export const convertSpeed = (speedMbps: number | null, displayUnit: SpeedUnit): number | null => {
  if (speedMbps === null) return null;
  
  // For MB/s, divide by 8 (because 8 bits = 1 byte)
  if (displayUnit === 'MB/s') {
    return speedMbps / 8;
  }
  
  // Default is already in Mbps
  return speedMbps;
};

/**
 * Get readable status text based on test stage
 */
export const getStatusText = (stage: TestStage, isTesting: boolean): string => {
  if (!isTesting && stage === 'done') {
    return 'Test completed';
  }
  
  if (!isTesting && stage === 'error') {
    return 'Test failed';
  }
  
  if (!isTesting) {
    return 'Waiting to start';
  }
  
  switch (stage) {
    case 'idle':
      return 'Preparing test...';
    case 'ping':
      return 'Measuring latency...';
    case 'download':
      return 'Testing download speed...';
    case 'upload':
      return 'Testing upload speed...';
    case 'done':
      return 'Finalizing test...';
    default:
      return 'Testing connection...';
  }
};
