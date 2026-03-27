import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../services/api';

export default function NewSessionPage() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Dagens datum som default
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const newSession = await createSession({ title, date });
      navigate(`/sessions/${newSession.id}`); // Gå direkt till det nya passet
    } catch {
      setError('Kunde inte skapa träningspasset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-wrapper">
        <h1>Nytt träningspass</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Titel:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Bröst & triceps"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">Datum:</label>
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
            {loading ? 'Skapar...' : 'Skapa pass'}
          </button>
        </form>
      </div>
    </div>
  );
}
