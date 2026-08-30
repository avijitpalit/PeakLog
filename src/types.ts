export interface PlanExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  exercises: PlanExercise[];
}

export interface LoggedSet {
  id: string;
  weight: string;
  reps: string;
  rir?: string;
  notes: string;
}

export interface LoggedExercise {
  id: string;
  planExerciseId: string;
  name: string;
  targetSets: number;
  targetReps: string;
  status: 'completed' | 'missed';
  notes: string;
  sets: LoggedSet[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  planId: string;
  planName: string;
  notes?: string;
  exercises: LoggedExercise[];
}
