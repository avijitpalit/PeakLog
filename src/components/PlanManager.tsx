import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Save, Trash2, Dumbbell, Edit2, X } from 'lucide-react';
import { WorkoutPlan, PlanExercise } from '../types';

interface PlanManagerProps {
  plans: WorkoutPlan[];
  onSavePlan: (plan: WorkoutPlan) => void;
  onDeletePlan: (id: string) => void;
  onLogPlan: (id: string) => void;
}

type FormExercise = Omit<PlanExercise, 'id'> & { id?: string };

export function PlanManager({ plans, onSavePlan, onDeletePlan, onLogPlan }: PlanManagerProps) {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<FormExercise[]>([
    { name: '', targetSets: 3, targetReps: '8-12' }
  ]);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', targetSets: 3, targetReps: '8-12' }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: keyof FormExercise, value: string | number) => {
    const newEx = [...exercises];
    newEx[index] = { ...newEx[index], [field]: value };
    setExercises(newEx);
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    setEditingPlanId(plan.id);
    setName(plan.name);
    setExercises(plan.exercises);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setName('');
    setExercises([{ name: '', targetSets: 3, targetReps: '8-12' }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || exercises.some(ex => !ex.name.trim())) return;

    const plan: WorkoutPlan = {
      id: editingPlanId || uuidv4(),
      name: name.trim(),
      exercises: exercises.map(ex => ({ ...ex, id: ex.id || uuidv4() }))
    };

    onSavePlan(plan);
    handleCancelEdit();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-semibold text-neutral-50 mb-1">Workout Plans</h2>
        <p className="text-sm text-neutral-400">Create templates to use when logging workouts.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-neutral-50">
            {editingPlanId ? 'Edit Plan' : 'Create New Plan'}
          </h3>
          {editingPlanId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-sm font-medium text-neutral-400 hover:text-neutral-50 inline-flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-300">Plan Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Push Day"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-300">Exercises</label>
          {exercises.map((ex, index) => (
            <div key={index} className="flex flex-wrap sm:flex-nowrap gap-3 items-end bg-[#0f0f0f] p-3 rounded-lg border border-neutral-800 shadow-sm">
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-neutral-400 mb-1 block">Exercise Name</label>
                <input
                  type="text"
                  required
                  placeholder="Flat Barbell Press"
                  value={ex.name}
                  onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-800 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div className="w-20">
                <label className="text-xs text-neutral-400 mb-1 block">Sets</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={ex.targetSets}
                  onChange={(e) => handleExerciseChange(index, 'targetSets', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-800 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div className="w-28">
                <label className="text-xs text-neutral-400 mb-1 block">Reps (Range)</label>
                <input
                  type="text"
                  required
                  placeholder="6-10"
                  value={ex.targetReps}
                  onChange={(e) => handleExerciseChange(index, 'targetReps', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-800 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveExercise(index)}
                disabled={exercises.length === 1}
                className="p-2 mb-0.5 text-neutral-500 hover:text-red-500 hover:bg-red-950/30 rounded-md transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddExercise}
            className="text-sm font-medium text-neutral-50 bg-[#222222]/50 hover:bg-[#222222] px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
          >
            <Save className="w-4 h-4" /> {editingPlanId ? 'Update Plan' : 'Save Plan'}
          </button>
        </div>
      </form>

      {plans.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-neutral-50">Your Plans</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map(plan => (
              <div key={plan.id} className="bg-[#0f0f0f] border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col justify-between items-start gap-4">
                <div className="flex justify-between items-start w-full">
                  <div>
                    <h4 className="font-semibold text-neutral-50">{plan.name}</h4>
                    <p className="text-xs text-neutral-400 mt-1">{plan.exercises.length} exercises</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="text-neutral-500 hover:text-neutral-50 p-1.5 rounded-md hover:bg-[#1a1a1a] transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="text-neutral-500 hover:text-red-500 p-1.5 rounded-md hover:bg-red-950/30 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => onLogPlan(plan.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#1a1a1a] hover:bg-[#222222] text-neutral-50 text-sm font-medium rounded-lg transition-colors"
                >
                  <Dumbbell className="w-4 h-4" /> Log this plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
