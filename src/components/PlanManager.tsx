import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, 
  Save, 
  Trash2, 
  Dumbbell, 
  Edit2, 
  X, 
  Wand2, 
  Loader2, 
  ChevronUp, 
  ChevronDown, 
  FileText
} from 'lucide-react';
import { WorkoutPlan, PlanExercise } from '../types';

interface PlanManagerProps {
  plans: WorkoutPlan[];
  onSavePlan: (plan: WorkoutPlan) => void;
  onDeletePlan: (id: string) => void;
  onLogPlan: (id: string) => void;
  onReorderPlans?: (plans: WorkoutPlan[]) => void;
}

type FormExercise = Omit<PlanExercise, 'id'> & { id?: string };

function parseWorkoutTextLocally(text: string): { name: string; targetSets: number; targetReps: string; targetWeight?: string }[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const results: { name: string; targetSets: number; targetReps: string; targetWeight?: string }[] = [];

  for (const rawLine of lines) {
    // Strip leading numbers/bullets like "1.", "1)", "-", "*", "•"
    let line = rawLine.replace(/^(\d+[\.\)]|\-|\*|•)\s*/, '').trim();
    if (!line) continue;

    let name = line;
    let sets = 3;
    let reps = '8-12';
    let weight = '';

    // Check for weight specification like (30kg), 30kg, 60 lbs, @30kg, [30kg]
    const weightMatch = line.match(/(?:@|\b)(\d+(?:\.\d+)?\s*(?:kg|lbs?|pounds?|kilos?))\b/i);
    if (weightMatch) {
      weight = weightMatch[1].trim();
      line = line.replace(weightMatch[0], '').replace(/\(\s*\)/g, '').trim();
    }

    // Pattern 1: Exercise (2 × 8-12) or (3x10) or [3 x 8-12]
    const parenMatch = line.match(/^(.+?)[\s\(\[]+(\d+)\s*(?:[xX×*]|sets?\s*(?:of|x|\*|\×)?)\s*(\d+(?:-\d+)?|\d+\+?)\s*(?:reps?|times)?[\)\]]?$/i);
    // Pattern 2: Exercise: 3x10 or Exercise - 3 x 8-12
    const separatorMatch = line.match(/^(.+?)[\s:\-]+(\d+)\s*(?:[xX×*]|sets?\s*(?:of|x|\*|\×)?)\s*(\d+(?:-\d+)?|\d+\+?)\s*(?:reps?|times)?$/i);

    if (parenMatch) {
      name = parenMatch[1].replace(/[\(\[\:\-]+$/, '').trim();
      sets = parseInt(parenMatch[2], 10) || 3;
      reps = parenMatch[3].trim();
    } else if (separatorMatch) {
      name = separatorMatch[1].replace(/[\(\[\:\-]+$/, '').trim();
      sets = parseInt(separatorMatch[2], 10) || 3;
      reps = separatorMatch[3].trim();
    }

    if (name) {
      results.push({
        name,
        targetSets: sets,
        targetReps: reps,
        targetWeight: weight || undefined
      });
    }
  }
  return results;
}

export function PlanManager({ plans, onSavePlan, onDeletePlan, onLogPlan, onReorderPlans }: PlanManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<FormExercise[]>([
    { name: '', targetSets: 3, targetReps: '8-12', targetWeight: '' }
  ]);
  
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleParseAi = async () => {
    if (!aiText.trim()) return;
    setIsParsing(true);
    let parsedExercises: { name: string; targetSets: number; targetReps: string; targetWeight?: string }[] | null = null;

    try {
      const response = await fetch('/api/parse-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          parsedExercises = data.map((ex: any) => ({
            name: ex.name || 'Unknown',
            targetSets: Number(ex.targetSets) || 3,
            targetReps: ex.targetReps || '8-12',
            targetWeight: ex.targetWeight || ''
          }));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('API parse failed, attempting local fallback parsing:', errorData);
      }
    } catch (err) {
      console.warn('Network error reaching /api/parse-plan, using local fallback parser:', err);
    }

    // If API failed or was unavailable, use smart local parser
    if (!parsedExercises || parsedExercises.length === 0) {
      const localResults = parseWorkoutTextLocally(aiText);
      if (localResults.length > 0) {
        parsedExercises = localResults;
      }
    }

    if (parsedExercises && parsedExercises.length > 0) {
      const isEmpty = exercises.length === 1 && !exercises[0].name.trim();
      setExercises(isEmpty ? parsedExercises : [...exercises, ...parsedExercises]);
      setAiText('');
      setShowAiInput(false);
    } else {
      alert('Could not auto-detect exercises. Please check the text format or add exercises manually.');
    }

    setIsParsing(false);
  };

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', targetSets: 3, targetReps: '8-12', targetWeight: '' }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
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

  const handleExerciseChange = (index: number, field: keyof FormExercise, value: string | number) => {
    const newEx = [...exercises];
    newEx[index] = { ...newEx[index], [field]: value };
    setExercises(newEx);
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    setEditingPlanId(plan.id);
    setName(plan.name);
    setNotes(plan.notes || '');
    setExercises(plan.exercises.map(ex => ({
      name: ex.name,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetWeight: ex.targetWeight || '',
      id: ex.id
    })));
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setName('');
    setNotes('');
    setExercises([{ name: '', targetSets: 3, targetReps: '8-12', targetWeight: '' }]);
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || exercises.some(ex => !ex.name.trim())) return;

    const plan: WorkoutPlan = {
      id: editingPlanId || uuidv4(),
      name: name.trim(),
      notes: notes.trim() || undefined,
      exercises: exercises.map(ex => ({
        id: ex.id || uuidv4(),
        name: ex.name.trim(),
        targetSets: ex.targetSets,
        targetReps: ex.targetReps.trim(),
        targetWeight: ex.targetWeight?.trim() || undefined
      }))
    };

    onSavePlan(plan);
    handleCancelEdit();
  };

  const handleMovePlan = (index: number, direction: 'up' | 'down') => {
    if (!onReorderPlans) return;
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === plans.length - 1)
    ) {
      return;
    }
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...plans];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;
    onReorderPlans(reordered);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-50 mb-1">Workout Plans</h2>
          <p className="text-sm text-neutral-400">Create, customize, and rearrange templates for your workouts.</p>
        </div>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => {
              handleCancelEdit();
              setIsFormOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Plan
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-black/50 p-4 sm:p-5 rounded-xl border border-neutral-700/60 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-neutral-50">
              {editingPlanId ? 'Edit Plan' : 'Create New Plan'}
            </h3>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-sm font-medium text-neutral-400 hover:text-neutral-50 inline-flex items-center gap-1 p-1 rounded-md hover:bg-neutral-800/50 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-300">Plan Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Upper Body Power, Leg Day"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-700/60 bg-black/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-300 flex items-center justify-between">
                <span>Plan Notes / Coaching Instructions <span className="text-neutral-500 font-normal">(Optional)</span></span>
                <span className="text-xs text-amber-400 font-normal">Highlighted when logging</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Warm up 5-10 min, 2-3 min rest on heavy compounds, superset arms at the end."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-700/60 bg-black/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-500 resize-y"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Exercises</label>
              <button
                type="button"
                onClick={() => setShowAiInput(!showAiInput)}
                className="text-xs font-medium text-neutral-400 hover:text-red-400 inline-flex items-center gap-1.5 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" /> 
                {showAiInput ? 'Hide AI Input' : 'Paste text (AI Auto-fill)'}
              </button>
            </div>

            {showAiInput && (
              <div className="bg-[#1a1a1a] p-3 rounded-lg border border-neutral-800 space-y-3 mb-4 animate-in fade-in zoom-in-95 duration-200">
                <textarea
                  placeholder="Paste your workout text here... (e.g. 3 sets of Bench Press 8-12 reps 80kg, 3 sets Incline DB Press 10 reps 28kg, Leg Press (30kg) 3x12)"
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 resize-none text-neutral-200 placeholder:text-neutral-600"
                />
                <button
                  type="button"
                  onClick={handleParseAi}
                  disabled={isParsing || !aiText.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-200 text-sm font-medium rounded-md hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors disabled:opacity-50"
                >
                  {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {isParsing ? 'Parsing with AI...' : 'Auto-fill Exercises'}
                </button>
              </div>
            )}

            <div className="space-y-4">
              {exercises.map((ex, index) => (
                <div key={index} className="py-3 px-3 rounded-xl bg-black/40 border border-neutral-800/80 space-y-2.5">
                  {/* Row 1: Exercise Name and Reorder/Delete Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-neutral-400 mb-1 block font-medium">
                        Exercise {index + 1} Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Flat Barbell Press, Leg Press"
                        value={ex.name}
                        onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-600"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-5">
                      <button
                        type="button"
                        onClick={() => handleMoveExercise(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors disabled:opacity-20"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveExercise(index, 'down')}
                        disabled={index === exercises.length - 1}
                        className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors disabled:opacity-20"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(index)}
                        disabled={exercises.length === 1}
                        className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-colors disabled:opacity-20"
                        title="Delete Exercise"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Sets, Rep Range, Weight Input */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div>
                      <label className="text-xs text-neutral-400 mb-1 block font-medium">Sets</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={ex.targetSets}
                        onChange={(e) => handleExerciseChange(index, 'targetSets', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 mb-1 block font-medium">Rep Range</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 8-12"
                        value={ex.targetReps}
                        onChange={(e) => handleExerciseChange(index, 'targetReps', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 mb-1 block font-medium">
                        Weight <span className="text-neutral-500 font-normal">(Opt)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 30kg"
                        value={ex.targetWeight || ''}
                        onChange={(e) => handleExerciseChange(index, 'targetWeight', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-[#0f0f0f] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-neutral-100 placeholder:text-neutral-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddExercise}
              className="text-sm font-medium text-neutral-50 bg-[#222222]/50 hover:bg-[#222222] px-3.5 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-neutral-800"
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
            <button
              type="button"
              onClick={handleCancelEdit}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-800 text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {plans.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-neutral-50">Your Plans ({plans.length})</h3>
            <span className="text-xs text-neutral-400">Use arrows to reorder plans</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan, planIdx) => (
              <div 
                key={plan.id} 
                className="bg-black/50 border border-neutral-700/60 rounded-xl p-4 shadow-sm flex flex-col justify-between items-start gap-4 hover:border-neutral-600 transition-all group"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="space-y-1 min-w-0 pr-2">
                    <h4 className="font-semibold text-neutral-50 truncate">{plan.name}</h4>
                    <p className="text-xs text-neutral-400">
                      {plan.exercises.length} exercises
                    </p>
                    {plan.notes && (
                      <div className="mt-1 flex items-start gap-1.5 text-xs text-amber-300/90 line-clamp-2">
                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                        <span className="truncate">{plan.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onReorderPlans && (
                      <>
                        <button
                          onClick={() => handleMovePlan(planIdx, 'up')}
                          disabled={planIdx === 0}
                          className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-md hover:bg-neutral-800/60 transition-colors disabled:opacity-20"
                          title="Move Plan Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMovePlan(planIdx, 'down')}
                          disabled={planIdx === plans.length - 1}
                          className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-md hover:bg-neutral-800/60 transition-colors disabled:opacity-20"
                          title="Move Plan Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="text-neutral-400 hover:text-neutral-50 p-1.5 rounded-md hover:bg-neutral-800/60 transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="text-neutral-400 hover:text-red-400 p-1.5 rounded-md hover:bg-red-950/40 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Exercises quick preview */}
                <div className="w-full text-xs text-neutral-400 space-y-1 bg-black/40 p-2.5 rounded-lg border border-neutral-800/60">
                  {plan.exercises.slice(0, 3).map((ex, i) => (
                    <div key={i} className="flex justify-between items-center text-neutral-300">
                      <span className="truncate pr-2">
                        {ex.name} {ex.targetWeight ? <span className="text-red-400 font-medium">({ex.targetWeight})</span> : ''}
                      </span>
                      <span className="text-neutral-500 shrink-0">{ex.targetSets}×{ex.targetReps}</span>
                    </div>
                  ))}
                  {plan.exercises.length > 3 && (
                    <div className="text-neutral-500 pt-0.5 text-[11px]">
                      +{plan.exercises.length - 3} more exercises
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onLogPlan(plan.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-neutral-900/80 hover:bg-neutral-800/90 text-neutral-100 text-sm font-medium rounded-lg transition-colors border border-neutral-800 shadow-sm"
                >
                  <Dumbbell className="w-4 h-4 text-red-400" /> Log this plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
