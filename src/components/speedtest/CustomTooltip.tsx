import React from 'react';
import { SpeedUnit, GraphInputData } from '../../utils/types';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: GraphInputData;
    value: number | null;
    dataKey: string;
    name: string;
  }>;
  label?: number;
  unit: SpeedUnit;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length && typeof label === 'number') {
    const point = payload[0];
    if (!point || point.value === null) return null;

    const speedValue = point.value;
    const stage = point.name;

    return (
      <div className="bg-gray-700/80 backdrop-blur-sm text-white p-2 rounded shadow-lg text-xs border border-gray-600">
        <p className="font-semibold mb-1">{`Time: ${label.toFixed(1)}s`}</p>
        <p className={`text-${point.dataKey === 'downloadSpeed' ? 'blue' : 'green'}-300`}>
          {`${stage}: ${speedValue.toFixed(1)} ${unit}`}
        </p>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
