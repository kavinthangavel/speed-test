import React, { useState } from 'react';
import { NetworkInfo } from '../../hooks/useNetworkInfo';
import { FiGlobe, FiServer, FiMapPin, FiWifi, FiInfo, FiCheckCircle, FiNavigation, FiInfo as FiInfoCircle, FiAlertTriangle, FiAward, FiZap, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface NetworkInfoDisplayProps {
  networkInfo: NetworkInfo | null;
  loading: boolean;
  compact?: boolean;
}

const NetworkInfoDisplay: React.FC<NetworkInfoDisplayProps> = ({ 
  networkInfo, 
  loading,
  compact = false
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
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
  
  if (!networkInfo) {
    return (
      <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-slate-700/40">
        <p className="text-gray-400 text-center text-sm py-3">Loading connection details...</p>
      </div>
    );
  }

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
  const getDistanceStatus = (distance: number): { icon: JSX.Element; label: string; color: string } => {
    if (distance < 50) {
      return {
        icon: <FiAward className="mr-1" />,
        label: "Excellent",
        color: "text-green-400"
      };
    } else if (distance < 500) {
      return {
        icon: <FiCheckCircle className="mr-1" />,
        label: "Good",
        color: "text-blue-400"
      };
    } else if (distance < 2000) {
      return {
        icon: <FiZap className="mr-1" />,
        label: "Acceptable",
        color: "text-yellow-400"
      };
    } else if (distance < 5000) {
      return {
        icon: <FiAlertTriangle className="mr-1" />,
        label: "High Latency",
        color: "text-amber-500"
      };
    } else {
      return {
        icon: <FiAlertTriangle className="mr-1" />,
        label: "Very High Latency",
        color: "text-red-500"
      };
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
          <div className="font-medium text-white text-sm truncate pt-0.5 group-hover:text-blue-300 transition-colors">{networkInfo.ip}</div>
        </div>
        
        {/* ISP */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-3 py-3 flex flex-col justify-between group hover:from-slate-800/90 hover:to-slate-900/90 transition-all duration-300 border border-slate-700/30 hover:border-green-900/30 shadow-sm">
          <div className="flex items-center text-gray-400 mb-1.5 pb-1 border-b border-slate-700/30">
            <FiWifi className="text-green-400 mr-2 text-sm" />
            <span className="text-xs font-medium uppercase tracking-wider">Provider</span>
          </div>
          <div className="font-medium text-white text-sm truncate pt-0.5 group-hover:text-green-300 transition-colors">
            {networkInfo && formatISP(networkInfo.isp)}
          </div>
        </div>
        
        {/* Location */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-3 py-3 flex flex-col justify-between group hover:from-slate-800/90 hover:to-slate-900/90 transition-all duration-300 border border-slate-700/30 hover:border-red-900/30 shadow-sm">
          <div className="flex items-center text-gray-400 mb-1.5 pb-1 border-b border-slate-700/30">
            <FiMapPin className="text-red-400 mr-2 text-sm" />
            <span className="text-xs font-medium uppercase tracking-wider">Location</span>
          </div>
          <div className="font-medium text-white text-sm truncate pt-0.5 group-hover:text-red-300 transition-colors">
            {networkInfo.city}, {networkInfo.country}
          </div>
        </div>
        
        {/* Test Server (Combined) */}
        {networkInfo.testServer && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg px-3 py-3 flex flex-col justify-between group hover:from-slate-800/90 hover:to-slate-900/90 transition-all duration-300 border border-slate-700/30 hover:border-purple-900/30 shadow-sm">
            <div className="flex items-center text-gray-400 mb-1.5 pb-1 border-b border-slate-700/30">
              <FiServer className="text-purple-400 mr-2 text-sm" />
              <span className="text-xs font-medium uppercase tracking-wider">Test Server</span>
            </div>
            <div className="flex flex-col">
              <div className="font-medium text-white text-sm truncate pt-0.5 group-hover:text-purple-300 transition-colors">
                {networkInfo.testServer.location}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs">
                <div className="flex items-center">
                  <FiNavigation className="text-orange-400 mr-1 text-xs" />
                  <span className="text-gray-300">{formatDistance(networkInfo.testServer.distance)} km</span>
                </div>
                <div className={`text-xs ${getDistanceStatus(networkInfo.testServer.distance).color} flex items-center`}>
                  {getDistanceStatus(networkInfo.testServer.distance).icon}
                  <span>{getDistanceStatus(networkInfo.testServer.distance).label}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Server details panel */}
      {showDetails && networkInfo.testServer && (
        <div className="mt-4 pt-3 text-xs border-t border-slate-700/30 animate-fadeIn">
          <h4 className="text-gray-400 font-medium mb-2">Server Details</h4>
          <div className="bg-slate-900/50 p-3 rounded-lg text-gray-300 font-mono shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><span className="text-gray-500">Name:</span> {networkInfo.testServer.name}</div>
              <div><span className="text-gray-500">Location:</span> {networkInfo.testServer.location}</div>
              <div className="flex items-center">
                <span className="text-gray-500">Distance:</span> 
                <span className="ml-1">{formatDistance(networkInfo.testServer.distance)} km</span>
                <span className={`ml-2 ${getDistanceStatus(networkInfo.testServer.distance).color} flex items-center`}>
                  {getDistanceStatus(networkInfo.testServer.distance).icon}
                  {getDistanceStatus(networkInfo.testServer.distance).label}
                </span>
              </div>
              <div><span className="text-gray-500">Est. Latency:</span> ~{Math.round(networkInfo.testServer.distance / 15)} ms</div>
              <div className="sm:col-span-2"><span className="text-gray-500">Provider:</span> {formatISP(networkInfo.isp)}</div>
            </div>
          </div>
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
