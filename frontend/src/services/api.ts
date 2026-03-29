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

// --- Träningspass ---

export async function getSessions(): Promise<SessionListItem[]> {
  const response = await api.get('/sessions/');
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

// --- Statistik ---

export async function getStats() {
  const res = await api.get('/stats/');
  return res.data;
}
