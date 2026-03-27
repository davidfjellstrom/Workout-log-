import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSession, addExercise } from '../services/api';
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

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await getSession(Number(id));
        setSession(data);
      } catch {
        setError('Could not load workout');
      }
    };

    fetchSession();
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
            <div className="form-group">
              <label htmlFor="name">Exercise:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Bench press"
                required
              />
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
