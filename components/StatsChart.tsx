import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlgorithmResult } from '../types';

interface Props {
  results: AlgorithmResult[];
}

const StatsChart: React.FC<Props> = ({ results }) => {
  if (results.length === 0) return null;

  const data = results.map(r => ({
    name: r.algorithmName,
    perfectRate: r.totalWaves > 0 ? (r.perfectWaves / r.totalWaves) * 100 : 0,
    remainder: r.totalRemainder,
    time: r.executionTimeMs
  }));

  return (
    <div className="h-64 w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm mt-4">
        <h4 className="text-sm font-bold text-gray-600 mb-4">算法效果对比</h4>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
            <YAxis yAxisId="left" orientation="left" stroke="#10b981" label={{ value: '完美整箱率 (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#10b981' }}/>
            <YAxis yAxisId="right" orientation="right" stroke="#ef4444" label={{ value: '总余数罚分', angle: 90, position: 'insideRight', fontSize: 10, fill: '#ef4444' }}/>
            <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            />
            <Legend wrapperStyle={{fontSize: '12px'}}/>
            <Bar yAxisId="left" dataKey="perfectRate" name="完美整箱率 (%)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
            <Bar yAxisId="right" dataKey="remainder" name="总拼箱余数" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
