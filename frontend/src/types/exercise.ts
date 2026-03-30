export interface Exercise {
  id: number;
  session_id: number;
  name: string;
  is_cardio: boolean;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_minutes: number | null;
  intensity: number | null;
}

export interface CreateExerciseRequest {
  name: string;
  is_cardio?: boolean;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration_minutes?: number;
  intensity?: number;
}
