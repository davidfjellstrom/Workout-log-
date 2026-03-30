import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSession, addExercise, updateExercise, getExerciseNames, ExerciseNameEntry } from '../services/api';
import { Session } from '../types/session';
import { Exercise } from '../types/exercise';
import ScrollPicker from '../components/ScrollPicker';
import './SessionDetailPage.css';

const SETS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const REPS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 25, 30];
const WEIGHT_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 140, 160];
const DURATION_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90, 105, 120];
const INTENSITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [intensity, setIntensity] = useState('');
  const [formError, setFormError] = useState('');
  const [addingExercise, setAddingExercise] = useState(false);
  const [exerciseNames, setExerciseNames] = useState<ExerciseNameEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tracksWeight, setTracksWeight] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<{ sets: string; reps: string; weight_kg: string; duration_minutes: string; intensity: string }>({ sets: '', reps: '', weight_kg: '', duration_minutes: '', intensity: '' });
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await getSession(Number(id));
        setSession(data);
      } catch {
        setError('Could not load workout');
      }
    };

    const fetchExerciseNames = async () => {
      try {
        const names = await getExerciseNames();
        setExerciseNames(names);
      } catch {
        // Non-critical, ignore
      }
    };

    fetchSession();
    fetchExerciseNames();

    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [id]);

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setAddingExercise(true);

    try {
      const newExercise: Exercise = await addExercise(Number(id), {
        name,
        sets: tracksWeight && sets ? Number(sets) : undefined,
        reps: tracksWeight && reps ? Number(reps) : undefined,
        weight_kg: tracksWeight && weightKg ? Number(weightKg) : undefined,
        duration_minutes: !tracksWeight && durationMinutes ? Number(durationMinutes) : undefined,
        intensity: intensity ? Number(intensity) : undefined,
      });

      setSession((prev) =>
        prev ? { ...prev, exercises: [...prev.exercises, newExercise] } : prev
      );

      setName('');
      setSets('');
      setReps('');
      setWeightKg('');
      setDurationMinutes('');
      setIntensity('');
    } catch {
      setFormError('Could not add exercise');
    } finally {
      setAddingExercise(false);
    }
  };

  const startEdit = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setEditFields({
      sets: String(exercise.sets),
      reps: String(exercise.reps),
      weight_kg: exercise.weight_kg != null ? String(exercise.weight_kg) : '',
      duration_minutes: exercise.duration_minutes != null ? String(exercise.duration_minutes) : '',
      intensity: exercise.intensity != null ? String(exercise.intensity) : '',
    });
  };

  const handleSaveEdit = async (exercise: Exercise) => {
    try {
      const updated = await updateExercise(Number(id), exercise.id, {
        sets: editFields.sets ? Number(editFields.sets) : undefined,
        reps: editFields.reps ? Number(editFields.reps) : undefined,
        weight_kg: editFields.weight_kg ? Number(editFields.weight_kg) : undefined,
        duration_minutes: editFields.duration_minutes ? Number(editFields.duration_minutes) : undefined,
        intensity: editFields.intensity ? Number(editFields.intensity) : undefined,
      });
      setSession((prev) =>
        prev ? { ...prev, exercises: prev.exercises.map((e) => e.id === updated.id ? updated : e) } : prev
      );
      setEditingId(null);
    } catch {
      // ignore
    }
  };

  if (error) return <div className="page-container"><p className="error-message">{error}</p></div>;
  if (!session) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="detail-header">
        <div>
          <h1>{session.title}</h1>
          <p className="session-date">{session.date}</p>
        </div>
        <Link to="/sessions" className="back-link">← Back</Link>
      </div>

      <h2>Exercises</h2>

      {session.exercises.length === 0 ? (
        <p className="empty-message">No exercises yet. Add the first one below!</p>
      ) : (() => {
          const hasDuration = session.exercises.some((e) => e.duration_minutes != null);
          const hasIntensity = session.exercises.some((e) => e.intensity != null);
          const hasWeight = session.exercises.some((e) => e.weight_kg != null);
          const hasSetsReps = session.exercises.some((e) => e.sets != null || e.reps != null);
          return (
        <table className="exercises-table">
          <thead>
            <tr>
              <th>Exercise</th>
              {hasSetsReps && <th>Sets</th>}
              {hasSetsReps && <th>Reps</th>}
              {hasWeight && <th>Weight (kg)</th>}
              {hasDuration && <th>Duration (min)</th>}
              {hasIntensity && <th>Intensitet</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {session.exercises.map((exercise) => (
              editingId === exercise.id ? (
                <tr key={exercise.id} className="edit-row">
                  <td>{exercise.name}</td>
                  {hasSetsReps && <td><input className="edit-input" type="number" value={editFields.sets} onChange={(e) => setEditFields((f) => ({ ...f, sets: e.target.value }))} /></td>}
                  {hasSetsReps && <td><input className="edit-input" type="number" value={editFields.reps} onChange={(e) => setEditFields((f) => ({ ...f, reps: e.target.value }))} /></td>}
                  {hasWeight && <td><input className="edit-input" type="number" value={editFields.weight_kg} onChange={(e) => setEditFields((f) => ({ ...f, weight_kg: e.target.value }))} placeholder="—" /></td>}
                  {hasDuration && <td><input className="edit-input" type="number" value={editFields.duration_minutes} onChange={(e) => setEditFields((f) => ({ ...f, duration_minutes: e.target.value }))} placeholder="—" /></td>}
                  {hasIntensity && (
                    <td>
                      <input type="range" min={1} max={10} step={1} value={editFields.intensity || ''} onChange={(e) => setEditFields((f) => ({ ...f, intensity: e.target.value }))} className="intensity-slider edit-slider" style={{ '--val': editFields.intensity || 1 } as React.CSSProperties} />
                      <span className="edit-intensity-val">{editFields.intensity ? `${editFields.intensity}/10` : '—'}</span>
                    </td>
                  )}
                  <td className="edit-actions">
                    <button className="save-btn" onClick={() => handleSaveEdit(exercise)}>Spara</button>
                    <button className="cancel-btn" onClick={() => setEditingId(null)}>Avbryt</button>
                  </td>
                </tr>
              ) : (
              <tr key={exercise.id}>
                <td>{exercise.name}</td>
                {hasSetsReps && <td>{exercise.sets ?? '—'}</td>}
                {hasSetsReps && <td>{exercise.reps ?? '—'}</td>}
                {hasWeight && <td>{exercise.weight_kg ?? '—'}</td>}
                {hasDuration && <td>{exercise.duration_minutes ?? '—'}</td>}
                {hasIntensity && <td>{exercise.intensity != null ? `${exercise.intensity}/10` : '—'}</td>}
                <td><button className="edit-btn" onClick={() => startEdit(exercise)}>
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
</button></td>
              </tr>
              )
            ))}
          </tbody>
        </table>
          );
        })()}

      <div className="add-exercise-form">
        <h2>Add exercise</h2>
        <form onSubmit={handleAddExercise}>
          <div className="exercise-form-grid">
            <div className="form-group" ref={autocompleteRef} style={{ position: 'relative' }}>
              <label htmlFor="name">Exercise:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
  const val = e.target.value;
  setName(val);
  setShowSuggestions(true);
  // If user clears or types a name not in the known list, default to showing weight
  const match = exerciseNames.find((en) => en.name.toLowerCase() === val.toLowerCase());
  setTracksWeight(match ? match.tracks_weight : true);
}}
                onFocus={() => setShowSuggestions(true)}
                placeholder="E.g. Bench press"
                autoComplete="off"
                required
              />
              {showSuggestions && exerciseNames.filter((e) =>
                e.name.toLowerCase().includes(name.toLowerCase())
              ).length > 0 && (
                <ul className="autocomplete-list">
                  {exerciseNames
                    .filter((e) => e.name.toLowerCase().includes(name.toLowerCase()))
                    .map((e) => (
                      <li
                        key={e.name}
                        className="autocomplete-item"
                        onMouseDown={() => {
                          setName(e.name);
                          setTracksWeight(e.tracks_weight);
                          if (!e.tracks_weight) setWeightKg('');
                          setShowSuggestions(false);
                        }}
                      >
                        {e.name}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
          <div className="exercise-type-toggle">
            <button
              type="button"
              className={`type-btn${tracksWeight ? ' active' : ''}`}
              onClick={() => setTracksWeight(true)}
            >Styrka</button>
            <button
              type="button"
              className={`type-btn${!tracksWeight ? ' active' : ''}`}
              onClick={() => setTracksWeight(false)}
            >Cardio / Sport</button>
          </div>
          <div className="exercise-form-grid" style={{ marginTop: '1rem' }}>
            {tracksWeight && (
              <>
                <div className="form-group">
                  <label>Sets:</label>
                  <ScrollPicker value={sets} onChange={setSets} options={SETS_OPTIONS} required />
                </div>
                <div className="form-group">
                  <label>Reps:</label>
                  <ScrollPicker value={reps} onChange={setReps} options={REPS_OPTIONS} required />
                </div>
                <div className="form-group">
                  <label>Weight (kg, optional):</label>
                  <ScrollPicker value={weightKg} onChange={setWeightKg} options={WEIGHT_OPTIONS} />
                </div>
              </>
            )}
            {!tracksWeight && (
              <div className="form-group">
                <label>Duration (min):</label>
                <ScrollPicker value={durationMinutes} onChange={setDurationMinutes} options={DURATION_OPTIONS} />
              </div>
            )}
          </div>
          <div className="intensity-row">
            <label className="intensity-label">
              Intensitet: <span className="intensity-value">{intensity ? `${intensity}/10` : '—'}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={intensity || ''}
              onChange={(e) => setIntensity(e.target.value)}
              className="intensity-slider"
              style={{ '--val': intensity || 1 } as React.CSSProperties}
            />
            <div className="intensity-ticks">
              {INTENSITY_OPTIONS.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
          {formError && <p className="error-message">{formError}</p>}
          <button type="submit" className="submit-button" disabled={addingExercise}>
            {addingExercise ? 'Adding...' : 'Add exercise'}
          </button>
        </form>
      </div>
    </div>
  );
}
