import React, { useState, useEffect } from 'react';
import { NetworkInfo } from '../../hooks/useNetworkInfo';
import { FiGlobe, FiServer, FiMapPin, FiWifi, FiInfo, FiCheckCircle, FiNavigation, FiAlertTriangle, FiAward, FiZap, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface NetworkInfoDisplayProps {
  networkInfo: NetworkInfo | null;
  loading: boolean;
}

const NetworkInfoDisplay: React.FC<NetworkInfoDisplayProps> = ({ 
  networkInfo, 
  loading
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [connectionStage, setConnectionStage] = useState<'connecting' | 'checking' | 'error' | 'connected'>('connecting');
  const [stageTransition, setStageTransition] = useState(false);
  
  // Track connection state and handle proper sequence with smooth transitions
  useEffect(() => {
    // Initial load always starts with connecting
    if (loading && !dataLoaded) {
      setConnectionStage('connecting');
      return;
    }
    
    // When we receive network info for the first time
    if (networkInfo && !dataLoaded) {
      setDataLoaded(true);
      
      // Add a transition effect before changing state
      setStageTransition(true);
      setTimeout(() => {
        setConnectionStage('checking');
        setStageTransition(false);
      }, 300);
      
      // Give time to show the checking state before deciding on final state
      const timer = setTimeout(() => {
        // Signal that we're about to transition again
        setStageTransition(true);
        
        // Short delay for the transition effect
        setTimeout(() => {
          if (networkInfo.testServer) {
            // If we have server info, we're connected
            setConnectionStage('connected');
          } else {
            // No server info means we're rate limited
            setConnectionStage('error');
          }
          // End the transition effect
          setStageTransition(false);
        }, 300);
      }, 2200); // Slightly longer delay for a more professional look
      
      return () => clearTimeout(timer);
    }
    
    // For subsequent updates after initial load
    if (dataLoaded && !loading) {
      if (networkInfo?.testServer && connectionStage !== 'connected') {
        // If server info becomes available and we're not already in connected state
        setStageTransition(true);
        setTimeout(() => {
          setConnectionStage('connected');
          setStageTransition(false);
        }, 300);
      } else if (!networkInfo?.testServer && connectionStage !== 'connecting' && 
                 connectionStage !== 'checking' && connectionStage !== 'error') {
        // Only show error if we're not in the initial connection phases
        setStageTransition(true);
        setTimeout(() => {
          setConnectionStage('error');
          setStageTransition(false);
        }, 300);
      }
    }
  }, [networkInfo, dataLoaded, loading, connectionStage]);

  // Show skeleton loader while initial loading
  if (loading && !dataLoaded) {
    return (
      <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 p-4 rounded-lg shadow-lg animate-pulse backdrop-blur-sm border border-slate-700/40">
        <div className="flex items-center space-x-2 border-b border-slate-700/50 pb-2 mb-3">
          <div className="w-4 h-4 bg-slate-700 rounded-full"></div>
          <div className="h-3 bg-slate-700 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-14 bg-slate-800/70 rounded-lg"></div>
          <div className="h-14 bg-slate-800/70 rounded-lg"></div>
          <div className="h-14 bg-slate-800/70 rounded-lg"></div>
          <div className="h-14 bg-slate-800/70 rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  // Always display info even if incomplete
  const displayInfo = networkInfo || {
    ip: "Loading...",
    isp: "Loading...",
    city: "Loading...",
    country: "Loading...",
    testServer: null
  };

  // Format distance to ensure it always displays properly
  const formatDistance = (distance: number | undefined) => {
    if (distance === undefined || isNaN(distance)) {
      return "Unknown";
    }
    
    // Add commas for thousands and format to 1 decimal place if needed
    return distance < 100 
      ? distance.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",") 
      : Math.round(distance).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format ISP name to remove AS number details
  const formatISP = (isp: string): string => {
    // Remove any AS number pattern (e.g., "AS12345 Some ISP" -> "Some ISP")
    return isp.replace(/^AS\d+\s+/i, '');
  };

  // Get status indicator based on distance
  const getDistanceStatus = (distance: number | undefined | null): { icon: React.ReactNode; label: string; color: string } => {
    if (typeof distance !== 'number' || isNaN(distance)) {
      return {
        icon: <FiAlertTriangle className="mr-1" />,
        label: "Unknown",
        color: "text-gray-500"
      };  
    }
    
    if (distance < 50) {
      return {
        icon: <FiAward className="mr-1" />,
        label: "Excellent",
        color: "text-green-400"
      };
    } else if (distance < 500) {
      return { icon: <FiCheckCircle className="mr-1" />, label: "Good", color: "text-blue-400" };
    } else if (distance < 2000) {
      return { icon: <FiZap className="mr-1" />, label: "Acceptable", color: "text-yellow-400" };
    } else if (distance < 5000) {
      return { icon: <FiAlertTriangle className="mr-1" />, label: "High Latency", color: "text-amber-500" };
    } else {
      return { icon: <FiAlertTriangle className="mr-1" />, label: "Very High Latency", color: "text-red-500" };
    }
  };

  // Connection stage display text
  const getStageName = () => {
    switch(connectionStage) {
      case 'connecting': return 'Initializing Connection';
      case 'checking': return 'Verifying Server Availability';
      case 'error': return 'Connection Limited';
      case 'connected': return 'Server Connected';
      default: return '';
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900/70 to-slate-800/70 p-4 md:p-5 rounded-lg shadow-lg w-full backdrop-blur-sm border border-slate-700/40 transition-all duration-300 hover:shadow-blue-900/10">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <FiInfo className="text-blue-400" />
          <h3 className="text-sm font-semibold tracking-wide text-blue-100">Network Connection</h3>
        </div>
        <div className="flex items-center">
          <div className="flex items-center bg-slate-900/70 px-3 py-1.5 rounded-full mr-3">
            <span className="inline-flex h-2 w-2 relative mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </span>
            <span className="text-xs font-medium text-green-400">Active</span>
          </div>
          <button 
            className="text-blue-400/80 hover:text-blue-400 flex items-center transition-colors py-1 px-2 rounded-md hover:bg-slate-800/50"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <FiChevronUp className="text-sm" /> : <FiChevronDown className="text-sm" />}
            <span className="ml-1 text-xs">{showDetails ? 'Hide Details' : 'Server Info'}</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* IP Address */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-3 py-3 flex flex-col justify-between group hover:from-slate-800/90 hover:to-slate-900/90 transition-all duration-300 border border-slate-700/30 hover:border-blue-900/30 shadow-sm">
          <div className="flex items-center text-gray-400 mb-1.5 pb-1 border-b border-slate-700/30">
            <FiGlobe className="text-blue-400 mr-2 text-sm" />
            <span className="text-xs font-medium uppercase tracking-wider">IP Address</span>
          </div>
          <div className="font-medium text-white text-sm truncate pt-0.5 group-hover:text-blue-300 transition-colors">
            {loading && !dataLoaded ? 
              <div className="h-4 bg-slate-700/70 rounded w-24 animate-pulse"></div> : 
              displayInfo.ip
            }
          </div>
        </div>
        
        {/* ISP */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-3 py-3 flex flex-col justify-between group hover:from-slate-800/90 hover:to-slate-900/90 transition-all duration-300 border border-slate-700/30 hover:border-green-900/30 shadow-sm">
          <div className="flex items-center text-gray-400 mb-1.5 pb-1 border-b border-slate-700/30">
            <FiWifi className="text-green-400 mr-2 text-sm" />
            <span className="text-xs font-medium uppercase tracking-wider">Provider</span>
          </div>
          <div className="font-medium text-white text-sm truncate pt-0.5 group-hover:text-green-300 transition-colors">
            {loading && !dataLoaded ? 
              <div className="h-4 bg-slate-700/70 rounded w-32 animate-pulse"></div> : 
              formatISP(displayInfo.isp)
            }
          </div>
        </div>
        
        {/* Location */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-3 py-3 flex flex-col justify-between group hover:from-slate-800/90 hover:to-slate-900/90 transition-all duration-300 border border-slate-700/30 hover:border-red-900/30 shadow-sm">
          <div className="flex items-center text-gray-400 mb-1.5 pb-1 border-b border-slate-700/30">
            <FiMapPin className="text-red-400 mr-2 text-sm" />
            <span className="text-xs font-medium uppercase tracking-wider">Location</span>
          </div>
          <div className="font-medium text-white text-sm truncate pt-0.5 group-hover:text-red-300 transition-colors">
            {loading && !dataLoaded ? 
              <div className="h-4 bg-slate-700/70 rounded w-28 animate-pulse"></div> : 
              `${displayInfo.city}, ${displayInfo.country}`
            }
          </div>
        </div>
        
        {/* Test Server - Enhanced with smoother transitions */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-3 py-3 flex flex-col justify-between group hover:from-slate-800/90 hover:to-slate-900/90 transition-all duration-300 border border-slate-700/30 hover:border-purple-900/30 shadow-sm overflow-hidden relative">
          <div className="flex items-center text-gray-400 mb-1.5 pb-1 border-b border-slate-700/30">
            <FiServer className="text-purple-400 mr-2 text-sm" />
            <span className="text-xs font-medium uppercase tracking-wider">Test Server</span>
            
            {/* Connection status pill (replacing the previous indicator) */}
            <div className="ml-auto">
              <div className={`
                flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${connectionStage === 'connected' ? 'bg-green-900/40 text-green-400' : 
                  connectionStage === 'error' ? 'bg-amber-900/40 text-amber-400' : 
                  'bg-blue-900/40 text-blue-400'}
              `}>
                <span className="inline-flex h-1.5 w-1.5 relative mr-1.5">
                  {connectionStage === 'connected' && (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                    </>
                  )}
                  {connectionStage === 'error' && (
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                  )}
                  {(connectionStage === 'connecting' || connectionStage === 'checking') && (
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400 animate-pulse"></span>
                  )}
                </span>
                <span className="capitalize">{connectionStage}</span>
              </div>
            </div>
          </div>
          
          {/* Server content with fade transitions */}
          <div className="flex flex-col min-h-[60px] justify-center relative">
            {/* Connecting state */}
            <div className={`
              absolute inset-0 flex flex-col transition-opacity duration-300 
              ${connectionStage === 'connecting' && !stageTransition ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}>
              <div className="font-medium text-white text-sm truncate pt-0.5">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-slate-700 rounded-full mr-2 animate-pulse"></span>
                  <span>Establishing Connection...</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1 text-xs">
                <div className="flex items-center">
                  <FiNavigation className="text-orange-400 mr-1 text-xs" />
                  <span className="text-gray-400">Locating optimal server</span>
                </div>
                <div className="text-xs text-gray-400 flex items-center">
                  <span>Please wait</span>
                </div>
              </div>
            </div>
            
            {/* Checking state */}
            <div className={`
              absolute inset-0 flex flex-col transition-opacity duration-300 
              ${connectionStage === 'checking' && !stageTransition ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}>
              <div className="font-medium text-white text-sm truncate pt-0.5">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-700 rounded-full mr-2 animate-pulse"></span>
                  <span>Processing Server Response...</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1 text-xs">
                <div className="flex items-center">
                  <FiNavigation className="text-orange-400 mr-1 text-xs" />
                  <span className="text-gray-400">Confirming connection</span>
                </div>
                <div className="text-xs text-blue-400 flex items-center">
                  <span className="animate-pulse">Validating</span>
                </div>
              </div>
            </div>
            
            {/* Error state */}
            <div className={`
              absolute inset-0 flex flex-col transition-opacity duration-300 
              ${connectionStage === 'error' && !stageTransition ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}>
              <div className="font-medium text-white text-sm truncate pt-0.5">
                <div className="flex items-center">
                  <FiAlertTriangle className="text-amber-400 mr-1" />
                  <span>API Rate Limited</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1 text-xs">
                <div className="flex items-center">
                  <FiServer className="text-orange-400 mr-1 text-xs" />
                  <span className="text-gray-400">Using fallback configuration</span>
                </div>
                <div className="text-xs text-amber-400 flex items-center">
                  <span>Alternative server</span>
                </div>
              </div>
            </div>
            
            {/* Connected state */}
            <div className={`
              absolute inset-0 flex flex-col transition-opacity duration-300 
              ${connectionStage === 'connected' && !stageTransition ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}>
              {displayInfo.testServer && (
                <>
                  <div className="font-medium text-white text-sm truncate pt-0.5 group-hover:text-purple-300 transition-colors">
                    {displayInfo.testServer?.location || "Unknown Location"}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <div className="flex items-center">
                      <FiNavigation className="text-orange-400 mr-1 text-xs" />
                      <span className="text-gray-300">{formatDistance(displayInfo.testServer?.distance)} km</span>
                    </div>
                    {displayInfo.testServer?.distance !== undefined ? (
                      <div className={`text-xs ${getDistanceStatus(displayInfo.testServer.distance).color} flex items-center`}>
                        {getDistanceStatus(displayInfo.testServer.distance).icon}
                        <span>{getDistanceStatus(displayInfo.testServer.distance).label}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 flex items-center">
                        <FiAlertTriangle className="mr-1" />
                        <span>Unknown</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Transition overlay - shown during state changes */}
            <div className={`
              absolute inset-0 flex flex-col items-center justify-center
              bg-slate-900/70 backdrop-blur-sm rounded transition-opacity duration-300
              ${stageTransition ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}>
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs font-medium text-blue-300">{getStageName()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Server details panel - Enhanced for connection stages */}
      {showDetails && (
        <div className="mt-4 pt-3 text-xs border-t border-slate-700/30 animate-fadeIn">
          <h4 className="text-gray-400 font-medium mb-2">Server Details</h4>
          
          {/* Timeline indicator for the connection process */}
          <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center
                ${connectionStage === 'connecting' ? 'bg-blue-500' : 'bg-green-500'}`}>
                <FiCheckCircle className="text-white text-xs" />
              </div>
              <span className="mt-1 text-[10px] text-gray-400">Initialize</span>
            </div>
            <div className={`h-0.5 flex-grow mx-1 ${connectionStage === 'connecting' ? 'bg-slate-700' : 'bg-green-500/50'}`}></div>
            
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center
                ${connectionStage === 'checking' ? 'bg-blue-500' : 
                 (connectionStage === 'connecting' ? 'bg-slate-700' : 'bg-green-500')}`}>
                {connectionStage !== 'connecting' && <FiCheckCircle className="text-white text-xs" />}
              </div>
              <span className="mt-1 text-[10px] text-gray-400">Connect</span>
            </div>
            <div className={`h-0.5 flex-grow mx-1 
              ${connectionStage === 'connecting' || connectionStage === 'checking' ? 'bg-slate-700' : 'bg-green-500/50'}`}></div>
            
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center
                ${connectionStage === 'error' ? 'bg-amber-500' : 
                 (connectionStage === 'connected' ? 'bg-green-500' : 'bg-slate-700')}`}>
                {(connectionStage === 'error' || connectionStage === 'connected') && 
                  <FiCheckCircle className="text-white text-xs" />}
              </div>
              <span className="mt-1 text-[10px] text-gray-400">Ready</span>
            </div>
          </div>
          
          {/* Content for different stages */}
          {connectionStage === 'connected' && displayInfo.testServer ? (
            <div className="bg-slate-900/50 p-3 rounded-lg text-gray-300 font-mono shadow-inner">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><span className="text-gray-500">Name:</span> {displayInfo.testServer?.name || "Not connected"}</div>
                <div><span className="text-gray-500">Location:</span> {displayInfo.testServer?.location || "Unknown"}</div>
                <div className="flex items-center">
                  <span className="text-gray-500">Distance:</span> 
                  <span className="ml-1">{formatDistance(displayInfo.testServer?.distance)} km</span>
                  {displayInfo.testServer?.distance !== undefined && (
                    <span className={`ml-2 ${getDistanceStatus(displayInfo.testServer.distance).color} flex items-center`}>
                      {getDistanceStatus(displayInfo.testServer.distance).icon}
                      {getDistanceStatus(displayInfo.testServer.distance).label}
                    </span>
                  )}
                </div>
                <div><span className="text-gray-500">Est. Latency:</span> {typeof displayInfo.testServer?.distance === 'number' ? `~${Math.round(displayInfo.testServer.distance / 15)} ms` : 'N/A'}</div>
                <div className="sm:col-span-2"><span className="text-gray-500">Provider:</span> {formatISP(displayInfo.isp)}</div>
              </div>
            </div>
          ) : connectionStage === 'error' ? (
            <div className="bg-slate-900/50 p-3 rounded-lg shadow-inner">
              <div className="text-amber-300 flex items-center mb-2">
                <FiAlertTriangle className="text-amber-400 mr-2" />
                <span>Server information unavailable - API rate limited (429 error)</span>
              </div>
              <p className="mt-2 text-gray-300">The M-Lab API is rate limiting requests. Testing will continue with limited server selection.</p>
              <p className="mt-1 text-gray-400">Rate limits typically reset after 10-15 minutes.</p>
              <div className="mt-3 p-2 bg-slate-800/60 rounded border border-slate-700/30">
                <p className="text-xs text-blue-300">Testing will proceed with default server selection. Results may still be accurate but server proximity might not be optimal.</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 p-3 rounded-lg shadow-inner">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-3 bg-slate-700/70 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-700/70 rounded"></div>
                    <div className="h-3 bg-slate-700/70 rounded w-5/6"></div>
                  </div>
                  <div className="h-3 bg-slate-700/70 rounded w-1/2"></div>
                </div>
              </div>
              <div className="mt-2 text-blue-300 flex items-center">
                <FiInfo className="text-blue-400 mr-2" />
                <span className={connectionStage === 'checking' ? 'animate-pulse' : ''}>
                  {connectionStage === 'checking' 
                    ? 'Negotiating connection with server...' 
                    : 'Searching for optimal test servers...'}
                </span>
              </div>
            </div>
          )}
          <div className="mt-2 text-gray-400 text-center text-xs">
            <span className="flex items-center justify-center">
              <FiCheckCircle className="text-green-500 mr-1" />
              Data refreshed {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkInfoDisplay;
