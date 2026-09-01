import React, { useState } from 'react';
import { WorkoutSession, LoggedExercise } from '../types';
import { Copy, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AssessmentProps {
  sessions: WorkoutSession[];
}

export function Assessment({ sessions }: AssessmentProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-300">
        <h3 className="text-lg font-medium text-neutral-50 mb-1">No sessions logged</h3>
        <p className="text-sm text-neutral-400">Log a workout to see your assessment here.</p>
      </div>
    );
  }

  const generateAssessmentText = (session: WorkoutSession) => {
    let text = `${format(parseISO(session.date), 'EEEE, MMMM d, yyyy')} - ${session.planName}\n`;
    if (session.notes) text += `Session Notes: ${session.notes}\n`;
    
    session.exercises.forEach((ex) => {
      const weightLabel = ex.targetWeight ? ` (${ex.targetWeight})` : '';
      text += `\n${ex.name}${weightLabel} (${ex.targetSets} × ${ex.targetReps})\n`;
      
      if (ex.notes && ex.notes.trim()) {
        text += `Exercise Note: ${ex.notes.trim()}\n`;
      }

      if (ex.status === 'missed') {
        text += `Missed today\n`;
        return;
      }

      const groups: { weight: string, sets: { reps: string, rir?: string, notes: string }[] }[] = [];
      for (const set of ex.sets) {
        const wStr = set.weight.trim();
        const setObj = {
          reps: set.reps.trim(),
          rir: set.rir?.trim(),
          notes: set.notes.trim()
        };

        if (groups.length > 0 && groups[groups.length - 1].weight === wStr) {
          groups[groups.length - 1].sets.push(setObj);
        } else {
          groups.push({ weight: wStr, sets: [setObj] });
        }
      }

      const formattedGroups = groups.map(g => {
        const setStrings = g.sets.map((s) => {
          const details: string[] = [];
          if (s.rir) {
            details.push(s.rir.toLowerCase().includes('rir') ? s.rir : `RIR ${s.rir}`);
          }
          if (s.notes) {
            details.push(s.notes);
          }

          if (details.length > 0) {
            return `${s.reps} (${details.join(', ')})`;
          }
          return s.reps;
        });
        
        let prefix = '';
        if (g.weight) {
          prefix = g.weight.endsWith('-') ? `${g.weight} ` : `${g.weight} - `;
        }
        return `${prefix}${setStrings.join(', ')}`;
      });

      if (formattedGroups.length > 0) {
        text += `${formattedGroups.join(', ')}\n`;
      }
    });

    return text.trim();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-semibold text-neutral-50 mb-1">Assessment</h2>
        <p className="text-sm text-neutral-400">Copy your logged sessions in text format for AI assessment.</p>
      </div>

      <div className="space-y-8">
        {sessions.map(session => {
          const textToCopy = generateAssessmentText(session);
          const isCopied = copiedId === session.id;

          return (
            <div key={session.id} className="relative group bg-[#111111] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
              <div className="flex justify-between items-center bg-[#0f0f0f] border-b border-neutral-800 px-4 py-3">
                <div className="font-semibold text-neutral-50">
                  {format(parseISO(session.date), 'MMM d, yyyy')} - {session.planName}
                </div>
                <button
                  onClick={() => handleCopy(session.id, textToCopy)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isCopied 
                      ? 'bg-red-950/40 text-red-400 border border-red-500/30' 
                      : 'bg-[#0f0f0f] border border-neutral-800 text-neutral-300 hover:bg-[#111111]'
                  }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-base sm:text-sm text-neutral-200 font-mono whitespace-pre-wrap leading-relaxed">
                  {textToCopy}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
