import { useState, useEffect } from 'react';
import { getSession, updateSession, updateExercise, deleteExercise } from '../services/api';
import { Session } from '../types/session';
import { Exercise } from '../types/exercise';
import { SessionListItem } from '../types/session';
import './SessionEditModal.css';

const INTENSITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface Props {
  sessionId: number;
  onClose: () => void;
  onSaved: (updated: SessionListItem) => void;
}

export default function SessionEditModal({ sessionId, onClose, onSaved }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [sessionSaved, setSessionSaved] = useState(false);
  const [sessionSaveError, setSessionSaveError] = useState('');
  const [exerciseSavedId, setExerciseSavedId] = useState<number | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<{ sets: string; reps: string; weight_kg: string; duration_minutes: string; intensity: string }>({ sets: '', reps: '', weight_kg: '', duration_minutes: '', intensity: '' });

  useEffect(() => {
    getSession(sessionId).then((data) => {
      setSession(data);
      setTitle(data.title);
      setDate(String(data.date));
    });
  }, [sessionId]);

  const handleSaveSession = async () => {
    setSessionSaveError('');
    try {
      const updated = await updateSession(sessionId, { title, date });
      onSaved(updated);
      setSessionSaved(true);
      setTimeout(() => {
        setSessionSaved(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSessionSaveError(detail ? `Fel: ${detail}` : 'Kunde inte spara. Försök igen.');
      console.error('updateSession failed:', err);
    }
  };

  const startEditExercise = (ex: Exercise) => {
    setEditingExerciseId(ex.id);
    setEditFields({
      sets: String(ex.sets),
      reps: String(ex.reps),
      weight_kg: ex.weight_kg != null ? String(ex.weight_kg) : '',
      duration_minutes: ex.duration_minutes != null ? String(ex.duration_minutes) : '',
      intensity: ex.intensity != null ? String(ex.intensity) : '',
    });
  };

  const handleSaveExercise = async (ex: Exercise) => {
    try {
      const updated = await updateExercise(sessionId, ex.id, {
        sets: editFields.sets ? Number(editFields.sets) : undefined,
        reps: editFields.reps ? Number(editFields.reps) : undefined,
        weight_kg: editFields.weight_kg ? Number(editFields.weight_kg) : undefined,
        duration_minutes: editFields.duration_minutes ? Number(editFields.duration_minutes) : undefined,
        intensity: editFields.intensity ? Number(editFields.intensity) : undefined,
      });
      setSession((prev) => prev ? { ...prev, exercises: prev.exercises.map((e) => e.id === updated.id ? updated : e) } : prev);
      setExerciseSavedId(updated.id);
      setTimeout(() => setExerciseSavedId(null), 2000);
      setEditingExerciseId(null);
    } catch {
      // ignore
    }
  };

  const handleDeleteExercise = async (ex: Exercise) => {
    if (!confirm(`Ta bort "${ex.name}"?`)) return;
    try {
      await deleteExercise(sessionId, ex.id);
      setSession((prev) => prev ? { ...prev, exercises: prev.exercises.filter((e) => e.id !== ex.id) } : prev);
    } catch {
      // ignore
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>Redigera pass</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {!session ? (
          <p className="modal-loading">Laddar...</p>
        ) : (
          <>
            <div className="modal-fields">
              <div className="modal-field">
                <label>Titel</label>
                <input className="modal-input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Datum</label>
                <input className="modal-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="modal-save-btn" onClick={handleSaveSession}>Spara titel & datum</button>
              {sessionSaved && <span className="modal-saved-confirm">✓ Sparad!</span>}
              {sessionSaveError && <span className="modal-save-error">{sessionSaveError}</span>}
            </div>

            <h3 className="modal-exercises-title">Övningar</h3>
            {session.exercises.length === 0 ? (
              <p className="modal-empty">Inga övningar ännu.</p>
            ) : (
              <ul className="modal-exercises">
                {session.exercises.map((ex) => (
                  <li key={ex.id} className="modal-exercise-row">
                    {editingExerciseId === ex.id ? (
                      <div className="modal-exercise-edit">
                        <span className="modal-exercise-name">{ex.name}</span>
                        <div className="modal-exercise-inputs">
                          {!ex.is_cardio ? (
                            <>
                              <label>Sets<input className="modal-small-input" type="number" value={editFields.sets} onChange={(e) => setEditFields((f) => ({ ...f, sets: e.target.value }))} /></label>
                              <label>Reps<input className="modal-small-input" type="number" value={editFields.reps} onChange={(e) => setEditFields((f) => ({ ...f, reps: e.target.value }))} /></label>
                              <label>Vikt<input className="modal-small-input" type="number" value={editFields.weight_kg} onChange={(e) => setEditFields((f) => ({ ...f, weight_kg: e.target.value }))} placeholder="—" /></label>
                            </>
                          ) : (
                            <label>Duration<input className="modal-small-input" type="number" value={editFields.duration_minutes} onChange={(e) => setEditFields((f) => ({ ...f, duration_minutes: e.target.value }))} placeholder="—" /></label>
                          )}
                        </div>
                        <div className="modal-intensity">
                          <label>Intensitet: <span className="intensity-value">{editFields.intensity ? `${editFields.intensity}/10` : '—'}</span></label>
                          <input type="range" min={1} max={10} step={1} value={editFields.intensity || ''} onChange={(e) => setEditFields((f) => ({ ...f, intensity: e.target.value }))} className="intensity-slider" style={{ '--val': editFields.intensity || 1 } as React.CSSProperties} />
                          <div className="intensity-ticks">{INTENSITY_OPTIONS.map((n) => <span key={n}>{n}</span>)}</div>
                        </div>
                        <div className="modal-exercise-actions">
                          <button className="save-btn" onClick={() => handleSaveExercise(ex)}>Spara</button>
                          <button className="cancel-btn" onClick={() => setEditingExerciseId(null)}>Avbryt</button>
                          {exerciseSavedId === ex.id && <span className="modal-saved-confirm">✓ Sparad!</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="modal-exercise-view">
                        <div className="modal-exercise-info">
                          <span className="modal-exercise-name">{ex.name}</span>
                          <span className="modal-exercise-meta">
                            {!ex.is_cardio ? (ex.weight_kg != null ? `${ex.sets}×${ex.reps} @ ${ex.weight_kg}kg` : `${ex.sets}×${ex.reps}`) : ''}
                            {ex.duration_minutes != null ? ` ${ex.duration_minutes}min` : ''}
                            {ex.intensity != null ? ` · ${ex.intensity}/10` : ''}
                          </span>
                        </div>
                        <div className="modal-exercise-btns">
                          <button className="exercise-icon-btn" onClick={() => startEditExercise(ex)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="exercise-icon-btn delete-icon-btn" onClick={() => handleDeleteExercise(ex)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
