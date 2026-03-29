import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getSessions } from '../services/api';
import './NewSessionPage.css';

export default function NewSessionPage() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionTitles, setSessionTitles] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getSessions()
      .then((sessions) => {
        const unique = [...new Set(sessions.map((s) => s.title))];
        setSessionTitles(unique);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = title
    ? sessionTitles.filter((t) => t.toLowerCase().includes(title.toLowerCase()))
    : sessionTitles;

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
          <div className="form-group" ref={wrapperRef} style={{ position: 'relative' }}>
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="E.g. Chest & triceps"
              autoComplete="off"
              required
            />
            {showSuggestions && filtered.length > 0 && (
              <ul className="autocomplete-list">
                {filtered.map((t) => (
                  <li
                    key={t}
                    className="autocomplete-item"
                    onMouseDown={() => { setTitle(t); setShowSuggestions(false); }}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}
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
