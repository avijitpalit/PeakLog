import React, { useMemo } from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { WorkoutSession } from '../types';
import { format, parseISO } from 'date-fns';

interface PersonalRecordsProps {
  sessions: WorkoutSession[];
}

export function PersonalRecords({ sessions }: PersonalRecordsProps) {
  const records = useMemo(() => {
    const prs: Record<string, { weight: number; label: string; date: string }> = {};

    sessions.forEach(session => {
      session.exercises.forEach(ex => {
        if (ex.status === 'completed') {
          // Extract max weight and keep the original string label for display
          let maxNum = 0;
          let bestLabel = '';
          
          ex.sets.forEach(s => {
            const num = parseFloat(s.weight.match(/[\d.]+/)?.[0] || '0');
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
              bestLabel = s.weight;
            }
          });

          if (maxNum > 0) {
            if (!prs[ex.name] || maxNum > prs[ex.name].weight) {
              prs[ex.name] = { weight: maxNum, label: bestLabel, date: session.date };
            }
          }
        }
      });
    });

    return Object.entries(prs)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions]);

  if (records.length === 0) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-300">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1a1a1a] text-neutral-500 mb-4">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-medium text-neutral-50 mb-1">No records yet</h3>
        <p className="text-sm text-neutral-400">Keep logging to hit your first personal record!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-semibold text-neutral-50 mb-1">Personal Records</h2>
        <p className="text-sm text-neutral-400">Your all-time best performances based on weight extracted from logs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record, index) => (
          <div 
            key={record.name}
            className="relative bg-[#0f0f0f] border border-neutral-800 rounded-xl p-5 shadow-sm hover:border-neutral-700 transition-all group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
            
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-neutral-100 pr-4">{record.name}</h3>
              <div className="text-amber-400 bg-amber-950/40 p-1.5 rounded-lg shadow-sm border border-amber-500/20 shrink-0">
                {index === 0 ? <Crown className="w-4 h-4" /> : <Medal className="w-4 h-4" />}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold text-neutral-50 tracking-tight">
                {record.label}
              </div>
              <div className="text-xs text-neutral-400 font-medium">
                Achieved on {format(parseISO(record.date), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
