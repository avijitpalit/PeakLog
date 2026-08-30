import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save } from 'lucide-react';
import { WorkoutPlan, WorkoutSession, LoggedExercise, LoggedSet } from '../types';

interface WorkoutFormProps {
  plans: WorkoutPlan[];
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
  onSaveSession: (session: WorkoutSession) => void;
}

export function WorkoutForm({ plans, selectedPlanId, onSelectPlan, onSaveSession }: WorkoutFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);

  useEffect(() => {
    const plan = plans.find(p => p.id === selectedPlanId);
    if (plan) {
      setExercises(plan.exercises.map(ex => ({
        id: uuidv4(),
        planExerciseId: ex.id,
        name: ex.name,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        status: 'completed',
        notes: '',
        // Only 1 set by default, regardless of targetSets
        sets: [{ id: uuidv4(), weight: '', reps: '', notes: '' }]
      })));
    } else {
      setExercises([]);
    }
  }, [selectedPlanId, plans]);

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
      return { ...ex, sets: [...ex.sets, { id: uuidv4(), weight: '', reps: '', notes: '' }] };
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
            className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">-- Select a Plan --</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
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
            className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
      </div>

      {exercises.length > 0 && (
        <div className="space-y-6">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-[#111111] border border-neutral-800 rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-neutral-50 text-lg">{ex.name}</h3>
                  <p className="text-xs text-neutral-400 font-medium">Target: {ex.targetSets} × {ex.targetReps}</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-neutral-400 font-medium cursor-pointer bg-[#0f0f0f] px-3 py-1.5 rounded-md border border-neutral-800 shadow-sm hover:bg-[#111111] transition-colors">
                  <input
                    type="checkbox"
                    checked={ex.status === 'missed'}
                    onChange={(e) => handleExerciseChange(ex.id, 'status', e.target.checked ? 'missed' : 'completed')}
                    className="rounded border-neutral-700 text-neutral-50 focus:ring-red-600 w-4 h-4"
                  />
                  Missed today
                </label>
              </div>

              {ex.status === 'completed' && (
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Exercise Note (e.g. Pushdown, Cable, etc.)"
                      value={ex.notes}
                      onChange={(e) => handleExerciseChange(ex.id, 'notes', e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div className="space-y-2">
                    {ex.sets.map((set, idx) => (
                      <div key={set.id} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-[#0f0f0f] p-2 sm:p-2 rounded-lg border border-neutral-800 shadow-sm">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="w-8 text-xs font-medium text-neutral-500 text-center shrink-0">#{idx + 1}</div>
                          <input
                            type="text"
                            placeholder="Weight"
                            value={set.weight}
                            onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)}
                            className="flex-1 min-w-0 px-3 py-2 sm:py-1.5 rounded-md border border-neutral-800 bg-black text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                          />
                          <input
                            type="text"
                            placeholder="Reps"
                            value={set.reps}
                            onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)}
                            className="w-20 sm:w-24 shrink-0 px-3 py-2 sm:py-1.5 rounded-md border border-neutral-800 bg-black text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(ex.id, set.id)}
                            className="p-2 shrink-0 text-neutral-500 hover:text-red-500 hover:bg-red-950/30 rounded-md transition-colors sm:hidden flex items-center justify-center bg-[#1a1a1a]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:flex-1">
                          <input
                            type="text"
                            placeholder="Notes (e.g. RIR)"
                            value={set.notes}
                            onChange={(e) => updateSet(ex.id, set.id, 'notes', e.target.value)}
                            className="flex-1 min-w-0 px-3 py-2 sm:py-1.5 rounded-md border border-neutral-800 bg-black text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(ex.id, set.id)}
                            className="p-2 shrink-0 text-neutral-500 hover:text-red-500 hover:bg-red-950/30 rounded-md transition-colors hidden sm:flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSet(ex.id)}
                    className="text-xs font-medium text-neutral-50 bg-[#0f0f0f] border border-neutral-800 hover:bg-[#1a1a1a] px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> Add Set
                  </button>
                </div>
              )}
            </div>
          ))}
          
          <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800">
            <label className="text-sm font-medium text-neutral-300 block mb-2">Session Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="How did the overall session feel?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-red-700 text-white font-medium rounded-xl hover:bg-red-600 transition-all shadow-md"
            >
              <Save className="w-5 h-5" /> Save Workout Session
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
