import React, { useState, useEffect } from 'react';
import { Dumbbell, LineChart, Trophy, History, ClipboardList, BookOpen } from 'lucide-react';
import { WorkoutPlan, WorkoutSession } from './types';
import { PlanManager } from './components/PlanManager';
import { WorkoutForm } from './components/WorkoutForm';
import { Assessment } from './components/Assessment';
import { WorkoutList } from './components/WorkoutList';
import { ProgressChart } from './components/ProgressChart';
import { PersonalRecords } from './components/PersonalRecords';
import bgImage from './assets/images/aesthetic_physique_red_black_1788073512734.jpg';

type Tab = 'plans' | 'log' | 'assessment' | 'history' | 'progress' | 'records';

export default function App() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('plans');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedPlans = localStorage.getItem('workout_plans');
    const savedSessions = localStorage.getItem('workout_sessions');
    if (savedPlans) setPlans(JSON.parse(savedPlans));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('workout_plans', JSON.stringify(plans));
      localStorage.setItem('workout_sessions', JSON.stringify(sessions));
    }
  }, [plans, sessions, isLoaded]);

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
    { id: 'log', label: 'Log Workout', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'assessment', label: 'Assessment', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <LineChart className="w-4 h-4" /> },
    { id: 'records', label: 'Records', icon: <Trophy className="w-4 h-4" /> },
  ];

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen text-neutral-50 font-sans selection:bg-red-500/30 relative">
      <div className="fixed inset-0 z-[-1] bg-black">
        <img src={bgImage} alt="Background" className="w-full h-full object-cover opacity-40 object-top sm:object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black"></div>
      </div>
      <div className="max-w-5xl mx-auto px-3 py-4 sm:py-8 sm:px-6 lg:px-8 relative z-10">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-700 text-white p-2 rounded-xl shadow-sm">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-50">
              Workout Tracker
            </h1>
          </div>
          <p className="text-neutral-400">Create plans, log exercises, and visualize progress.</p>
        </header>

        <nav className="flex space-x-1 sm:space-x-2 bg-[#0a0a0a] border border-neutral-900 p-1.5 sm:p-1 rounded-xl mb-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? 'bg-red-950/30 text-red-400 shadow-sm ring-1 ring-red-900/50'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1a1a1a]'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="bg-black/80 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_-10px_rgba(220,38,38,0.15)] border border-neutral-800 p-3 sm:p-6 lg:p-8 min-h-[500px]">
          {activeTab === 'log' && <WorkoutForm sessions={sessions} plans={plans} selectedPlanId={selectedPlanId} onSelectPlan={setSelectedPlanId} onSaveSession={addSession} />}
          {activeTab === 'plans' && <PlanManager plans={plans} onSavePlan={savePlan} onDeletePlan={deletePlan} onLogPlan={handleLogPlan} />}
          {activeTab === 'assessment' && <Assessment sessions={sessions} />}
          {activeTab === 'history' && <WorkoutList sessions={sessions} onDelete={deleteSession} />}
          {activeTab === 'progress' && <ProgressChart sessions={sessions} />}
          {activeTab === 'records' && <PersonalRecords sessions={sessions} />}
        </main>
      </div>
    </div>
  );
}
