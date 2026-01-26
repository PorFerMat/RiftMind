import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DataPoint {
  step: number;
  prob: number;
}

interface Props {
  data: DataPoint[];
}

const WinProbabilityChart: React.FC<Props> = ({ data }) => {
  // Fix for "width(-1)" error: Only render Recharts client-side after mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full bg-hex-dark/50 rounded-lg border border-gray-800 p-4">
      <h3 className="text-xs text-gray-400 font-bold uppercase mb-4 pl-1">Live Win Probability (Blue Side)</h3>
      
      {/* Container with explicit inline styles to guarantee dimensions before Recharts loads */}
      <div style={{ width: '100%', height: '200px', minWidth: 0 }}>
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0AC8B9" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0AC8B9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E282D" vertical={false} />
              <XAxis dataKey="step" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#091428', borderColor: '#C8AA6E', color: '#F0F6FC' }}
                itemStyle={{ color: '#0AC8B9' }}
                formatter={(value: number) => [`${value}%`, 'Blue Win %']}
                labelFormatter={(label) => `Draft Step ${label}`}
                animationDuration={300}
              />
              <ReferenceLine y={50} stroke="#444" strokeDasharray="3 3" />
              <Area 
                type="monotone" 
                dataKey="prob" 
                stroke="#0AC8B9" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorProb)" 
                isAnimationActive={true}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          // Skeleton loader while chart waits to mount
          <div className="w-full h-full bg-gray-800/20 animate-pulse rounded" />
        )}
      </div>
    </div>
  );
};

export default WinProbabilityChart;