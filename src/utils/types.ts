// Speed unit types
export type SpeedUnit = 'Mbps' | 'MB/s'; 

// Test stage types
export type TestStage = 'idle' | 'ping' | 'download' | 'upload' | 'done' | 'error';

// Speed data point structure
export interface SpeedDataPoint {
  time: number;
  speed: number | null;
}

// Graph data structure
export interface GraphInputData {
  time: number;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
}
