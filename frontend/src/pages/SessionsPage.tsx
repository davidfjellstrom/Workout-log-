import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSessions, deleteSession } from '../services/api';
import { SessionListItem } from '../types/session';
import './SessionsPage.css';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [error, setError] = useState('');

  // Hämta alla pass när sidan laddas
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch {
        setError('Kunde inte hämta träningspass');
      }
    };

    fetchSessions();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Vill du ta bort passet "${title}"?`)) return;

    try {
      await deleteSession(id);
      // Ta bort passet ur listan utan att hämta om från servern
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Kunde inte ta bort passet');
    }
  };

  return (
    <div className="page-container">
      <div className="sessions-header">
        <h1>Mina träningspass</h1>
        <Link to="/sessions/new" className="new-session-button">+ Nytt pass</Link>
      </div>

      {error && <p className="error-message">{error}</p>}

      {sessions.length === 0 ? (
        <p className="empty-message">Du har inga pass än. Skapa ditt första!</p>
      ) : (
        <ul className="sessions-list">
          {sessions.map((session) => (
            <li key={session.id} className="session-card">
              <Link to={`/sessions/${session.id}`} className="session-link">
                <span className="session-title">{session.title}</span>
                <span className="session-date">{session.date}</span>
                <span className="session-count">{session.exercise_count} övningar</span>
              </Link>
              <button
                className="delete-button"
                onClick={() => handleDelete(session.id, session.title)}
              >
                Ta bort
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
