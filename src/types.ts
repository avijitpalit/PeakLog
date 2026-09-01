export interface PlanExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  targetWeight?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  notes?: string;
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
  targetWeight?: string;
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
