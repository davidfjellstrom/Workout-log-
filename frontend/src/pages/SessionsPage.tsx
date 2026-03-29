import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSessions, deleteSession } from '../services/api';
import { SessionListItem } from '../types/session';
import './SessionsPage.css';

interface Group {
  title: string;
  sessions: SessionListItem[];
}

function groupSessions(sessions: SessionListItem[]): Group[] {
  const map = new Map<string, SessionListItem[]>();
  for (const s of sessions) {
    const key = s.title.trim().toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.values()).map((sessions) => ({
    title: sessions[0].title,
    sessions: sessions.sort((a, b) => b.date.localeCompare(a.date)),
  }));
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const toggleGroup = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const groups = groupSessions(sessions);

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
          {groups.map((group, i) => {
            const key = group.title.trim().toLowerCase();
            const isOpen = expanded.has(key);
            const latest = group.sessions[0];
            return (
              <li key={key} className="session-card group-card" style={{ '--card-index': i } as React.CSSProperties}>
                <button className="group-toggle" onClick={() => toggleGroup(key)}>
                  <span className="session-title">{group.title}</span>
                  <span className="session-date">{latest.date}</span>
                  <span className="session-count">{group.sessions.length} {group.sessions.length === 1 ? 'session' : 'sessions'}</span>
                  <span className={`group-chevron${isOpen ? ' open' : ''}`}>›</span>
                </button>

                {isOpen && (
                  <ul className="group-sessions">
                    {group.sessions.map((session) => (
                      <li key={session.id} className="group-session-row">
                        <Link to={`/sessions/${session.id}`} className="group-session-link">
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
