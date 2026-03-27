export interface Exercise {
  id: number;
  session_id: number;
  name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
}

export interface CreateExerciseRequest {
  name: string;
  sets: number;
  reps: number;
  weight_kg?: number;
}
