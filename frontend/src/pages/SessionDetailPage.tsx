import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSession, addExercise, getExerciseNames, ExerciseNameEntry } from '../services/api';
import { Session } from '../types/session';
import { Exercise } from '../types/exercise';
import ScrollPicker from '../components/ScrollPicker';
import './SessionDetailPage.css';

const SETS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const REPS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 25, 30];
const WEIGHT_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 140, 160];

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
  const [exerciseNames, setExerciseNames] = useState<ExerciseNameEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tracksWeight, setTracksWeight] = useState(true);
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
            <div className="form-group">
              <label>Sets:</label>
              <ScrollPicker value={sets} onChange={setSets} options={SETS_OPTIONS} required />
            </div>
            <div className="form-group">
              <label>Reps:</label>
              <ScrollPicker value={reps} onChange={setReps} options={REPS_OPTIONS} required />
            </div>
            {tracksWeight && (
              <div className="form-group">
                <label>Weight (kg, optional):</label>
                <ScrollPicker value={weightKg} onChange={setWeightKg} options={WEIGHT_OPTIONS} />
              </div>
            )}
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
