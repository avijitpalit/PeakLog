import React from 'react';
import { Trash2, Calendar } from 'lucide-react';
import { WorkoutSession } from '../types';
import { format, parseISO } from 'date-fns';

interface WorkoutListProps {
  sessions: WorkoutSession[];
  onDelete: (id: string) => void;
}

export function WorkoutList({ sessions, onDelete }: WorkoutListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-300">
        <h3 className="text-lg font-medium text-neutral-50 mb-1">No sessions yet</h3>
        <p className="text-sm text-neutral-400">Your logged workouts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-semibold text-neutral-50 mb-1">Workout History</h2>
        <p className="text-sm text-neutral-400">Manage your past sessions.</p>
      </div>

      <div className="space-y-4">
        {sessions.map(session => (
          <div key={session.id} className="bg-[#0f0f0f] border border-neutral-800 rounded-xl p-4 sm:p-5 shadow-sm hover:border-neutral-700 transition-colors group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#1a1a1a] p-3 rounded-lg text-neutral-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-50">{format(parseISO(session.date), 'MMM d, yyyy')}</h3>
                <p className="text-sm text-neutral-400 mt-0.5">{session.planName} • {session.exercises.length} exercises</p>
              </div>
            </div>
            
            <button
              onClick={() => onDelete(session.id)}
              className="text-neutral-500 hover:text-red-500 hover:bg-red-950/30 p-2 rounded-md transition-colors"
              aria-label="Delete session"
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">Delete</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
