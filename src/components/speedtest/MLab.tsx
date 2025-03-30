import React, { useState, useEffect } from 'react';
import { NetworkInfo } from '../../hooks/useNetworkInfo';
import { FiActivity, FiDownload, FiUpload, FiClock } from 'react-icons/fi';

interface MLab7Results {
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  serverName: string;
  serverLocation: string;
}

interface MLab7Props {
  networkInfo: NetworkInfo | null;
  onStart?: () => void;
  onComplete?: (results: MLab7Results) => void;
  onError?: (error: string) => void;
  onLatency?: (data: { latency: number }) => void;
}

// We'll need this for TypeScript but avoid the global declaration
interface NDT7Client {
  new(config: any): {
    startTest: (testType: 'download' | 'upload', options: any) => void;
  }
}

const MLab7: React.FC<MLab7Props> = ({ 
  networkInfo, 
  onStart, 
  onComplete, 
  onError,
  onLatency
}) => {
  const [status, setStatus] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentDownload, setCurrentDownload] = useState<number | null>(null);
  const [currentUpload, setCurrentUpload] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<MLab7Results | null>(null);
  const [clientReady, setClientReady] = useState<boolean>(false);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // We use dynamic import to load client only in browser
    let isMounted = true;
    
    const loadNDT7Client = async () => {
      try {
        // Using dynamic import for client-side only code
        if (typeof window !== 'undefined') {
          const NDT7Module = await import('@m-lab/ndt7').catch(e => {
            console.error('Failed to load NDT7 module:', e);
            return null;
          });

          if (isMounted && NDT7Module) {
            setClient(NDT7Module.NDT7Client);
            setClientReady(true);
          }
        }
      } catch (err) {
        console.error('Failed to load M-Lab NDT7 client:', err);
        if (isMounted) {
          onError?.('Failed to load M-Lab NDT7 client');
        }
      }
    };
    
    loadNDT7Client();
    
    return () => {
      isMounted = false;
    };
  }, [onError]);

  const runTest = async () => {
    if (!networkInfo?.testServer || !client) {
      onError?.('Test server or NDT7 client not available');
      return;
    }

    setIsRunning(true);
    setStatus('Initializing test...');
    setCurrentDownload(null);
    setCurrentUpload(null);
    setProgress(0);
    setResults(null);
    onStart?.();

    try {
      const NDT7Instance = new client({
        userAcceptedDataPolicy: true,
        mlabServer: networkInfo.testServer.name,
        onError: (err: Error) => {
          console.error('NDT7 test error:', err);
          onError?.(err.message || 'Error during NDT7 test');
          setIsRunning(false);
        }
      });

      // Perform download test
      setStatus('Testing download speed...');
      setProgress(10);
      
      let downloadSpeed = 0;
      
      NDT7Instance.startTest('download', {
        onprogress: (data: any) => {
          if (data && data.MeanClientMbps) {
            const mbps = data.MeanClientMbps;
            downloadSpeed = mbps;
            setCurrentDownload(mbps);
            setProgress(25 + Math.min(25, mbps / 2)); // Progress up to 50% during download
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for download test to complete

      // Measure latency
      setStatus('Measuring latency...');
      setProgress(50);
      
      const latencyStart = Date.now();
      try {
        await fetch(networkInfo.testServer.urls.wss.replace('wss://', 'https://'), { 
          method: 'HEAD',
          mode: 'no-cors'
        });
      } catch (e) {
        console.warn('Latency measurement failed:', e);
      }
      const latency = Date.now() - latencyStart;
      
      if (onLatency) {
        onLatency({ latency });
      }
      
      setProgress(60);
      
      // Perform upload test
      setStatus('Testing upload speed...');
      
      let uploadSpeed = 0;
      
      NDT7Instance.startTest('upload', {
        onprogress: (data: any) => {
          if (data && data.MeanClientMbps) {
            const mbps = data.MeanClientMbps;
            uploadSpeed = mbps;
            setCurrentUpload(mbps);
            setProgress(60 + Math.min(35, mbps / 2)); // Progress from 60% to 95%
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for upload test to complete
      
      setStatus('Test completed');
      setProgress(100);
      
      const finalResults: MLab7Results = {
        downloadMbps: downloadSpeed || 0,
        uploadMbps: uploadSpeed || 0,
        latencyMs: latency,
        serverName: networkInfo.testServer.name,
        serverLocation: networkInfo.testServer.location
      };
      
      setResults(finalResults);
      onComplete?.(finalResults);
    } catch (err) {
      console.error('Error running NDT7 test:', err);
      onError?.(err instanceof Error ? err.message : 'Unknown error during test');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-slate-800/60 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-2 flex items-center">
        <FiActivity className="mr-2 text-blue-400" />
        M-Lab NDT7 Speed Test
      </h3>
      
      {!isRunning && !results && (
        <div className="text-center py-4">
          <p className="text-gray-300 mb-4">
            Test your connection speed with M-Lab's NDT7 platform
          </p>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={runTest}
            disabled={!networkInfo?.testServer || !clientReady}
          >
            Start Test
          </button>
          {!clientReady && (
            <p className="text-yellow-400 text-sm mt-2">
              Loading test client...
            </p>
          )}
        </div>
      )}
      
      {isRunning && (
        <div className="space-y-4 py-2">
          <p className="text-center text-white">{status}</p>
          
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <FiClock className="mx-auto text-yellow-400 mb-1" />
              <p className="text-gray-400 text-xs">Latency</p>
              <p className="text-white font-bold">...</p>
            </div>
            
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <FiDownload className="mx-auto text-green-400 mb-1" />
              <p className="text-gray-400 text-xs">Download</p>
              <p className="text-white font-bold">
                {currentDownload ? `${currentDownload.toFixed(2)} Mbps` : '...'}
              </p>
            </div>
            
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <FiUpload className="mx-auto text-purple-400 mb-1" />
              <p className="text-gray-400 text-xs">Upload</p>
              <p className="text-white font-bold">
                {currentUpload ? `${currentUpload.toFixed(2)} Mbps` : '...'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {results && !isRunning && (
        <div className="space-y-4 py-2">
          <p className="text-center text-green-400 font-medium">Test Completed</p>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <FiClock className="mx-auto text-yellow-400 mb-1" />
              <p className="text-gray-400 text-xs">Latency</p>
              <p className="text-white font-bold">{results.latencyMs} ms</p>
            </div>
            
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <FiDownload className="mx-auto text-green-400 mb-1" />
              <p className="text-gray-400 text-xs">Download</p>
              <p className="text-white font-bold">{results.downloadMbps.toFixed(2)} Mbps</p>
            </div>
            
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <FiUpload className="mx-auto text-purple-400 mb-1" />
              <p className="text-gray-400 text-xs">Upload</p>
              <p className="text-white font-bold">{results.uploadMbps.toFixed(2)} Mbps</p>
            </div>
          </div>
          
          <div className="text-center pt-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              onClick={runTest}
            >
              Run Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLab7;
