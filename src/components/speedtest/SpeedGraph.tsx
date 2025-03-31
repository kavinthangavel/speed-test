import React from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart } from 'recharts'; // Removed LineChart
import { SpeedUnit, TestStage, GraphInputData } from '../../utils/types';
import { FiActivity, FiClock, FiDownload, FiUpload } from 'react-icons/fi';

interface SpeedGraphProps {
  graphData: GraphInputData[];
  displayUnit: SpeedUnit;
  testStage: TestStage;
  isTesting: boolean;
  currentSpeedMbps: number | null;
  statusText: string;
  error: string | null;
  compact?: boolean;
  ping: number | null;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
}

const SpeedGraph: React.FC<SpeedGraphProps> = ({ 
  graphData, 
  displayUnit, 
  testStage, 
  isTesting, 
  currentSpeedMbps, 
  statusText, 
  error,
  compact = false,
  ping,
  downloadSpeed,
  uploadSpeed
}) => {
  // Removed unused graphHeight variable
  const showResults = !isTesting || ['download', 'upload', 'done', 'error'].includes(testStage);
  
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden p-4 border border-slate-700/40">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <FiActivity className="text-blue-400 mr-2" />
          <h3 className="text-sm font-semibold text-blue-100">Speed Test Results</h3>
        </div>
        
        {isTesting && currentSpeedMbps !== null && (
          <div className="flex items-center bg-slate-900/60 px-3 py-1 rounded-full">
            <span className="text-xs font-medium text-gray-400 mr-1">Current:</span>
            <span className="text-sm font-bold text-white">{currentSpeedMbps.toFixed(2)}</span>
            <span className="text-xs text-gray-400 ml-1">{displayUnit}</span>
          </div>
        )}
        
        {!error && (
          <div className="text-xs font-medium text-blue-300/80 bg-slate-900/40 px-3 py-1 rounded-full">
            {statusText}
          </div>
        )}
      </div>
      
      {showResults && (
        <div className="grid grid-cols-3 gap-3 mb-4 bg-slate-900/30 p-3 rounded-lg">
          <div className="flex items-center justify-center flex-col">
            <div className="flex items-center mb-1">
              <FiClock className="text-yellow-400 mr-1.5" />
              <span className="text-xs font-medium text-gray-300">Ping</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold text-xl text-white">{ping !== null ? ping : '—'}</span>
              <span className="text-gray-400 ml-1 text-xs">ms</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center flex-col">
            <div className="flex items-center mb-1">
              <FiDownload className="text-green-400 mr-1.5" />
              <span className="text-xs font-medium text-gray-300">Download</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold text-xl text-white">{downloadSpeed !== null ? downloadSpeed.toFixed(2) : '—'}</span>
              <span className="text-gray-400 ml-1 text-xs">{displayUnit}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center flex-col">
            <div className="flex items-center mb-1">
              <FiUpload className="text-purple-400 mr-1.5" />
              <span className="text-xs font-medium text-gray-300">Upload</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold text-xl text-white">{uploadSpeed !== null ? uploadSpeed.toFixed(2) : '—'}</span>
              <span className="text-gray-400 ml-1 text-xs">{displayUnit}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className={`w-full ${compact ? 'h-[160px]' : 'h-[220px]'} mt-1`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={graphData}
            margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4299E1" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#4299E1" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9F7AEA" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#9F7AEA" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" strokeOpacity={0.2} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: '#A0AEC0' }}
              label={{ value: 'Time (seconds)', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#718096' }}
              axisLine={{ stroke: '#4A5568', strokeWidth: 1 }}
              tickLine={{ stroke: '#4A5568' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#A0AEC0' }}
              label={{ value: `Speed (${displayUnit})`, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#718096' }}
              axisLine={{ stroke: '#4A5568', strokeWidth: 1 }}
              tickLine={{ stroke: '#4A5568' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(26, 32, 44, 0.9)', 
                border: '1px solid #2D3748', 
                borderRadius: '0.375rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                padding: '8px 12px'
              }}
              labelStyle={{ color: '#E2E8F0', fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '4px' }}
              formatter={(value: number) => [`${value !== null ? value.toFixed(2) : 'N/A'} ${displayUnit}`, '']}
              labelFormatter={(label) => `Time: ${label} seconds`}
              cursor={{ stroke: '#718096', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.7rem', paddingTop: '5px' }}
              iconType="circle"
              iconSize={8}
            />
            
            <Area 
              type="monotone" 
              dataKey="downloadSpeed" 
              stroke="none"
              fill="url(#colorDownload)"
              activeDot={false}
            />
            <Area 
              type="monotone" 
              dataKey="uploadSpeed" 
              stroke="none"
              fill="url(#colorUpload)"
              activeDot={false}
            />
            
            <Line
              name="Download" 
              type="monotone" 
              dataKey="downloadSpeed" 
              stroke="#4299E1" 
              strokeWidth={2.5}
              dot={{ r: 0 }}
              activeDot={{ r: 6, stroke: '#2B6CB0', strokeWidth: 1, fill: '#4299E1' }}
              animationDuration={500}
            />
            <Line 
              name="Upload" 
              type="monotone" 
              dataKey="uploadSpeed" 
              stroke="#9F7AEA" 
              strokeWidth={2.5}
              dot={{ r: 0 }}
              activeDot={{ r: 6, stroke: '#6B46C1', strokeWidth: 1, fill: '#9F7AEA' }}
              animationDuration={500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpeedGraph;
