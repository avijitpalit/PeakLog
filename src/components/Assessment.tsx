import React, { useState } from 'react';
import { WorkoutSession, LoggedExercise } from '../types';
import { Copy, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AssessmentProps {
  sessions: WorkoutSession[];
}

interface AssessmentCardProps {
  key?: string;
  session: WorkoutSession;
  isCopied: boolean;
  onCopy: (id: string, text: string) => void;
  textToCopy: string;
}

function AssessmentCard({ session, isCopied, onCopy, textToCopy }: AssessmentCardProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const checkOverflow = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isOverflowing = el.scrollHeight > el.clientHeight;
    const isScrolledToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 12;
    setHasOverflow(isOverflowing && !isScrolledToBottom);
  }, []);

  React.useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [checkOverflow, textToCopy]);

  return (
    <div className="relative group bg-[#111111] border border-neutral-800 rounded-xl overflow-hidden shadow-sm h-64 sm:h-72 flex flex-col">
      <div className="flex justify-between items-center bg-[#0f0f0f] border-b border-neutral-800 px-4 py-2.5 shrink-0">
        <div className="font-medium text-neutral-200 text-sm truncate pr-2">
          {format(parseISO(session.date), 'MMM d, yyyy')} <span className="text-neutral-500">•</span> {session.planName}
        </div>
        <button
          type="button"
          onClick={() => onCopy(session.id, textToCopy)}
          title={isCopied ? 'Copied to clipboard' : 'Copy to clipboard'}
          aria-label={isCopied ? 'Copied to clipboard' : 'Copy to clipboard'}
          className={`shrink-0 p-2 rounded-lg transition-colors flex items-center justify-center ${
            isCopied 
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-sm' 
              : 'bg-[#141414] border border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:border-neutral-700 hover:bg-[#1a1a1a]'
          }`}
        >
          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        <div 
          ref={scrollRef}
          onScroll={checkOverflow}
          className="h-full overflow-y-auto p-3.5 sm:p-4"
        >
          <pre className="text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed">
            {textToCopy}
          </pre>
        </div>

        {/* Bottom fade out when content overflows */}
        {hasOverflow && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#111111] via-[#111111]/85 to-transparent transition-opacity duration-200" />
        )}
      </div>
    </div>
  );
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-semibold text-neutral-50 mb-1">Assessment</h2>
        <p className="text-sm text-neutral-400">Copy your logged sessions in text format for AI assessment.</p>
      </div>

      <div className="space-y-6">
        {sessions.map(session => {
          const textToCopy = generateAssessmentText(session);
          const isCopied = copiedId === session.id;

          return (
            <AssessmentCard
              key={session.id}
              session={session}
              isCopied={isCopied}
              onCopy={handleCopy}
              textToCopy={textToCopy}
            />
          );
        })}
      </div>
    </div>
  );
}
