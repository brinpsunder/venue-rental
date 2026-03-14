import { useNavigate } from 'react-router-dom';
import { logout, getUser } from '../services/authService';
import styles from './Dashboard.module.css';

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    logout();
    onLogout();
    navigate('/login');
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Venue Rental</h1>
            <p className={styles.subtitle}>Welcome back, {user?.email}</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>

        <div className={styles.badge}>
          {user?.role === 'OWNER' ? '🏠 Owner' : '🔍 Renter'}
        </div>

        <p className={styles.placeholder}>
          More features coming soon – venue listings, reservations, and more.
        </p>
      </div>
    </div>
  );
}
