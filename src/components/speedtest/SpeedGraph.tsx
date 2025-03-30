import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiBarChart2, FiLoader, FiWifiOff } from 'react-icons/fi';
import CustomTooltip from './CustomTooltip';
import { GraphInputData, SpeedUnit, TestStage } from '../../utils/types';

interface SpeedGraphProps {
  graphData: GraphInputData[];
  displayUnit: SpeedUnit;
  testStage: TestStage;
  isTesting: boolean;
  currentSpeedMbps: number | null;
  statusText: string;
  error: string | null;
}

const SpeedGraph: React.FC<SpeedGraphProps> = ({
  graphData,
  displayUnit,
  testStage,
  isTesting,
  currentSpeedMbps,
  statusText,
  error
}) => {
  return (
    <div className="relative w-full h-64 sm:h-80 mb-8 bg-gradient-to-b from-gray-800/50 to-gray-900/70 border border-gray-700/60 rounded-xl p-4 pt-10 backdrop-blur-lg shadow-xl overflow-hidden">
      {/* Status/Speed Display Overlay */}
      <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{statusText}</p>
        {/* Current Speed Display */}
        {isTesting && (testStage === 'download' || testStage === 'upload') && currentSpeedMbps !== null && (
          <div className={`text-lg font-semibold tabular-nums text-white transition-opacity duration-150 ${currentSpeedMbps === null ? 'opacity-0' : 'opacity-100'}`}>
            {currentSpeedMbps.toFixed(1)}
            <span className="text-xs ml-1 text-gray-400 align-baseline">{displayUnit}</span>
          </div>
        )}
      </div>

      {/* Recharts Graph */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={graphData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" strokeOpacity={0.25} />
          <XAxis
            dataKey="time" type="number" stroke="#9CA3AF" fontSize={10}
            tickFormatter={(tick) => `${tick.toFixed(0)}s`}
            domain={['dataMin', 'dataMax']} axisLine={false} tickLine={false}
            allowDuplicatedCategory={false}
          />
          <YAxis
            stroke="#9CA3AF" fontSize={10} axisLine={false} tickLine={false}
            domain={[0, 'auto']}
            tickFormatter={(tick) => tick.toFixed(0)}
            width={35}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip unit={displayUnit} />}
            cursor={{ stroke: '#A5B4FC', strokeWidth: 1, strokeDasharray: '3 3' }}
            animationDuration={100}
          />
          {/* Legend only shows when test is done and has data */}
          {!isTesting && graphData.length > 1 && (testStage === 'done' || testStage === 'error') && (
            <Legend
              verticalAlign="top" height={24} iconSize={10}
              wrapperStyle={{ top: '-10px', right: '5px', fontSize: '10px', opacity: 0.8 }}
              payload={[
                { value: 'Download', type: 'line', id: 'downloadSpeed', color: '#60A5FA' },
                { value: 'Upload', type: 'line', id: 'uploadSpeed', color: '#34D399' }
              ]}
            />
          )}

          {/* Download Line */}
          <Line
            name="Download" type="monotone" dataKey="downloadSpeed"
            stroke="#60A5FA" strokeWidth={2.5}
            dot={false} activeDot={{ r: 5, fill: '#60A5FA', stroke: '#1F2937', strokeWidth: 1 }}
            connectNulls={false} isAnimationActive={false}
          />
          {/* Upload Line */}
          <Line
            name="Upload" type="monotone" dataKey="uploadSpeed"
            stroke="#34D399" strokeWidth={2.5}
            dot={false} activeDot={{ r: 5, fill: '#34D399', stroke: '#1F2937', strokeWidth: 1 }}
            connectNulls={false} isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Overlay Icons/Messages */}
      {!isTesting && graphData.length === 0 && (testStage === 'idle' || testStage === 'done') && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none text-center">
          <FiBarChart2 size={40} className="text-gray-600 opacity-60 mb-2" />
          <p className="text-xs text-gray-500">Graph will appear here</p>
        </div>
      )}
      {isTesting && testStage === 'ping' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none bg-gray-900/30">
          <FiLoader size={36} className="text-blue-400 animate-spin" />
        </div>
      )}
      {testStage === 'error' && !isTesting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none text-center">
          <FiWifiOff size={40} className="text-red-500/80 mb-2" />
          <p className="text-xs text-red-400/90">Test failed</p>
        </div>
      )}
    </div>
  );
};

export default SpeedGraph;
