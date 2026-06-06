'use client';

import type { PieSegment } from '@/types';

export default function PieChart({ 
  segments, 
  size = 200, 
  donut = true 
}: { 
  segments: PieSegment[];
  size?: number;
  donut?: boolean;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm font-medium" style={{ width: size, height: size }}>
        No Data
      </div>
    );
  }

  let cumulativePercent = 0;
  const radius = size / 2;
  const cx = size / 2;
  const cy = size / 2;

  const getCoordinatesForPercent = (percent: number) => {
    const x = cx + radius * Math.cos(2 * Math.PI * percent);
    const y = cy + radius * Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {segments.map((segment, i) => {
          if (segment.value === 0) return null;
          
          const percent = segment.value / total;
          
          if (percent === 1) {
            return <circle key={i} cx={cx} cy={cy} r={radius} fill={segment.color} />;
          }

          const start = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += percent;
          const end = getCoordinatesForPercent(cumulativePercent);

          const largeArcFlag = percent > 0.5 ? 1 : 0;

          const pathData = [
            `M ${start[0]} ${start[1]}`, // Move
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end[0]} ${end[1]}`, // Arc
            `L ${cx} ${cy}`, // Line
          ].join(' ');

          return <path key={i} d={pathData} fill={segment.color} className="transition-all duration-300 hover:opacity-80" />;
        })}
        {donut && <circle cx={cx} cy={cy} r={radius * 0.6} fill="white" />}
      </svg>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></span>
            {segment.label} ({Math.round((segment.value / total) * 100)}%)
          </div>
        ))}
      </div>
    </div>
  );
}
