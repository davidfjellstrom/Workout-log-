import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>Workout Log</h1>
        </Link>
        <nav className="nav">
          {loading ? null : user ? (
            <>
              <span className="welcome">Hey, {user.username}!</span>
              <Link to="/sessions" className="nav-link">My Workouts</Link>
              <Link to="/stats" className="nav-link">Stats</Link>
              <button onClick={logout} className="nav-button">Log out</button>
            </>
          ) : (
            <>
              <Link to="/register" className="nav-link">Register</Link>
              <Link to="/login" className="nav-link">Log in</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
