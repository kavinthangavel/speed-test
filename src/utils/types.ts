export type SpeedUnit = 'Mbps' | 'MBps';
export type TestStage = 'idle' | 'ping' | 'download' | 'upload' | 'done' | 'error';
export type SpeedDataPoint = { time: number; speed: number | null }; // Relative time within stage
export type CombinedDataPoint = { time: number; downloadSpeed: number | null; uploadSpeed: number | null }; // Absolute time for graph
export type GraphInputData = CombinedDataPoint; // Explicit type for graph component input
