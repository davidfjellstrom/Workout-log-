import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUser } from '../services/api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('Användarnamnet måste vara minst 3 tecken');
      return;
    }
    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken');
      return;
    }

    setLoading(true);
    try {
      await createUser({ username, password });
      navigate('/login');
    } catch {
      setError('Användarnamnet är redan taget eller något gick fel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-wrapper">
        <h1>Skapa konto</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Användarnamn:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Minst 3 tecken"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Lösenord:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minst 6 tecken"
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Skapar konto...' : 'Skapa konto'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Har du redan ett konto? <Link to="/login">Logga in här</Link>
        </p>
      </div>
    </div>
  );
}
