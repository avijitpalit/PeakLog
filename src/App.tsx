import React, { useState, useEffect } from 'react';
import { Dumbbell, LineChart, Trophy, History, ClipboardList, BookOpen, Layers } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { WorkoutPlan, WorkoutSession, ExerciseItem } from './types';
import { PlanManager } from './components/PlanManager';
import { ExerciseManager } from './components/ExerciseManager';
import { WorkoutForm } from './components/WorkoutForm';
import { Assessment } from './components/Assessment';
import { WorkoutList } from './components/WorkoutList';
import { ProgressChart } from './components/ProgressChart';
import { PersonalRecords } from './components/PersonalRecords';
import bgImage from './assets/images/aesthetic_physique_red_black_1788073512734.jpg';

type Tab = 'plans' | 'exercises' | 'log' | 'assessment' | 'history' | 'progress' | 'records';

export default function App() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exerciseItems, setExerciseItems] = useState<ExerciseItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('plans');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedPlans = localStorage.getItem('workout_plans');
    const savedSessions = localStorage.getItem('workout_sessions');
    const savedExercises = localStorage.getItem('workout_exercises');
    if (savedPlans) setPlans(JSON.parse(savedPlans));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (savedExercises) setExerciseItems(JSON.parse(savedExercises));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('workout_plans', JSON.stringify(plans));
      localStorage.setItem('workout_sessions', JSON.stringify(sessions));
      localStorage.setItem('workout_exercises', JSON.stringify(exerciseItems));
    }
  }, [plans, sessions, exerciseItems, isLoaded]);

  // Sync exercises from plans so user has all plan exercises automatically available
  useEffect(() => {
    if (!isLoaded || plans.length === 0) return;
    setExerciseItems(prev => {
      const existingNorms = new Set(prev.map(e => e.name.trim().toLowerCase()));
      const toAdd: ExerciseItem[] = [];
      plans.forEach(plan => {
        plan.exercises.forEach(ex => {
          const norm = ex.name.trim().toLowerCase();
          if (!existingNorms.has(norm)) {
            existingNorms.add(norm);
            toAdd.push({
              id: ex.id || uuidv4(),
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
        return [...prev, ...toAdd];
      }
      return prev;
    });
  }, [plans, isLoaded]);

  const savePlan = (plan: WorkoutPlan) => {
    setPlans(prev => {
      const index = prev.findIndex(p => p.id === plan.id);
      if (index >= 0) {
        const newPlans = [...prev];
        newPlans[index] = plan;
        return newPlans;
      }
      return [...prev, plan];
    });
  };
  const deletePlan = (id: string) => setPlans(plans.filter(p => p.id !== id));

  const handleLogPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setActiveTab('log');
  };

  const addSession = (session: WorkoutSession) => {
    setSessions([session, ...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setActiveTab('assessment');
  };
  const deleteSession = (id: string) => setSessions(sessions.filter(s => s.id !== id));

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'plans', label: 'Plans', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'exercises', label: 'Exercises', icon: <Layers className="w-4 h-4" /> },
    { id: 'log', label: 'Log Workout', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'assessment', label: 'Assessment', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <LineChart className="w-4 h-4" /> },
    { id: 'records', label: 'Records', icon: <Trophy className="w-4 h-4" /> },
  ];

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen text-neutral-50 font-sans selection:bg-red-500/30 relative overflow-x-hidden max-w-full">
      <div className="fixed inset-0 z-[-1] bg-neutral-950">
        <img 
          src={bgImage} 
          alt="Physique Background" 
          className="w-full h-full object-cover opacity-90 sm:opacity-80 object-[center_18%] sm:object-center transition-opacity duration-300" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/70 pointer-events-none"></div>
      </div>
      <div className="max-w-5xl mx-auto px-3 py-4 sm:py-8 sm:px-6 lg:px-8 relative z-10 min-w-0 w-full">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1.5 sm:mb-2">
            <div className="bg-red-600 text-white p-2 rounded-xl shadow-lg shadow-red-950/50">
              <Dumbbell className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-50 drop-shadow-md">
              Workout Tracker
            </h1>
          </div>
          <p className="text-neutral-200 text-sm sm:text-base drop-shadow-md">Create plans, manage exercises, log workouts, and visualize progress.</p>
        </header>

        <nav className="flex space-x-1 sm:space-x-2 bg-black/65 backdrop-blur-sm border border-neutral-800 p-1.5 sm:p-1 rounded-xl mb-6 sm:mb-8 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? 'bg-red-600/35 text-red-200 shadow-sm ring-1 ring-red-500/50'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="bg-black/75 backdrop-blur-sm rounded-2xl shadow-[0_0_50px_-10px_rgba(220,38,38,0.2)] border border-neutral-800 p-3 sm:p-6 lg:p-8 min-h-[500px] min-w-0 w-full overflow-hidden">
          {activeTab === 'plans' && <PlanManager plans={plans} onSavePlan={savePlan} onDeletePlan={deletePlan} onLogPlan={handleLogPlan} onReorderPlans={setPlans} />}
          {activeTab === 'exercises' && <ExerciseManager exercises={exerciseItems} plans={plans} sessions={sessions} onSaveExercises={setExerciseItems} />}
          {activeTab === 'log' && <WorkoutForm sessions={sessions} plans={plans} selectedPlanId={selectedPlanId} exerciseItems={exerciseItems} onSelectPlan={setSelectedPlanId} onSaveSession={addSession} />}
          {activeTab === 'assessment' && <Assessment sessions={sessions} />}
          {activeTab === 'history' && <WorkoutList sessions={sessions} onDelete={deleteSession} />}
          {activeTab === 'progress' && <ProgressChart sessions={sessions} />}
          {activeTab === 'records' && <PersonalRecords sessions={sessions} />}
        </main>
      </div>
    </div>
  );
}
