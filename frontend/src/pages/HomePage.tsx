import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="home-content">
        <h1>Välkommen till Träningsdagboken</h1>

        {user ? (
          <div className="logged-in">
            <p>Du är inloggad som <strong>{user.username}</strong>.</p>
            <Link to="/sessions" className="cta-button">Visa mina träningspass</Link>
          </div>
        ) : (
          <div className="logged-out">
            <p>Logga in eller skapa ett konto för att börja logga dina träningspass.</p>
            <div className="cta-links">
              <Link to="/login" className="cta-button">Logga in</Link>
              <Link to="/register" className="cta-button secondary">Skapa konto</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
