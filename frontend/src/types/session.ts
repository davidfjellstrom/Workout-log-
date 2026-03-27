import { Exercise } from './exercise';

export interface Session {
  id: number;
  user_id: number;
  title: string;
  date: string;        // "YYYY-MM-DD"
  created_at: string;
  exercises: Exercise[];
}

export interface SessionListItem {
  id: number;
  title: string;
  date: string;
  created_at: string;
  exercise_count: number;
}

export interface CreateSessionRequest {
  title: string;
  date: string;        // "YYYY-MM-DD"
}
