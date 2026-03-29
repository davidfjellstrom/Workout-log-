import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSessions, deleteSession } from '../services/api';
import { SessionListItem } from '../types/session';
import './SessionsPage.css';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch {
        setError('Could not load workouts');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete workout "${title}"?`)) return;

    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Could not delete workout');
    }
  };

  return (
    <div className="page-container">
      <div className="sessions-header">
        <h1>My Workouts</h1>
        <Link to="/sessions/new" className="new-session-button">+ New workout</Link>
      </div>

      {error && <p className="error-message">{error}</p>}

      {loading ? null : sessions.length === 0 ? (
        <p className="empty-message">No workouts yet. Create your first one!</p>
      ) : (
        <ul className="sessions-list">
          {sessions.map((session, i) => (
            <li key={session.id} className="session-card" style={{ '--card-index': i } as React.CSSProperties}>
              <Link to={`/sessions/${session.id}`} className="session-link">
                <span className="session-title">{session.title}</span>
                <span className="session-date">{session.date}</span>
                <span className="session-count">{session.exercise_count} exercises</span>
              </Link>
              <button
                className="delete-button"
                onClick={() => handleDelete(session.id, session.title)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
