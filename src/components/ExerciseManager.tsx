import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  Dumbbell, 
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { ExerciseItem, WorkoutPlan, WorkoutSession } from '../types';

interface ExerciseManagerProps {
  exercises: ExerciseItem[];
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
  onSaveExercises: (exercises: ExerciseItem[]) => void;
}

export function ExerciseManager({ exercises, plans, sessions, onSaveExercises }: ExerciseManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newIsOverload, setNewIsOverload] = useState(false);

  // Derive plans and last logged weights for each exercise
  const exerciseMeta = useMemo(() => {
    const metaMap = new Map<string, { plans: string[]; lastWeight?: string; targetSetsReps?: string }>();

    // Scan plans
    plans.forEach(plan => {
      plan.exercises.forEach(ex => {
        const norm = ex.name.trim().toLowerCase();
        const existing = metaMap.get(norm) || { plans: [] };
        if (!existing.plans.includes(plan.name)) {
          existing.plans.push(plan.name);
        }
        if (ex.targetSets && ex.targetReps && !existing.targetSetsReps) {
          existing.targetSetsReps = `${ex.targetSets} × ${ex.targetReps}`;
        }
        metaMap.set(norm, existing);
      });
    });

    // Scan recent sessions for last logged weight
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const session of sortedSessions) {
      if (!session.exercises) continue;
      for (const ex of session.exercises) {
        if (!ex.name || ex.status === 'missed') continue;
        const norm = ex.name.trim().toLowerCase();
        const existing = metaMap.get(norm) || { plans: [] };
        if (!existing.lastWeight && ex.sets && ex.sets.length > 0) {
          const usedSet = ex.sets.find(s => s.weight && s.weight.trim());
          if (usedSet) {
            existing.lastWeight = usedSet.weight.trim();
          }
        }
        metaMap.set(norm, existing);
      }
    }

    return metaMap;
  }, [plans, sessions]);

  // Handle updating an exercise field
  const handleUpdate = (id: string, updates: Partial<ExerciseItem>) => {
    const updated = exercises.map(ex => ex.id === id ? { ...ex, ...updates } : ex);
    onSaveExercises(updated);
  };

  // Toggle Overload checkbox
  const handleToggleOverload = (id: string, isOverload: boolean) => {
    handleUpdate(id, { isOverload });
  };

  // Quick weight increment (e.g. +2.5kg or +5 lbs)
  const handleBumpWeight = (id: string, currentWeight: string, increment: number) => {
    const cleanStr = (currentWeight || '').trim();
    const match = cleanStr.match(/^(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?|kilos?)?$/i);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2] || 'kg';
      const newNum = Math.max(0, num + increment);
      const formatted = Number.isInteger(newNum) ? newNum.toString() : newNum.toFixed(1);
      handleUpdate(id, { currentWeight: `${formatted}${unit}` });
    } else {
      handleUpdate(id, { currentWeight: `${increment}kg` });
    }
  };

  // Delete exercise
  const handleDelete = (id: string) => {
    onSaveExercises(exercises.filter(ex => ex.id !== id));
  };

  // Add new exercise
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: ExerciseItem = {
      id: uuidv4(),
      name: newName.trim(),
      currentWeight: newWeight.trim(),
      isOverload: newIsOverload
    };

    onSaveExercises([newItem, ...exercises]);
    setNewName('');
    setNewWeight('');
    setNewIsOverload(false);
    setIsAddingExercise(false);
  };

  // Auto-import / sync missing exercises from plans
  const handleSyncPlans = () => {
    const existingNorms = new Set(exercises.map(e => e.name.trim().toLowerCase()));
    const toAdd: ExerciseItem[] = [];

    plans.forEach(plan => {
      plan.exercises.forEach(ex => {
        const norm = ex.name.trim().toLowerCase();
        if (!existingNorms.has(norm)) {
          existingNorms.add(norm);
          toAdd.push({
            id: uuidv4(),
            name: ex.name.trim(),
            currentWeight: ex.targetWeight || '',
            isOverload: false,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps
          });
        }
      });
    });

    if (toAdd.length > 0) {
      onSaveExercises([...exercises, ...toAdd]);
    }
  };

  // Filtered exercises
  const filteredExercises = exercises.filter(ex => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const meta = exerciseMeta.get(ex.name.trim().toLowerCase());
    const plansMatch = meta?.plans.some(p => p.toLowerCase().includes(q));
    return ex.name.toLowerCase().includes(q) || (ex.currentWeight && ex.currentWeight.toLowerCase().includes(q)) || plansMatch;
  });

  const overloadCount = exercises.filter(e => e.isOverload).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-neutral-50">Exercises</h2>
            {overloadCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                {overloadCount} ready to overload
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-400 mt-0.5">
            Manage current working weights and mark exercises for progressive overload.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSyncPlans}
            title="Import all missing exercises from your workout plans"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sync Plans
          </button>
          <button
            type="button"
            onClick={() => setIsAddingExercise(!isAddingExercise)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-700 hover:bg-red-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>
      </div>

      {/* Add Exercise Inline Form */}
      {isAddingExercise && (
        <form onSubmit={handleCreate} className="bg-black/60 border border-neutral-800 rounded-xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200">New Exercise</h3>
            <button
              type="button"
              onClick={() => setIsAddingExercise(false)}
              className="text-xs text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-neutral-400 mb-1 block font-medium">Exercise Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Incline Dumbbell Press"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 mb-1 block font-medium">Current Weight</label>
              <input
                type="text"
                placeholder="e.g. 32kg, 70 lbs"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={newIsOverload}
                onChange={(e) => setNewIsOverload(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 text-emerald-600 focus:ring-emerald-500 bg-neutral-900 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 font-medium">
                Mark for Overload
                {newIsOverload && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
              </span>
            </label>

            <button
              type="submit"
              className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Save Exercise
            </button>
          </div>
        </form>
      )}

      {/* Search Filter */}
      {exercises.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search exercises by name, weight, or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-800/80 bg-black/40 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
      )}

      {/* Exercises List / Cards */}
      {exercises.length === 0 ? (
        <div className="text-center py-12 bg-black/30 border border-neutral-800/60 rounded-2xl p-6">
          <Dumbbell className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-200 mb-1">No exercises found</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto mb-4">
            You can sync exercises directly from your plans or create exercises to track current working weights and overload targets.
          </p>
          <div className="flex items-center justify-center gap-3">
            {plans.length > 0 && (
              <button
                type="button"
                onClick={handleSyncPlans}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Import from Plans ({plans.reduce((acc, p) => acc + p.exercises.length, 0)})
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAddingExercise(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Exercise
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExercises.map(ex => {
            const meta = exerciseMeta.get(ex.name.trim().toLowerCase());
            return (
              <div 
                key={ex.id}
                className={`bg-black/50 border rounded-xl p-3.5 sm:p-4 transition-all min-w-0 w-full overflow-hidden ${
                  ex.isOverload 
                    ? 'border-emerald-500/40 shadow-[0_0_15px_-4px_rgba(16,185,129,0.15)] bg-gradient-to-r from-emerald-950/10 via-black/50 to-black/50' 
                    : 'border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                  {/* Left: Exercise Name & Plan Badges */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-neutral-100 text-base sm:text-lg truncate">
                        {ex.name}
                      </h3>
                      {ex.isOverload && (
                        <span 
                          title="Overload is checked: Ready to increase weight!"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-semibold"
                        >
                          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                          <span>Overload</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata: Plans and targets */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-400">
                      {meta?.plans && meta.plans.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Layers className="w-3 h-3 text-neutral-500 shrink-0" />
                          <span className="text-neutral-500">In:</span>
                          {meta.plans.map(p => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px]">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                      {meta?.targetSetsReps && (
                        <span className="text-neutral-500">• Target: {meta.targetSetsReps}</span>
                      )}
                      {meta?.lastWeight && (
                        <span className="text-neutral-500">• Last logged: <span className="text-neutral-300 font-medium">{meta.lastWeight}</span></span>
                      )}
                    </div>
                  </div>

                  {/* Right: Current Weight & Overload Checkbox */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap justify-between sm:justify-end border-t sm:border-t-0 border-neutral-800/80 pt-2.5 sm:pt-0">
                    {/* Current Weight Input & Quick Bumps */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">Current Weight:</span>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder="e.g. 80kg"
                          value={ex.currentWeight || ''}
                          onChange={(e) => handleUpdate(ex.id, { currentWeight: e.target.value })}
                          className="w-24 sm:w-28 px-2.5 py-1.5 rounded-lg border border-neutral-700/80 bg-[#121212] text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium text-center"
                        />
                      </div>

                      {/* Quick +2.5 bump helper */}
                      <button
                        type="button"
                        onClick={() => handleBumpWeight(ex.id, ex.currentWeight, 2.5)}
                        title="Add +2.5 to current weight"
                        className="px-1.5 py-1 text-[11px] font-semibold text-neutral-400 hover:text-emerald-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors"
                      >
                        +2.5
                      </button>
                    </div>

                    {/* Overload Checkbox */}
                    <label 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all cursor-pointer select-none ${
                        ex.isOverload 
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm' 
                          : 'bg-[#141414] border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={ex.isOverload}
                        onChange={(e) => handleToggleOverload(ex.id, e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-700 text-emerald-600 focus:ring-emerald-500 bg-neutral-900 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        Overload
                        {ex.isOverload && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                      </span>
                    </label>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(ex.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
                      title="Remove exercise"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
