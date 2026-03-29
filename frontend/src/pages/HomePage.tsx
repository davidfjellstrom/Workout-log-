import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="page-container">
      <div className="home-content">
        <h1>Welcome to Workout Log</h1>

        {loading ? null : user ? (
          <div className="logged-in">
            <p>You are logged in as <strong>{user.username}</strong>.</p>
            <Link to="/sessions" className="cta-button">View my workouts</Link>
          </div>
        ) : (
          <div className="logged-out">
            <p>Log in or create an account to start tracking your workouts.</p>
            <div className="cta-links">
              <Link to="/login" className="cta-button">Log in</Link>
              <Link to="/register" className="cta-button secondary">Create account</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
