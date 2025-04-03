import React from 'react';
import { useNetworkInfo } from '../hooks/useNetworkInfo';
import {
  NetworkInfoDisplay,
  ErrorDisplay,
} from './speedtest';

const SpeedTest: React.FC = () => {
  const {
    networkInfo,
    error: networkInfoError,
    loading: clientLoading,
  } = useNetworkInfo();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white text-center">Network Information</h1>
      
      <NetworkInfoDisplay 
        networkInfo={networkInfo} 
        loading={clientLoading} 
      />
      
      {networkInfoError && <ErrorDisplay error={networkInfoError} />}
      
      {!networkInfo && !clientLoading && (
        <div className="bg-slate-800/60 p-4 rounded-lg text-center">
          <p className="text-yellow-400 mb-2">
            {networkInfoError 
              ? "Could not connect to network. Please check your connection or try again later." 
              : "Waiting for network information..."}
          </p>
          
          {!networkInfoError && (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeedTest;
