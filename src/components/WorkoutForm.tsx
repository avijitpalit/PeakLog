import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save } from 'lucide-react';
import { WorkoutPlan, WorkoutSession, LoggedExercise, LoggedSet } from '../types';

interface WorkoutFormProps {
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
  onSaveSession: (session: WorkoutSession) => void;
}

export function WorkoutForm({ plans, sessions, selectedPlanId, onSelectPlan, onSaveSession }: WorkoutFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);

  useEffect(() => {
    const plan = plans.find(p => p.id === selectedPlanId);
    if (plan) {
      setExercises(plan.exercises.map(ex => {
        // Try to find the most recent session where this exercise was logged
        const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        let previousSets: LoggedSet[] = [];
        for (const session of sortedSessions) {
          const prevEx = session.exercises.find(e => e.planExerciseId === ex.id && e.status === 'completed');
          if (prevEx && prevEx.sets.length > 0) {
            previousSets = prevEx.sets.map(s => ({
              id: uuidv4(),
              weight: s.weight,
              reps: s.reps, // Keep previous reps too, or clear if prefer empty
              rir: s.rir || '',
              notes: s.notes
            }));
            break;
          }
        }
        
        return {
          id: uuidv4(),
          planExerciseId: ex.id,
          name: ex.name,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          status: 'completed',
          notes: '',
          sets: previousSets.length > 0 ? previousSets : [{ id: uuidv4(), weight: '', reps: '', rir: '', notes: '' }]
        };
      }));
    } else {
      setExercises([]);
    }
  }, [selectedPlanId, plans, sessions]);

  const handleExerciseChange = (exId: string, field: keyof LoggedExercise, value: any) => {
    setExercises(exercises.map(ex => ex.id === exId ? { ...ex, [field]: value } : ex));
  };

  const handleSetChange = (exId: string, setId: string, field: keyof LoggedSet, value: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) };
    }));
  };

  const handleAddSet = (exId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      // Copy last set's weight and rir if exists
      const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;
      return { 
        ...ex, 
        sets: [
          ...ex.sets, 
          { 
            id: uuidv4(), 
            weight: lastSet ? lastSet.weight : '', 
            reps: '', 
            rir: lastSet?.rir || '', 
            notes: '' 
          }
        ] 
      };
    }));
  };

  const handleRemoveSet = (exId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    const session: WorkoutSession = {
      id: uuidv4(),
      date,
      planId: plan.id,
      planName: plan.name,
      notes: sessionNotes.trim(),
      exercises
    };

    onSaveSession(session);
    onSelectPlan('');
    setSessionNotes('');
    setExercises([]);
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-300">
        <h3 className="text-lg font-medium text-neutral-50 mb-1">No plans available</h3>
        <p className="text-sm text-neutral-400">Go to the Plans tab to create your first workout plan.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-semibold text-neutral-50 mb-1">Log Workout</h2>
        <p className="text-sm text-neutral-400">Select a plan and log your sets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-neutral-300">Plan</label>
          <select
            required
            value={selectedPlanId}
            onChange={(e) => onSelectPlan(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-800 bg-transparent text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="" className="bg-[#111111]">-- Select a Plan --</option>
            {plans.map(p => (
              <option key={p.id} value={p.id} className="bg-[#111111]">{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-300">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-800 bg-transparent text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
      </div>

      {exercises.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          {exercises.map((ex) => (
            <div key={ex.id} className="pb-6 border-b border-neutral-800/80 last:border-0 last:pb-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-neutral-100 text-lg">{ex.name}</h3>
                  <p className="text-xs text-neutral-400 font-medium">Target: {ex.targetSets} × {ex.targetReps}</p>
                </div>
                <label className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 hover:text-neutral-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ex.status === 'missed'}
                    onChange={(e) => handleExerciseChange(ex.id, 'status', e.target.checked ? 'missed' : 'completed')}
                    className="rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-600 w-4 h-4 cursor-pointer"
                  />
                  <span>Missed today</span>
                </label>
              </div>

              {ex.status === 'completed' && (
                <div className="space-y-3.5">
                  <input
                    type="text"
                    placeholder="Exercise Note (e.g. Incline Bench, Cable attachment, tempo)"
                    value={ex.notes}
                    onChange={(e) => handleExerciseChange(ex.id, 'notes', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-600"
                  />

                  {/* Sets List - Flat streamlined rows */}
                  <div className="space-y-2">
                    {/* Header labels */}
                    <div className="flex items-center gap-2 px-1 text-xs font-medium text-neutral-500">
                      <span className="w-6 text-center shrink-0">#</span>
                      <span className="flex-1 min-w-0">Weight</span>
                      <span className="w-16 sm:w-20 shrink-0">Reps</span>
                      <span className="w-14 sm:w-16 shrink-0">RIR</span>
                      <span className="hidden md:block flex-1 min-w-0">Notes</span>
                      <span className="w-8 shrink-0"></span>
                    </div>

                    {ex.sets.map((set, idx) => (
                      <div key={set.id} className="flex items-center gap-2">
                        <div className="w-6 text-xs font-semibold text-neutral-400 text-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            placeholder="e.g. 80kg"
                            value={set.weight}
                            onChange={(e) => handleSetChange(ex.id, set.id, 'weight', e.target.value)}
                            className="w-full px-3 py-2 sm:py-1.5 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-600"
                          />
                        </div>
                        <div className="w-16 sm:w-20 shrink-0">
                          <input
                            type="text"
                            placeholder="10"
                            value={set.reps}
                            onChange={(e) => handleSetChange(ex.id, set.id, 'reps', e.target.value)}
                            className="w-full px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-600"
                          />
                        </div>
                        <div className="w-14 sm:w-16 shrink-0">
                          <input
                            type="text"
                            placeholder="2"
                            value={set.rir ?? ''}
                            onChange={(e) => handleSetChange(ex.id, set.id, 'rir', e.target.value)}
                            className="w-full px-2 sm:px-2.5 py-2 sm:py-1.5 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-600 text-center"
                            title="Reps In Reserve (RIR)"
                          />
                        </div>
                        <div className="hidden md:block flex-1 min-w-0">
                          <input
                            type="text"
                            placeholder="Notes"
                            value={set.notes}
                            onChange={(e) => handleSetChange(ex.id, set.id, 'notes', e.target.value)}
                            className="w-full px-3 py-2 sm:py-1.5 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(ex.id, set.id)}
                          className="p-2 sm:p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors flex items-center justify-center shrink-0 w-8 h-8"
                          title="Remove set"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSet(ex.id)}
                    className="text-xs font-medium text-neutral-300 hover:text-white bg-[#141414] border border-neutral-800 hover:border-neutral-700 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Set
                  </button>
                </div>
              )}
            </div>
          ))}
          
          <div className="pt-2 space-y-2">
            <label className="text-sm font-medium text-neutral-300 block">Session Notes (Optional)</label>
            <textarea
              rows={5}
              placeholder="How did the overall session feel? Log your energy, recovery, PRs, or next week targets..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full px-3.5 py-3 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 resize-y min-h-[120px] text-neutral-100 placeholder:text-neutral-600"
            />
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-red-700 text-white font-medium rounded-xl hover:bg-red-600 transition-all shadow-md active:scale-95"
            >
              <Save className="w-5 h-5" /> Save Workout Session
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
