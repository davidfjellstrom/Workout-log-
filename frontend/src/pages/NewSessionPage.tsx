import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getSessions } from '../services/api';

export default function NewSessionPage() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionTitles, setSessionTitles] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getSessions()
      .then((sessions) => {
        const unique = [...new Set(sessions.map((s) => s.title))];
        setSessionTitles(unique);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const newSession = await createSession({ title, date });
      navigate(`/sessions/${newSession.id}`);
    } catch {
      setError('Could not create workout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-wrapper">
        <h1>New workout</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Chest & triceps"
              list="title-suggestions"
              required
            />
            <datalist id="title-suggestions">
              {sessionTitles.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create workout'}
          </button>
        </form>
      </div>
    </div>
  );
}
