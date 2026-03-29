import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSession, addExercise, getExerciseNames } from '../services/api';
import { Session } from '../types/session';
import { Exercise } from '../types/exercise';
import './SessionDetailPage.css';

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [formError, setFormError] = useState('');
  const [addingExercise, setAddingExercise] = useState(false);
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
        sets: Number(sets),
        reps: Number(reps),
        weight_kg: weightKg ? Number(weightKg) : undefined,
      });

      setSession((prev) =>
        prev ? { ...prev, exercises: [...prev.exercises, newExercise] } : prev
      );

      setName('');
      setSets('');
      setReps('');
      setWeightKg('');
    } catch {
      setFormError('Could not add exercise');
    } finally {
      setAddingExercise(false);
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
      ) : (
        <table className="exercises-table">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Sets</th>
              <th>Reps</th>
              <th>Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            {session.exercises.map((exercise) => (
              <tr key={exercise.id}>
                <td>{exercise.name}</td>
                <td>{exercise.sets}</td>
                <td>{exercise.reps}</td>
                <td>{exercise.weight_kg ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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
                onChange={(e) => { setName(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="E.g. Bench press"
                autoComplete="off"
                required
              />
              {showSuggestions && exerciseNames.filter((n) =>
                n.toLowerCase().includes(name.toLowerCase())
              ).length > 0 && (
                <ul className="autocomplete-list">
                  {exerciseNames
                    .filter((n) => n.toLowerCase().includes(name.toLowerCase()))
                    .map((n) => (
                      <li
                        key={n}
                        className="autocomplete-item"
                        onMouseDown={() => { setName(n); setShowSuggestions(false); }}
                      >
                        {n}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="sets">Sets:</label>
              <input
                type="number"
                id="sets"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                min="1"
                required
              />
              <div className="preset-chips">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" className={`preset-chip${sets === String(n) ? ' active' : ''}`} onClick={() => setSets(String(n))}>{n}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reps">Reps:</label>
              <input
                type="number"
                id="reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                min="1"
                required
              />
              <div className="preset-chips">
                {[5, 8, 10, 12, 15].map((n) => (
                  <button key={n} type="button" className={`preset-chip${reps === String(n) ? ' active' : ''}`} onClick={() => setReps(String(n))}>{n}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="weight">Weight (kg, optional):</label>
              <input
                type="number"
                id="weight"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                min="0"
                step="0.5"
              />
              <div className="preset-chips">
                {[10, 20, 30, 40, 60, 80, 100].map((n) => (
                  <button key={n} type="button" className={`preset-chip${weightKg === String(n) ? ' active' : ''}`} onClick={() => setWeightKg(String(n))}>{n}</button>
                ))}
              </div>
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
