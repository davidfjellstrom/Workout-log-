import api from '../config/axios';
import { CreateUserRequest, User } from '../types/user';
import { Session, SessionListItem, CreateSessionRequest } from '../types/session';
import { Exercise, CreateExerciseRequest } from '../types/exercise';

// --- Användare ---

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await api.post('/users/', data);
  return response.data;
}

// --- Autentisering ---

interface LoginResponse {
  user_id: number;
  username: string;
  message: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<LoginResponse> {
  const response = await api.get('/auth/me');
  return response.data;
}

// --- Träningspass ---

let sessionsCache: SessionListItem[] | null = null;

export function getCachedSessions(): SessionListItem[] | null {
  return sessionsCache;
}

export function clearSessionsCache() {
  sessionsCache = null;
}

export async function getSessions(): Promise<SessionListItem[]> {
  const response = await api.get('/sessions/');
  sessionsCache = response.data;
  return response.data;
}

export async function createSession(data: CreateSessionRequest): Promise<Session> {
  const response = await api.post('/sessions/', data);
  return response.data;
}

export async function getSession(sessionId: number): Promise<Session> {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
}

export async function deleteSession(sessionId: number): Promise<void> {
  await api.delete(`/sessions/${sessionId}`);
}

// --- Övningar ---

export async function addExercise(sessionId: number, data: CreateExerciseRequest): Promise<Exercise> {
  const response = await api.post(`/sessions/${sessionId}/exercises`, data);
  return response.data;
}

export async function updateExercise(sessionId: number, exerciseId: number, data: Partial<CreateExerciseRequest>): Promise<Exercise> {
  const response = await api.patch(`/sessions/${sessionId}/exercises/${exerciseId}`, data);
  return response.data;
}

export interface ExerciseNameEntry {
  name: string;
  tracks_weight: boolean;
}

export async function getExerciseNames(): Promise<ExerciseNameEntry[]> {
  const response = await api.get('/sessions/exercise-names');
  return response.data;
}

// --- Statistik ---

export async function getStats() {
  const res = await api.get('/stats/');
  return res.data;
}
