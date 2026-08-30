import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WorkoutSession } from '../types';
import { format, parseISO, startOfDay } from 'date-fns';

interface ProgressChartProps {
  sessions: WorkoutSession[];
}

export function ProgressChart({ sessions }: ProgressChartProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  const exercises = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach(s => s.exercises.forEach(ex => names.add(ex.name)));
    return Array.from(names).sort();
  }, [sessions]);

  const chartData = useMemo(() => {
    if (!selectedExercise) return [];

    const dailyMax: Record<number, number> = {};

    sessions.forEach(session => {
      const ex = session.exercises.find(e => e.name === selectedExercise && e.status === 'completed');
      if (ex) {
        const date = startOfDay(parseISO(session.date)).getTime();
        // extract number from weight string (e.g. "15 kg" -> 15)
        const weights = ex.sets.map(s => parseFloat(s.weight.match(/[\d.]+/)?.[0] || '0'));
        const maxW = Math.max(0, ...weights.filter(n => !isNaN(n)));
        
        if (maxW > 0) {
          if (!dailyMax[date] || dailyMax[date] < maxW) {
            dailyMax[date] = maxW;
          }
        }
      }
    });

    return Object.entries(dailyMax)
      .map(([date, maxWeight]) => ({
        date: parseInt(date),
        weight: maxWeight,
        dateStr: format(new Date(parseInt(date)), 'MMM d')
      }))
      .sort((a, b) => a.date - b.date);
  }, [selectedExercise, sessions]);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-300">
        <h3 className="text-lg font-medium text-neutral-50 mb-1">No data available</h3>
        <p className="text-sm text-neutral-400">Log some workouts to see your progress.</p>
      </div>
    );
  }

  if (!selectedExercise && exercises.length > 0) {
    setSelectedExercise(exercises[0]);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-semibold text-neutral-50 mb-1">Progress</h2>
        <p className="text-sm text-neutral-400">Track your max weight over time.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#111111] p-4 rounded-xl border border-neutral-800">
        <label htmlFor="exercise-select" className="text-sm font-medium text-neutral-300 whitespace-nowrap">
          Select Exercise:
        </label>
        <select
          id="exercise-select"
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
        >
          {exercises.length === 0 && <option value="">No exercises logged</option>}
          {exercises.map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      {chartData.length > 1 ? (
        <div className="h-[350px] w-full pt-6 pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
              <XAxis 
                dataKey="dateStr" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 12 }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#171717', 
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)'
                }}
                itemStyle={{ color: '#f5f5f5', fontWeight: 500 }}
                labelStyle={{ color: '#a3a3a3', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                name="Max Weight"
                stroke="#dc2626" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
                activeDot={{ r: 6, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-16 bg-[#111111] rounded-xl border border-neutral-800 border-dashed">
          <p className="text-sm text-neutral-400">Need at least 2 numeric weight sessions of this exercise to show progress.</p>
        </div>
      )}
    </div>
  );
}
