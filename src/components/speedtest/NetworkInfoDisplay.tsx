import React, { useState, useEffect } from 'react';
import { NetworkInfo } from '../../hooks/useNetworkInfo';
import { FiGlobe, FiServer, FiMapPin, FiWifi, FiInfo, FiNavigation, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface NetworkInfoDisplayProps {
  networkInfo: NetworkInfo | null;
  loading: boolean;
  isMobile?: boolean;
}

const NetworkInfoDisplay: React.FC<NetworkInfoDisplayProps> = ({ 
  networkInfo, 
  loading,
  isMobile = false
}) => {
  const [showDetails, setShowDetails] = useState(!isMobile);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  useEffect(() => {
    if (loading && !dataLoaded) {
      return;
    }
    
    if (networkInfo && !dataLoaded) {
      setDataLoaded(true);
    }
  }, [networkInfo, dataLoaded, loading]);

  const displayInfo = networkInfo || {
    ip: "Loading...",
    isp: "Loading...",
    city: "Loading...",
    country: "Loading...",
    testServer: null
  };

  const formatDistance = (distance: number | undefined) => {
    if (distance === undefined || isNaN(distance)) return "Unknown";
    return distance < 100 
      ? distance.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",") 
      : Math.round(distance).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatISP = (isp: string): string => {
    return isp.replace(/^AS\d+\s+/i, '');
  };

  if (loading && !dataLoaded) {
    return (
      <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 p-2 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm border border-slate-700/40 relative overflow-hidden">
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-600/10 to-transparent"></div>
        
        {/* Header skeleton */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/30 mb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-slate-700/70"></div>
            <div className="h-4 w-32 bg-slate-700/70 rounded"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-5 w-16 bg-slate-700/70 rounded-full"></div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-2 sm:px-3 py-2 sm:py-3">
              <div className="flex items-center mb-1 pb-1 border-b border-slate-700/30">
                <div className="w-4 h-4 rounded-full bg-slate-700/70 mr-2"></div>
                <div className="h-3 w-16 bg-slate-700/70 rounded"></div>
              </div>
              <div className="flex flex-col space-y-2 pt-1">
                <div className="h-4 w-full bg-slate-700/50 rounded"></div>
                {index === 3 && (
                  <div className="flex items-center justify-end">
                    <div className="h-3 w-12 bg-slate-700/50 rounded"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cardClasses = `
    bg-gradient-to-r from-slate-900/70 to-slate-800/70 
    p-2 sm:p-4 rounded-lg shadow-lg w-full 
    backdrop-blur-sm border border-slate-700/40 
    transition-all duration-300
    ${isMobile ? 'hover:bg-slate-800/80 active:bg-slate-800/90 cursor-pointer' : 'hover:shadow-blue-900/10'}
    ${isMobile && !showDetails ? 'h-12' : 'h-auto'}
  `;

  return (
    <div 
      className={cardClasses}
      onClick={() => isMobile ? setShowDetails(!showDetails) : undefined}
      role={isMobile ? "button" : undefined}
    > 
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/50 mb-2.5">
        <div className="flex items-center space-x-2">
          <FiInfo className="text-blue-400" />
          <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-blue-100">
            Connection Info
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center ${isMobile ? 'bg-slate-800/90' : 'bg-slate-900/70'} px-2 py-0.5 sm:py-1.5 rounded-full`}>
            <span className="inline-flex h-2 w-2 relative mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </span>
            <span className="text-xs font-medium text-green-400">Active</span>
          </div>
          {isMobile && !showDetails && (
            <div className="flex items-center bg-blue-900/20 px-2 py-0.5 rounded-full">
              <span className="text-[10px] font-medium tracking-wide text-blue-300/90">
                Tap to view
              </span>
            </div>
          )}
          {!isMobile && (
            <button 
              className="text-blue-400/80 hover:text-blue-400 flex items-center transition-colors py-1 px-2 rounded-md hover:bg-slate-800/50"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <FiChevronUp className="text-sm" /> : <FiChevronDown className="text-sm" />}
              <span className="ml-1 text-xs">{showDetails ? 'Hide Details' : 'Show Details'}</span>
            </button>
          )}
        </div>
      </div>
      
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${isMobile && !showDetails ? 'hidden' : ''}`}>
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-2 sm:px-3 py-2 sm:py-3 flex flex-col justify-between">
          <div className="flex items-center text-gray-400 mb-1 pb-0.5 sm:pb-1 border-b border-slate-700/30">
            <FiGlobe className="text-blue-400 mr-2 text-sm" />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">IP</span>
          </div>
          <div className="font-medium text-white text-[11px] sm:text-sm truncate pt-0.5">
            {displayInfo.ip}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-2 sm:px-3 py-2 sm:py-3 flex flex-col justify-between">
          <div className="flex items-center text-gray-400 mb-1 pb-0.5 sm:pb-1 border-b border-slate-700/30">
            <FiWifi className="text-green-400 mr-2 text-sm" />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Provider</span>
          </div>
          <div className="font-medium text-white text-[11px] sm:text-sm truncate pt-0.5">
            {formatISP(displayInfo.isp)}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-2 sm:px-3 py-2 sm:py-3 flex flex-col justify-between">
          <div className="flex items-center text-gray-400 mb-1 pb-0.5 sm:pb-1 border-b border-slate-700/30">
            <FiMapPin className="text-red-400 mr-2 text-sm" />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Location</span>
          </div>
          <div className="font-medium text-white text-[11px] sm:text-sm truncate pt-0.5">
            {`${displayInfo.city}, ${displayInfo.country}`}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-2 sm:px-3 py-2 sm:py-3 flex flex-col justify-between">
          <div className="flex items-center text-gray-400 mb-1 pb-0.5 sm:pb-1 border-b border-slate-700/30">
            <FiServer className="text-purple-400 mr-2 text-sm" />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Server</span>
          </div>
          <div className="font-medium text-white text-[11px] sm:text-sm truncate pt-0.5">
            {displayInfo.testServer ? (
              <>
                <div className="flex items-center justify-between">
                  <span>{displayInfo.testServer.location}</span>
                  <div className="flex items-center text-[10px] sm:text-xs text-gray-400">
                    <FiNavigation className="text-orange-400 mr-1" />
                    <span>{formatDistance(displayInfo.testServer.distance)} km</span>
                  </div>
                </div>
              </>
            ) : (
              <span className="text-gray-400">Selecting...</span>
            )}
          </div>
        </div>
      </div>

      {showDetails && !isMobile && (
        <div className="mt-3 pt-2 text-xs border-t border-slate-700/30">
          <div className="bg-slate-900/50 p-2.5 rounded-lg text-gray-300 font-mono shadow-inner">
            {displayInfo.testServer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Host:</span>
                  <span className="ml-1">{displayInfo.testServer.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Server Type:</span>
                  <span className="ml-1">Measurement Lab (NDT7)</span>
                </div>
                <div>
                  <span className="text-gray-500">Server Status:</span>
                  <span className="ml-1 text-green-400">Active</span>
                </div>
                <div>
                  <span className="text-gray-500">Connection:</span>
                  <span className="ml-1">{displayInfo.ip.includes(':') ? 'IPv6' : 'IPv4'} / WebSocket (WSS)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkInfoDisplay;
