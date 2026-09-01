import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  Info, 
  RotateCcw,
  PlusCircle
} from 'lucide-react';
import { WorkoutPlan, WorkoutSession, LoggedExercise, LoggedSet } from '../types';

interface WorkoutFormProps {
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
  onSaveSession: (session: WorkoutSession) => void;
}

const DRAFT_STORAGE_KEY = 'active_workout_draft';

export function WorkoutForm({ plans, sessions, selectedPlanId, onSelectPlan, onSaveSession }: WorkoutFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const isInitialMount = useRef(true);

  // Restore draft from localStorage on initial load
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.selectedPlanId) {
          if (!selectedPlanId || selectedPlanId === parsed.selectedPlanId) {
            onSelectPlan(parsed.selectedPlanId);
            if (parsed.date) setDate(parsed.date);
            if (parsed.sessionNotes) setSessionNotes(parsed.sessionNotes);
            if (Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
              setExercises(parsed.exercises);
            }
            if (parsed.savedAt) {
              setLastSavedTime(new Date(parsed.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
            setIsDraftRestored(true);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore active workout draft:', e);
    }
  }, []);

  // When selectedPlanId changes manually (and not restoring from draft), initialize exercises from plan
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!selectedPlanId) {
      setExercises([]);
      return;
    }

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
              reps: s.reps,
              rir: s.rir || '',
              notes: s.notes || ''
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
          targetWeight: ex.targetWeight,
          status: 'completed',
          notes: '',
          sets: previousSets.length > 0 ? previousSets : [{ 
            id: uuidv4(), 
            weight: ex.targetWeight || '', 
            reps: '', 
            rir: '', 
            notes: '' 
          }]
        };
      }));
    } else {
      setExercises([]);
    }
  }, [selectedPlanId, plans, sessions]);

  // Real-time Auto-saving: whenever exercises, date, sessionNotes, or planId change, persist immediately!
  useEffect(() => {
    if (!selectedPlanId && exercises.length === 0) return;

    try {
      const now = new Date();
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        selectedPlanId,
        date,
        sessionNotes,
        exercises,
        savedAt: now.toISOString()
      }));
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Failed to auto-save workout draft:', e);
    }
  }, [selectedPlanId, date, sessionNotes, exercises]);

  const handleClearDraft = () => {
    if (window.confirm('Reset current active workout draft? Unsaved changes will be cleared.')) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      onSelectPlan('');
      setSessionNotes('');
      setExercises([]);
      setLastSavedTime(null);
      setIsDraftRestored(false);
    }
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === exercises.length - 1)
    ) {
      return;
    }
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...exercises];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setExercises(updated);
  };

  const handleExerciseChange = (exId: string, field: keyof LoggedExercise, value: any) => {
    setExercises(exercises.map(ex => ex.id === exId ? { ...ex, [field]: value } : ex));
  };

  const handleSetChange = (exId: string, setId: string, field: keyof LoggedSet, value: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) };
    }));
  };

  // Add set at the end
  const handleAddSet = (exId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;
      return { 
        ...ex, 
        sets: [
          ...ex.sets, 
          { 
            id: uuidv4(), 
            weight: lastSet ? lastSet.weight : (ex.targetWeight || ''), 
            reps: '', 
            rir: lastSet?.rir || '', 
            notes: '' 
          }
        ] 
      };
    }));
  };

  // Insert set in between at specific index
  const handleInsertSetBelow = (exId: string, currentIndex: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      const currentSet = ex.sets[currentIndex];
      const newSet: LoggedSet = {
        id: uuidv4(),
        weight: currentSet ? currentSet.weight : (ex.targetWeight || ''),
        reps: '',
        rir: currentSet?.rir || '',
        notes: ''
      };
      const updatedSets = [...ex.sets];
      updatedSets.splice(currentIndex + 1, 0, newSet);
      return { ...ex, sets: updatedSets };
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

    // Save and clear active draft
    onSaveSession(session);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    onSelectPlan('');
    setSessionNotes('');
    setExercises([]);
    setLastSavedTime(null);
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-300">
        <h3 className="text-lg font-medium text-neutral-50 mb-1">No plans available</h3>
        <p className="text-sm text-neutral-400">Go to the Plans tab to create your first workout plan.</p>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-50 mb-1">Log Workout</h2>
          <p className="text-sm text-neutral-400">Select a plan, track your sets, weights, and RIR in real-time.</p>
        </div>

        {/* Auto-save status and draft controls */}
        {selectedPlanId && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {lastSavedTime && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-saved ({lastSavedTime})</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-xs text-neutral-400 hover:text-red-400 px-2 py-1 rounded hover:bg-neutral-800 transition-colors inline-flex items-center gap-1"
              title="Reset draft"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-neutral-300">Select Plan</label>
          <select
            required
            value={selectedPlanId}
            onChange={(e) => onSelectPlan(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-700/60 bg-black/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100"
          >
            <option value="" className="bg-[#111111]">-- Select a Plan --</option>
            {plans.map(p => (
              <option key={p.id} value={p.id} className="bg-[#111111]">
                {p.name} ({p.exercises.length} exercises)
              </option>
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
            className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-700/60 bg-black/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100"
          />
        </div>
      </div>

      {/* Plan Notes Highlight (Yellow/Amber Banner) */}
      {currentPlan?.notes && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3.5 sm:p-4 text-amber-200 flex items-start gap-3 shadow-md animate-in fade-in duration-200">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
              Plan Notes & Instructions
            </span>
            <p className="text-sm text-amber-100/90 whitespace-pre-wrap leading-relaxed">
              {currentPlan.notes}
            </p>
          </div>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          {exercises.map((ex, exIndex) => (
            <div 
              key={ex.id} 
              className="pb-6 border-b border-neutral-800/80 last:border-0 last:pb-0 space-y-4 bg-black/30 p-3.5 sm:p-4 rounded-xl border border-neutral-800/60"
            >
              {/* Exercise Header with Weight tag, Reorder Arrows, and Missed checkbox */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-neutral-100 text-lg">
                      {ex.name}
                    </h3>
                    {ex.targetWeight && (
                      <span className="px-2 py-0.5 bg-red-950/50 border border-red-500/40 text-red-300 font-semibold text-xs rounded-md">
                        {ex.targetWeight}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">
                    Target: {ex.targetSets} sets × {ex.targetReps} reps
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Reorder Exercises inside Logs UI */}
                  <div className="flex items-center gap-0.5 bg-black/60 border border-neutral-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveExercise(exIndex, 'up')}
                      disabled={exIndex === 0}
                      className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-20"
                      title="Move Exercise Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveExercise(exIndex, 'down')}
                      disabled={exIndex === exercises.length - 1}
                      className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-20"
                      title="Move Exercise Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
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

                  {/* Sets List with Insert in-between */}
                  <div className="space-y-2">
                    {/* Header labels */}
                    <div className="flex items-center gap-2 px-1 text-xs font-medium text-neutral-500">
                      <span className="w-6 text-center shrink-0">#</span>
                      <span className="flex-1 min-w-0">Weight</span>
                      <span className="w-16 sm:w-20 shrink-0">Reps</span>
                      <span className="w-14 sm:w-16 shrink-0">RIR</span>
                      <span className="hidden md:block flex-1 min-w-0">Notes</span>
                      <span className="w-16 shrink-0 text-center">Actions</span>
                    </div>

                    {ex.sets.map((set, idx) => (
                      <div key={set.id} className="flex items-center gap-2 group">
                        <div className="w-6 text-xs font-semibold text-neutral-400 text-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            placeholder={ex.targetWeight || "e.g. 80kg"}
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
                            className="w-full px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-600 text-center"
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

                        {/* Actions: Insert below + Delete set */}
                        <div className="w-16 shrink-0 flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleInsertSetBelow(ex.id, idx)}
                            className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-lg transition-colors flex items-center justify-center"
                            title="Insert set below"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(ex.id, set.id)}
                            disabled={ex.sets.length === 1}
                            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors flex items-center justify-center disabled:opacity-20"
                            title="Remove set"
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
                    className="text-xs font-medium text-neutral-300 hover:text-white bg-[#141414] border border-neutral-800 hover:border-neutral-700 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
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
              rows={4}
              placeholder="How did the overall session feel? Log your energy, recovery, PRs, or next week targets..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full px-3.5 py-3 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 resize-y min-h-[100px] text-neutral-100 placeholder:text-neutral-600"
            />
          </div>

          <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-red-700 text-white font-medium rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-950/50 active:scale-95"
            >
              <Save className="w-5 h-5" /> Save Workout Session
            </button>

            {lastSavedTime && (
              <span className="text-xs text-neutral-400 text-center sm:text-right">
                All inputs are automatically saved to local storage
              </span>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
