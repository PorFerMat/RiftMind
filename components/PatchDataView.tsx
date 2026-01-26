import React, { useEffect, useState } from 'react';
import { PatchStats } from '../types';
import { getPatchData } from '../services/gridService';
import { getChampionAssets } from '../constants';

const PatchDataView: React.FC = () => {
  const [stats, setStats] = useState<PatchStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getPatchData("14.2");
      setStats(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'S': return 'text-hex-gold';
      case 'A': return 'text-hex-blue';
      case 'D': return 'text-red-500';
      default: return 'text-white';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center text-hex-blue animate-pulse">
        Loading Patch 14.2 Data from GRID...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-xl">
      <div className="p-4 border-b border-gray-800 bg-hex-dark/50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Patch 14.2 Metadata</h2>
        <span className="text-xs text-gray-500 font-mono">Source: GRID API</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800 text-xs uppercase font-bold text-gray-300">
            <tr>
              <th className="px-6 py-3">Rank</th>
              <th className="px-6 py-3">Champion</th>
              <th className="px-6 py-3 text-center">Tier</th>
              <th className="px-6 py-3 text-right">Win Rate</th>
              <th className="px-6 py-3 text-right">Pick Rate</th>
              <th className="px-6 py-3 text-right">Ban Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {stats.map((stat, idx) => {
              const assets = getChampionAssets(stat.championName.replace(/\s+/g, '').replace(/'/g, '')); // Simple ID normalization
              return (
                <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3 font-mono text-gray-500">#{idx + 1}</td>
                  <td className="px-6 py-3 flex items-center gap-3">
                    <img src={assets.square} alt={stat.championName} className="w-8 h-8 rounded border border-gray-700" />
                    <span className="text-white font-bold">{stat.championName}</span>
                    <span className="text-[10px] bg-gray-800 px-1.5 rounded">{stat.role}</span>
                  </td>
                  <td className={`px-6 py-3 text-center font-bold ${getTierColor(stat.tier)}`}>{stat.tier}</td>
                  <td className="px-6 py-3 text-right text-white">{stat.winRate.toFixed(1)}%</td>
                  <td className="px-6 py-3 text-right">{stat.pickRate.toFixed(1)}%</td>
                  <td className="px-6 py-3 text-right">{stat.banRate.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatchDataView;
