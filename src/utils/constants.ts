export const BITS_IN_MEGABIT = 1_000_000;
export const BYTES_IN_MEGABYTE = 1024 * 1024;
export const UPLOAD_SIZE_MB = 5; // Simulated upload size
export const DOWNLOAD_FILE_URL = `/download-test.bin`;
export const PING_FILE_URL = `/favicon.ico`; // Small file for ping test
export const MAX_HISTORY_POINTS_PER_STAGE = 75; // Maximum number of data points to keep per test stage (download or upload)
export const MIN_MEASUREMENT_DURATION_SEC = 0.1;
export const PING_TIMEOUT_MS = 3500;
export const DOWNLOAD_UPDATE_INTERVAL_MS = 150;
export const UPLOAD_UPDATE_INTERVAL_MS = 150;
export const NUM_PINGS = 4;

// Default test configuration
export const DEFAULT_TEST_CONFIG = {
  pingTests: 3,        // Number of ping tests to run
  pingTimeout: 2000,   // Ping timeout in milliseconds
  downloadTime: 10,    // Download test duration in seconds
  uploadTime: 10,      // Upload test duration in seconds
  recordInterval: 200, // Interval to record speed measurements in ms
  sampleSize: 50000,   // Sample size for each speed test in bytes
};

// File sizes for readability
export const FILE_SIZES = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
};
