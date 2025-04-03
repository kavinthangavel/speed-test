import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  TooltipItem,
  Scale,
  CoreScaleOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ResultsDisplayProps {
  testStage?: string;
  isTesting?: boolean;
  ping?: number;
  downloadSpeed: string;
  uploadSpeed: string;
  displayUnit: string;
  onRestartTest?: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  ping = 15,
  downloadSpeed = '65',
  uploadSpeed = '40',
  displayUnit,
  onRestartTest
}) => {
  // Dummy data for the chart
  const labels = Array.from({ length: 10 }, (_, i) => i.toString());
  const dummyDownloadData = [10, 15, 25, 30, 45, 40, 50, 55, 60, 65];
  const dummyUploadData = [5, 8, 12, 15, 20, 25, 28, 30, 35, 40];

  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: `Download Speed`,
        data: dummyDownloadData,
        borderColor: 'rgb(56, 189, 248)', // tailwind blue-400
        backgroundColor: 'rgba(56, 189, 248, 0.5)',
        tension: 0.4,
        fill: true,
      },
      {
        label: `Upload Speed`,
        data: dummyUploadData,
        borderColor: 'rgb(251, 113, 133)', // tailwind rose-400
        backgroundColor: 'rgba(251, 113, 133, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          color: 'rgb(209 213 219)',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif',
        },
        bodyFont: {
          size: 12,
          family: 'Inter, system-ui, sans-serif',
        },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context: TooltipItem<'line'>) => 
            ` ${context.dataset.label}: ${context.parsed.y} ${displayUnit}`,
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        grid: {
          color: 'rgba(209, 213, 219, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(209 213 219)',
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 8,
          callback: function(this: Scale<CoreScaleOptions>, tickValue: number | string): string {
            return `${tickValue} ${displayUnit}`;
          },
        },
        border: {
          dash: [4, 4],
        },
      },
      x: {
        type: 'category' as const,
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(209 213 219)',
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 8,
        },
        border: {
          dash: [4, 4],
        },
      },
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5,
      },
      line: {
        borderWidth: 2,
      },
    },
  };

  return (
    <div className="w-full space-y-4">
      {/* Results Card */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="grid grid-cols-3 gap-6">
          {/* Ping */}
          <div className="text-center">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Ping</h3>
            <p className="text-2xl sm:text-3xl font-bold text-white group">
              {ping}
              <span className="text-sm text-gray-400 ml-1 opacity-75 group-hover:opacity-100 transition-opacity">ms</span>
            </p>
          </div>
          
          {/* Download */}
          <div className="text-center">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Download</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-400 group">
              {downloadSpeed}
              <span className="text-sm text-gray-400 ml-1 opacity-75 group-hover:opacity-100 transition-opacity">{displayUnit}</span>
            </p>
          </div>
          
          {/* Upload */}
          <div className="text-center">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Upload</h3>
            <p className="text-2xl sm:text-3xl font-bold text-rose-400 group">
              {uploadSpeed}
              <span className="text-sm text-gray-400 ml-1 opacity-75 group-hover:opacity-100 transition-opacity">{displayUnit}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Speed Graph */}
      <div className="relative bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="absolute top-6 left-6">
          <h3 className="text-sm font-medium text-gray-300">Speed Over Time</h3>
          <p className="text-xs text-gray-400 mt-1">Measuring network performance</p>
        </div>
        <div className="h-[350px] mt-16">
          <Line data={chartData} options={options} />
        </div>
      </div>

      {/* Restart Button */}
      <div className="flex justify-center">
        <button
          onClick={onRestartTest}
          className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg
                   transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 
                   focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg shadow-indigo-500/20"
        >
          Restart Test
        </button>
      </div>
    </div>
  );
};

export default ResultsDisplay;