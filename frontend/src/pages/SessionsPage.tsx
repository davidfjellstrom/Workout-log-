import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSessions, deleteSession, duplicateSession, getCachedSessions } from '../services/api';
import { SessionListItem } from '../types/session';
import SessionEditModal from '../components/SessionEditModal';
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
  const cached = getCachedSessions();
  const [sessions, setSessions] = useState<SessionListItem[]>(cached ?? []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(cached === null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalSessionId, setModalSessionId] = useState<number | null>(null);

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

  const handleDuplicate = async (id: number) => {
    try {
      const newSession = await duplicateSession(id);
      setSessions((prev) => [newSession, ...prev]);
      setModalSessionId(newSession.id);
    } catch {
      setError('Could not duplicate workout');
    }
  };

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
                        <button className="session-edit-btn" title="Duplicate workout" onClick={() => handleDuplicate(session.id)}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                        <button className="session-edit-btn" onClick={() => setModalSessionId(session.id)}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="delete-button" onClick={() => handleDelete(session.id, session.title)}>Delete</button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {modalSessionId !== null && (
        <SessionEditModal
          sessionId={modalSessionId}
          onClose={() => setModalSessionId(null)}
          onSaved={(updated) => {
            setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
          }}
        />
      )}
    </div>
  );
}
