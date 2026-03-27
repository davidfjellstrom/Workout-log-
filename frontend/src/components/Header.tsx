import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>Träningsdagbok</h1>
        </Link>
        <nav className="nav">
          {user ? (
            <>
              <span className="welcome">Hej, {user.username}!</span>
              <Link to="/sessions" className="nav-link">Mina pass</Link>
              <button onClick={logout} className="nav-button">Logga ut</button>
            </>
          ) : (
            <>
              <Link to="/register" className="nav-link">Registrera</Link>
              <Link to="/login" className="nav-link">Logga in</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
